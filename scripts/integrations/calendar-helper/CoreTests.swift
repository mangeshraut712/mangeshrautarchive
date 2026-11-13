import Foundation

@main struct CoreTests {
    static func main() throws {
        let guiArguments = try resolveArguments(["calendar-helper"], home: URL(fileURLWithPath: "/Users/test-owner"))
        assert(guiArguments.command == "authorize")
        assert(guiArguments.configPath == "/Users/test-owner/Library/Application Support/PortfolioCalendarSync/config.json")
        let cliArguments = try resolveArguments(["calendar-helper", "sync", "/private/config.json"])
        assert(cliArguments.command == "sync" && cliArguments.configPath == "/private/config.json")
        assert((try? resolveArguments(["calendar-helper", "sync"])) == nil)
        assert((try? resolveArguments(["calendar-helper", "sync", "/private/config.json", "extra"])) == nil)
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
