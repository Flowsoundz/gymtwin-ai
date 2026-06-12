import Foundation
import Capacitor
import HealthKit

/// Minimal HealthKit bridge for GymTwin: authorization + workout writes.
/// Exposed to the web app as window.Capacitor.Plugins.GymTwinHealth.
@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "GymTwinHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWorkout", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    private var writeTypes: Set<HKSampleType> {
        var types: Set<HKSampleType> = [HKObjectType.workoutType()]
        if let energy = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(energy)
        }
        return types
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false])
            return
        }
        store.requestAuthorization(toShare: writeTypes, read: []) { granted, error in
            if let error = error {
                call.reject("HealthKit authorization failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["granted": granted])
        }
    }

    @objc func saveWorkout(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available on this device")
            return
        }
        let durationMinutes = call.getDouble("durationMinutes") ?? 0
        guard durationMinutes > 0 else {
            call.reject("durationMinutes must be > 0")
            return
        }
        let calories = call.getDouble("calories") ?? 0
        let end = Date()
        let start = end.addingTimeInterval(-durationMinutes * 60)

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .functionalStrengthTraining

        let builder = HKWorkoutBuilder(healthStore: store, configuration: configuration, device: .local())
        builder.beginCollection(withStart: start) { [weak self] _, beginError in
            if let beginError = beginError {
                call.reject("HealthKit begin failed: \(beginError.localizedDescription)")
                return
            }

            var samples: [HKSample] = []
            if calories > 0, let energyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) {
                let quantity = HKQuantity(unit: .kilocalorie(), doubleValue: calories)
                samples.append(HKQuantitySample(type: energyType, quantity: quantity, start: start, end: end))
            }

            let finish: () -> Void = {
                builder.endCollection(withEnd: end) { _, endError in
                    if let endError = endError {
                        call.reject("HealthKit end failed: \(endError.localizedDescription)")
                        return
                    }
                    builder.finishWorkout { workout, finishError in
                        if let finishError = finishError {
                            call.reject("HealthKit save failed: \(finishError.localizedDescription)")
                            return
                        }
                        call.resolve(["saved": workout != nil])
                    }
                }
            }

            if samples.isEmpty {
                finish()
            } else {
                builder.add(samples) { _, _ in finish() }
            }
            _ = self
        }
    }
}
