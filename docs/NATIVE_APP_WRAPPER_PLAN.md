# GymTwin AI Native Wrapper Plan

This phase converts the current Next.js product into something that can realistically pass iOS App Review.

## Goal

Wrap GymTwin AI in a native iOS shell that preserves the current product while adding:

- camera and microphone permission strings
- native lifecycle handling
- native-safe navigation and safe-area behavior
- predictable speech/audio behavior on device
- an App Store submission target

## Recommended Stack

Use Capacitor as the first native wrapper layer.

Why:

- lowest migration cost from the existing Next.js app
- keeps the current web app intact
- gives a path to native plugins for camera, microphone, audio session, and haptics
- faster to TestFlight than rewriting the product in React Native or SwiftUI

## Phase 1: Wrapper Setup

- initialize Capacitor in the repo
- create the `ios/` project
- define bundle identifier and app display name
- add app icons and splash assets
- configure production web build as the Capacitor web source

## Phase 2: Native Permissions

- add `NSCameraUsageDescription`
- add `NSMicrophoneUsageDescription`
- add any photo-library permissions only if later required
- make sure permission wording matches actual product behavior

## Phase 3: Audio Session

- verify spoken coach cues coexist with background audio from Spotify, Apple Music, YouTube Music, SoundCloud, and Flowsoundz Radio
- decide whether native ducking is required or whether GymTwin should stay “music-aware” only
- if ducking is truly needed, implement it in the native audio-session layer rather than in web-only code

## Phase 4: Native QA

- test onboarding on real iPhone hardware
- test sign-in and sync
- test session resume after backgrounding
- test camera coach on supported movements
- test speech playback with background audio active
- test install/update flows through TestFlight

## Phase 5: Submission Readiness

- update App Store screenshots from the native shell
- update review notes based on native flow
- confirm support, privacy, and terms URLs
- confirm full in-app account deletion is available before submission

## Blocking Items Before Native Submission

- full self-serve account deletion is still needed
- app icons/splash/branding package for native project is still needed
- real-device QA is still needed

## Suggested Execution Order

1. Commit and preserve the current web-side launch hardening.
2. Initialize Capacitor and create the iOS project.
3. Add native permissions and bundle metadata.
4. Validate background audio + speech on device.
5. Run internal TestFlight.
6. Close deletion/compliance gaps.
7. Prepare App Store submission assets.
