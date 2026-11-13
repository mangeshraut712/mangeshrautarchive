import AppKit
import Foundation

@MainActor
private final class AuthorizationAppDelegate: NSObject, NSApplicationDelegate {
    private var window: NSWindow?
    private var task: Task<Void, Never>?
    private let status = NSTextField(wrappingLabelWithString: "Preparing Calendar and Reminders authorization…")

    func applicationDidFinishLaunching(_ notification: Notification) {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 540, height: 240),
                              styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
        window.title = "Portfolio Calendar Sync"
        window.isReleasedWhenClosed = false
        let content = NSVisualEffectView()
        content.material = .windowBackground
        content.blendingMode = .behindWindow
        window.contentView = content
        let title = NSTextField(labelWithString: "Calendar and Reminders access")
        title.font = .systemFont(ofSize: 20, weight: .semibold)
        status.font = .systemFont(ofSize: 14)
        status.textColor = .labelColor
        status.setAccessibilityIdentifier("authorization-status")
        let privacy = NSTextField(wrappingLabelWithString: "This window requests access only. It does not upload calendar events or reminders.")
        privacy.font = .systemFont(ofSize: 12)
        privacy.textColor = .secondaryLabelColor
        let stack = NSStackView(views: [title, status, privacy])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 18
        stack.translatesAutoresizingMaskIntoConstraints = false
        content.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 28),
            stack.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -28),
            stack.topAnchor.constraint(equalTo: content.topAnchor, constant: 28),
            stack.bottomAnchor.constraint(lessThanOrEqualTo: content.bottomAnchor, constant: -28),
        ])
        self.window = window
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApplication.shared.activate(ignoringOtherApps: true)
        task = Task { await authorize() }
    }

    private func authorize() async {
        do {
            let arguments = try resolveArguments([CommandLine.arguments[0]])
            let configuration = try JSONDecoder().decode(Configuration.self, from: Data(contentsOf: URL(fileURLWithPath: arguments.configPath)))
            try configuration.validate()
            status.stringValue = "Approve the macOS access requests. This window will report when authorization finishes."
            try await requestAuthorization(configuration)
            status.stringValue = "Access granted for the selected resource types. You can close this window. Verify the scheduled sync separately."
        } catch {
            if let failure = error as? HelperError, case .permission = failure {
                status.stringValue = "Access was not granted. Review Portfolio Calendar Sync in System Settings → Privacy & Security → Calendars and Reminders, then reopen this app."
            } else if let failure = error as? HelperError, case .fetch = failure {
                status.stringValue = "The access request timed out. Finish any macOS permission prompt, then close and reopen this app."
            } else {
                status.stringValue = "Authorization could not start. Check the installed config.json and selected resource types, then reopen this app."
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) { task?.cancel() }
}

@MainActor
func runAuthorizationApp() {
    let app = NSApplication.shared
    app.setActivationPolicy(.regular)
    let delegate = AuthorizationAppDelegate()
    app.delegate = delegate
    let menu = NSMenu()
    let applicationItem = NSMenuItem()
    let applicationMenu = NSMenu()
    applicationMenu.addItem(withTitle: "Quit Portfolio Calendar Sync", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    applicationItem.submenu = applicationMenu
    menu.addItem(applicationItem)
    app.mainMenu = menu
    withExtendedLifetime(delegate) { app.run() }
}
