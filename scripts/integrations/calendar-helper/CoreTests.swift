import Foundation

@main struct CoreTests {
    static func main() throws {
        let base = Configuration(endpoint: "https://example.com/api/calendar-sync/apple/upload", eventCalendarIDs: ["events"], reminderCalendarIDs: ["tasks"], pastDays: 365, futureDays: 365, allowOtherSources: false, allowGoogleMirrors: false)
        try base.validate()
        var invalid = base
        invalid.endpoint = "http://example.com/api/calendar-sync/apple/upload"
        assert((try? invalid.validate()) == nil)
        invalid = base
        invalid.eventCalendarIDs = []
        invalid.reminderCalendarIDs = []
        assert((try? invalid.validate()) == nil)
        invalid = base
        invalid.futureDays = 1500
        assert((try? invalid.validate()) == nil)
        invalid = base
        invalid.endpoint = "https://example.com/api/calendar-sync/apple/upload?token=secret"
        assert((try? invalid.validate()) == nil)
        assert(stableID(calendar: "a", uid: "same", recurrence: nil) != stableID(calendar: "b", uid: "same", recurrence: nil))
        assert(stableID(calendar: "a", uid: "same", recurrence: "one") != stableID(calendar: "a", uid: "same", recurrence: "two"))
        assert(stableID(calendar: "a", uid: "same", recurrence: nil) == stableID(calendar: "a", uid: "same", recurrence: nil))
        assert(!sourceAllowed(title: "Google", local: false, configuration: base))
        assert(sourceAllowed(title: "iCloud", local: false, configuration: base))
        invalid = base
        invalid.allowOtherSources = true
        assert(!sourceAllowed(title: "personal@gmail.com", local: false, configuration: invalid))
        assert(sourceAllowed(title: "Work", local: false, configuration: invalid))
        print("Helper core: validation, identity and mirror exclusion passed.")
    }
}
