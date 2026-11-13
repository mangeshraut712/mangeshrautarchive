import Foundation
import EventKit
import Security
import LocalAuthentication

private let service = "pro.mangeshraut.calendar-sync.apple-upload"

private final class Completion<Value>: @unchecked Sendable {
    let lock = NSLock()
    var continuation: CheckedContinuation<Value, Error>?
    init(_ continuation: CheckedContinuation<Value, Error>) { self.continuation = continuation }
    func finish(_ result: Result<Value, Error>) {
        lock.lock()
        let pending = continuation
        continuation = nil
        lock.unlock()
        pending?.resume(with: result)
    }
}

private func bounded<Value>(_ start: (@escaping (Result<Value, Error>) -> Void) -> Void) async throws -> Value {
    try await withCheckedThrowingContinuation { continuation in
        let completion = Completion(continuation)
        DispatchQueue.global().asyncAfter(deadline: .now() + 45) {
            completion.finish(.failure(HelperError.fetch))
        }
        start { completion.finish($0) }
    }
}

private final class StoreChange: @unchecked Sendable {
    private let lock = NSLock()
    private var changed = false
    func mark() { lock.lock(); changed = true; lock.unlock() }
    func check() throws {
        lock.lock(); let value = changed; lock.unlock()
        if value { throw HelperError.fetch }
    }
}

private struct CalendarRecord: Encodable {
    let id: String, title: String, sourceType: Int, sourceTitle: String
}
private struct EventRecord: Encodable {
    let id: String, calendarId: String, uid: String
    let recurrenceId: String?
    let title: String, start: String, end: String
    let allDay: Bool
    let timeZone: String
    let visibility = "private"
    let url: String?
    let status: String
}
private struct ReminderRecord: Encodable {
    let id: String, calendarId: String, title: String
    let due: String?
    let completed: Bool
    let completedAt: String?
}
private struct Window: Encodable { let start: String, end: String }
private struct Snapshot: Encodable {
    let schemaVersion = 1
    let snapshotId = UUID().uuidString
    let generatedAt: String
    let window: Window
    let calendars: [CalendarRecord]
    let events: [EventRecord]
    let reminders: [ReminderRecord]
}

private func keychainQuery(_ endpoint: String) -> [String: Any] {
    [kSecClass as String: kSecClassGenericPassword,
     kSecAttrService as String: service, kSecAttrAccount as String: endpoint]
}

private func token(_ endpoint: String) throws -> String {
    var query = keychainQuery(endpoint)
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    let context = LAContext()
    context.interactionNotAllowed = true
    query[kSecUseAuthenticationContext as String] = context
    var result: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
          let data = result as? Data, let value = String(data: data, encoding: .utf8)
    else { throw HelperError.keychain }
    return value
}

private func installToken(_ endpoint: String) throws {
    guard isatty(STDIN_FILENO) == 0 else { throw HelperError.configuration }
    let data = FileHandle.standardInput.readData(ofLength: 4097)
    guard let raw = String(data: data, encoding: .utf8) else { throw HelperError.keychain }
    let value = raw.trimmingCharacters(in: .newlines)
    guard (20...4096).contains(value.utf8.count), value.utf8.allSatisfy({ $0 >= 33 && $0 <= 126 })
    else { throw HelperError.keychain }
    let query = keychainQuery(endpoint)
    let attributes = [kSecValueData as String: Data(value.utf8)]
    let result = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    if result == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = Data(value.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw HelperError.keychain }
    } else if result != errSecSuccess { throw HelperError.keychain }
}

private func requireAccess(_ configuration: Configuration) throws {
    if !configuration.eventCalendarIDs.isEmpty && EKEventStore.authorizationStatus(for: .event) != .fullAccess {
        throw HelperError.permission
    }
    if !configuration.reminderCalendarIDs.isEmpty && EKEventStore.authorizationStatus(for: .reminder) != .fullAccess {
        throw HelperError.permission
    }
}

private func selected(_ ids: [String], type: EKEntityType, store: EKEventStore, configuration: Configuration) throws -> [EKCalendar] {
    let available = store.calendars(for: type)
    return try ids.map { id in
        guard let calendar = available.first(where: { $0.calendarIdentifier == id }),
              sourceAllowed(title: calendar.source.title, local: calendar.source.sourceType == .local, configuration: configuration)
        else { throw HelperError.selection }
        return calendar
    }
}

private func collect(_ configuration: Configuration, store: EKEventStore) async throws -> Snapshot {
    try requireAccess(configuration)
    let eventsCalendars = try selected(configuration.eventCalendarIDs, type: .event, store: store, configuration: configuration)
    let remindersCalendars = try selected(configuration.reminderCalendarIDs, type: .reminder, store: store, configuration: configuration)
    let change = StoreChange()
    let observer = NotificationCenter.default.addObserver(forName: .EKEventStoreChanged, object: store, queue: nil) { _ in change.mark() }
    defer { NotificationCenter.default.removeObserver(observer) }
    let now = Date()
    let start = Calendar.current.startOfDay(for: now.addingTimeInterval(-Double(configuration.pastDays) * 86400))
    let end = Calendar.current.startOfDay(for: now.addingTimeInterval(Double(configuration.futureDays) * 86400))
    let events: [EKEvent] = eventsCalendars.isEmpty ? [] : store.events(matching: store.predicateForEvents(withStart: start, end: end, calendars: eventsCalendars))
    let reminders: [EKReminder]
    if remindersCalendars.isEmpty { reminders = [] }
    else {
        reminders = try await bounded { finish in
            store.fetchReminders(matching: store.predicateForReminders(in: remindersCalendars)) { result in
                guard let result else { finish(.failure(HelperError.fetch)); return }
                finish(.success(result))
            }
        }
    }
    try requireAccess(configuration)
    // A removed selection must never be mistaken for a valid empty snapshot.
    _ = try selected(configuration.eventCalendarIDs, type: .event, store: store, configuration: configuration)
    _ = try selected(configuration.reminderCalendarIDs, type: .reminder, store: store, configuration: configuration)
    let eventRecords = try events.map { event -> EventRecord in
        let uid = event.calendarItemExternalIdentifier ?? event.calendarItemIdentifier
        guard !uid.isEmpty, let eventStart = event.startDate, let eventEnd = event.endDate else { throw HelperError.identity }
        let recurrence = (event.hasRecurrenceRules || event.isDetached) ? event.occurrenceDate.map(iso) : nil
        if (event.hasRecurrenceRules || event.isDetached) && recurrence == nil { throw HelperError.identity }
        let zone = event.timeZone ?? TimeZone.current
        return EventRecord(id: stableID(calendar: event.calendar.calendarIdentifier, uid: uid, recurrence: recurrence),
                           calendarId: event.calendar.calendarIdentifier, uid: uid, recurrenceId: recurrence,
                           title: event.title ?? "", start: event.isAllDay ? day(eventStart, zone: zone) : iso(eventStart),
                           end: event.isAllDay ? day(eventEnd, zone: zone) : iso(eventEnd), allDay: event.isAllDay,
                           timeZone: zone.identifier, url: event.url?.absoluteString,
                           status: event.status == .canceled ? "cancelled" : event.status == .tentative ? "tentative" : event.status == .confirmed ? "confirmed" : "unknown")
    }
    let reminderRecords = try reminders.map { reminder in
        let uid = reminder.calendarItemExternalIdentifier ?? reminder.calendarItemIdentifier
        guard !uid.isEmpty else { throw HelperError.identity }
        let due = reminder.dueDateComponents.flatMap { components -> String? in
            var calendar = components.calendar ?? Calendar(identifier: .gregorian)
            calendar.timeZone = components.timeZone ?? TimeZone.current
            guard let date = calendar.date(from: components) else { return nil }
            return components.hour == nil ? day(date, zone: calendar.timeZone) : iso(date)
        }
        return ReminderRecord(id: stableID(calendar: reminder.calendar.calendarIdentifier, uid: uid, recurrence: nil),
                              calendarId: reminder.calendar.calendarIdentifier, title: reminder.title ?? "",
                              due: due, completed: reminder.isCompleted, completedAt: reminder.completionDate.map(iso))
    }
    guard Set(eventRecords.map(\.id)).count == eventRecords.count,
          Set(reminderRecords.map(\.id)).count == reminderRecords.count else { throw HelperError.identity }
    let calendars = Dictionary((eventsCalendars + remindersCalendars).map { ($0.calendarIdentifier, $0) }, uniquingKeysWith: { first, _ in first })
    try change.check()
    return Snapshot(generatedAt: iso(now), window: Window(start: iso(start), end: iso(end)),
                    calendars: calendars.values.map { CalendarRecord(id: $0.calendarIdentifier, title: $0.title, sourceType: $0.source.sourceType.rawValue, sourceTitle: $0.source.title) }.sorted { $0.id < $1.id },
                    events: eventRecords.sorted { $0.id < $1.id }, reminders: reminderRecords.sorted { $0.id < $1.id })
}

private final class NoRedirect: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}

func requestAuthorization(_ configuration: Configuration) async throws {
    let store = EKEventStore()
    if !configuration.eventCalendarIDs.isEmpty {
        let granted: Bool = try await bounded { finish in store.requestFullAccessToEvents { allowed, error in finish(error == nil ? .success(allowed) : .failure(HelperError.permission)) } }
        guard granted else { throw HelperError.permission }
    }
    if !configuration.reminderCalendarIDs.isEmpty {
        let granted: Bool = try await bounded { finish in store.requestFullAccessToReminders { allowed, error in finish(error == nil ? .success(allowed) : .failure(HelperError.permission)) } }
        guard granted else { throw HelperError.permission }
    }
}

@main struct CalendarHelper {
    @MainActor
    static func main() {
        if CommandLine.arguments.count == 1 {
            runAuthorizationApp()
            return
        }
        Task {
            await runCommandLine()
            exit(0)
        }
        dispatchMain()
    }

    private static func runCommandLine() async {
        do {
            let arguments = try resolveArguments(CommandLine.arguments)
            let command = arguments.command
            let configuration = try JSONDecoder().decode(Configuration.self, from: Data(contentsOf: URL(fileURLWithPath: arguments.configPath)))
            try configuration.validate()
            if command == "install-token" { try installToken(configuration.endpoint); print("Upload credential saved."); return }
            guard ["authorize", "list-calendars", "sync", "validate"].contains(command) else { throw HelperError.configuration }
            let store = EKEventStore()
            if command == "authorize" {
                try await requestAuthorization(configuration)
                print("Requested access granted.")
                return
            }
            try requireAccess(configuration)
            if command == "list-calendars" {
                // Deliberately lists only selection metadata, never event/reminder content.
                for type in [EKEntityType.event, .reminder] where EKEventStore.authorizationStatus(for: type) == .fullAccess {
                    let rows = store.calendars(for: type).map { ["id": $0.calendarIdentifier, "title": $0.title, "source": $0.source.title, "kind": type == .event ? "event" : "reminder"] }
                    FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: rows, options: [.sortedKeys]))
                    print("")
                }
                return
            }
            guard command == "sync" || command == "validate" else { throw HelperError.configuration }
            let snapshot = try await collect(configuration, store: store)
            if command == "validate" { print("Complete snapshot validated; nothing uploaded."); return }
            let credential = try token(configuration.endpoint)
            var request = URLRequest(url: URL(string: configuration.endpoint)!)
            request.httpMethod = "POST"
            request.setValue("Bearer " + credential, forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(snapshot)
            request.timeoutInterval = 60
            let session = URLSession(configuration: .ephemeral, delegate: NoRedirect(), delegateQueue: nil)
            defer { session.invalidateAndCancel() }
            let (_, response) = try await session.data(for: request)
            guard let response = response as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw HelperError.upload }
            print("Apple snapshot uploaded successfully.")
        } catch {
            // Provider errors can contain item content or URLs: emit categories only.
            let category = (error as? HelperError).map { String(describing: $0) } ?? "operation"
            fputs("Calendar helper failed: \(category). Previous server snapshot is preserved.\n", stderr)
            exit(1)
        }
    }
}
