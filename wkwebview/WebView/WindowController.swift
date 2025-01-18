import Cocoa

class WindowController : NSWindowController {
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        shouldCascadeWindows = true
    }

    override func keyDown(with event: NSEvent) {
//        Don't call super.keyDown so that it won't play the beeping noise.
    }
}
