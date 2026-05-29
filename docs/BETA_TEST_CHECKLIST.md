# GymTwin AI Beta Test Checklist

## Phone Deployment Test

- Open the deployed HTTPS URL on a real phone.
- Confirm the landing screen loads cleanly on mobile.
- Confirm there is no horizontal overflow.

## Landing / Setup Test

- Test mobile landing layout.
- Test Nova selection.
- Test Atlas selection.
- Generate a routine without layout breakage.

## Camera Sandbox Test

- Open Camera Sandbox.
- Allow camera permission.
- Deny camera permission once and confirm the error state is understandable.
- Re-enable camera permission and confirm camera can start again.
- Test Squat mode.
- Test Push-Up mode.
- Test Plank mode.
- Test focus mode.

## Workout Player Test

- Start a workout from landing.
- Accept the safety acknowledgment.
- Generate preview.
- Begin active workout.
- Test WorkoutPlayer Camera Coach on a supported movement.
- Confirm camera coach can start and stop cleanly.
- Confirm Complete Set still works.
- Confirm Pain / Stop still works.

## Voice Test

- Test voice commands if supported by the device/browser.
- Try camera start.
- Try camera stop.
- Try workout commands such as complete set or pain stop.

## Completion / Progress Test

- Finish a workout.
- Test score and XP summary.
- Test badges and progress screens.
- Confirm workout history still renders correctly.

## Settings Test

- Open Settings.
- Review camera privacy and app info cards on phone.
- Test Settings reset.

## Known Limitations

- Camera Coach supports only selected movements in this MVP.
- Tracking is browser-only and depends on lighting, framing, and device performance.
- Voice recognition support varies by browser and device.
- MediaPipe may log development warnings in the browser console.
- Prototype feedback is not a substitute for professional coaching or medical guidance.
