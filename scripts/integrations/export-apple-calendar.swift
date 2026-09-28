import Foundation
import EventKit

struct CalendarOccurrence: Codable {
    let calendarName: String
    let sourceName: String
    let title: String
    let start: String
    let end: String
    let allDay: Bool
    let location: String?
    let notes: String?
    let url: String?
}

let year = Int(CommandLine.arguments.dropFirst().first ?? "") ?? Calendar.current.component(.year, from: Date())
let eventStore = EKEventStore()
let access = DispatchSemaphore(value: 0)
var granted = false
eventStore.requestFullAccessToEvents { approved, error in
    granted = approved
    if let error { fputs("Calendar access error: \(error)\n", stderr) }
    access.signal()
}
_ = access.wait(timeout: .now() + 30)
guard granted else {
    fputs("Full Calendar read access is required to export a year.\n", stderr)
    exit(2)
}

let calendar = Calendar(identifier: .gregorian)
let start = calendar.date(from: DateComponents(year: year, month: 1, day: 1))!
let end = calendar.date(from: DateComponents(year: year + 1, month: 1, day: 1))!
let formatter = ISO8601DateFormatter()
formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
var occurrences: [CalendarOccurrence] = []

for source in eventStore.calendars(for: .event) where source.title != "Luma" {
    let predicate = eventStore.predicateForEvents(withStart: start, end: end, calendars: [source])
    for event in eventStore.events(matching: predicate) {
        occurrences.append(CalendarOccurrence(
            calendarName: source.title,
            sourceName: source.source.title,
            title: event.title ?? "",
            start: formatter.string(from: event.startDate),
            end: formatter.string(from: event.endDate),
            allDay: event.isAllDay,
            location: event.location,
            notes: event.notes,
            url: event.url?.absoluteString
        ))
    }
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys]
let data = try encoder.encode(occurrences)
FileHandle.standardOutput.write(data)
