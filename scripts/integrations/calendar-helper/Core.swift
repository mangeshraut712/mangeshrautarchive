import Foundation
import CryptoKit

enum HelperError: Error {
    case configuration, permission, selection, fetch, keychain, upload, identity
}

struct Configuration: Codable {
    var endpoint: String
    var eventCalendarIDs: [String]
    var reminderCalendarIDs: [String]
    var pastDays: Int
    var futureDays: Int
    var allowOtherSources: Bool
    var allowGoogleMirrors: Bool

    func validate() throws {
        guard let url = URL(string: endpoint), url.scheme == "https", url.host != nil,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.path == "/api/calendar-sync/apple/upload",
              !eventCalendarIDs.isEmpty || !reminderCalendarIDs.isEmpty,
              Set(eventCalendarIDs).count == eventCalendarIDs.count,
              Set(reminderCalendarIDs).count == reminderCalendarIDs.count,
              !(eventCalendarIDs + reminderCalendarIDs).contains(where: { $0.isEmpty }),
              pastDays >= 0, futureDays > 0, pastDays + futureDays <= 1460
        else { throw HelperError.configuration }
    }
}

func stableID(calendar: String, uid: String, recurrence: String?) -> String {
    let bytes = try! JSONEncoder().encode(["apple", calendar, uid, recurrence ?? ""])
    return "apple:" + SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
}

func sourceAllowed(title: String, local: Bool, configuration: Configuration) -> Bool {
    let name = title.lowercased()
    let google = ["google", "gmail", "googlemail"].contains { name.contains($0) }
    if google && !configuration.allowGoogleMirrors { return false }
    return local || name == "icloud" || configuration.allowOtherSources
}

func iso(_ date: Date) -> String { ISO8601DateFormatter().string(from: date) }

func day(_ date: Date, zone: TimeZone) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.timeZone = zone
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
}
