import Cocoa

class WindowController : NSWindowController {
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        shouldCascadeWindows = true
    }
}
