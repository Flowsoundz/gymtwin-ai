import UIKit
import Capacitor

/// Storyboard's bridge controller — registers in-app plugins that aren't
/// distributed as packages (HealthKit bridge).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthKitPlugin())
    }
}
