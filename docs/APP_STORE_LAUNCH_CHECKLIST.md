# GymTwin AI App Store Launch Checklist

This repo now contains the web-side launch hardening needed for a professional release review, but launch is still blocked by native packaging and backend account deletion automation.

## Ship-Blocking

- [ ] Add a native iOS shell or Capacitor wrapper with real device testing.
- [ ] Add Apple permission strings for camera and microphone.
- [ ] Implement full in-app auth account deletion without a support handoff.
- [ ] Validate sign-in, speech, camera, and workout flows on real iPhones.
- [ ] Prepare App Store assets: icon, screenshots, subtitle, keywords, support URL, privacy URL.

## Completed In This Repo

- [x] Privacy policy route at `/privacy`
- [x] Terms route at `/terms`
- [x] Support route at `/support`
- [x] In-app support, privacy, and legal links in Settings
- [x] Local and Supabase-backed workout audio settings
- [x] Coach voice volume now affects runtime speech
- [x] Cue volume now affects runtime countdown and start tones
- [x] Cloud data deletion path for synced workout data
- [x] Product copy supports any background music platform, with Flowsoundz as featured option

## Product Hardening

- [ ] Finish warning cleanup in older untouched files.
- [ ] Complete a regression pass on onboarding, workout resume, nutrition, and auth sync.
- [ ] Add offline and error-state polish for sign-in, food scan, and missing assets.
- [ ] Confirm camera trust messaging is consistent across all workout entry points.

## Compliance and Support

- [x] Support email exposed in product
- [x] Privacy policy exposed in product
- [x] Terms exposed in product
- [ ] Full automated in-app account deletion
- [ ] Final review of medical/safety wording with production copy

## Audio

- [x] Coach voice settings affect spoken runtime output
- [x] Cue volume settings affect tone playback
- [ ] If a native app shell is added, test coexistence with Spotify, Apple Music, YouTube Music, SoundCloud, and Flowsoundz Radio in background playback
- [ ] If true ducking is needed for native launch, implement it at the native audio-session layer

## Review Readiness

- [x] Support page exists
- [x] Reviewer-facing notes written in `docs/APP_STORE_REVIEW_NOTES.md`
- [ ] Native build + TestFlight cycle completed
- [ ] External beta feedback closed out
