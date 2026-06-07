# GymTwin AI App Store Review Notes

Use this as the base for App Review notes once a native iOS build exists.

## Product Summary

GymTwin AI is a home workout coaching app with:

- AI-guided workout plans
- 3D coach presentation
- optional camera-based rep and posture feedback
- nutrition logging
- speech coaching and countdown cues

## Review Guidance

- Camera coaching is optional. The app remains usable without enabling the camera.
- Camera processing is designed to stay on-device during normal use.
- Background music is optional and can come from any app or web player. Flowsoundz Radio is a featured companion option, not a requirement.
- Spoken coach cues and countdown tones are generated locally in the app experience.

## Reviewer Test Path

1. Open the landing screen.
2. Tap `Start Workout`.
3. Choose a goal, level, equipment, and coach.
4. Begin the workout plan.
5. Optionally open Camera Coach on a supported movement.
6. Open Settings to review:
   - Workout Audio
   - Privacy Policy
   - Terms of Use
   - Support

## Known Pre-Submission Requirements

- A native iOS shell must exist before submitting to App Review.
- Full in-app account deletion should be implemented instead of support-routed deletion requests.
- Final screenshots and metadata must match the native build, not the web app.
