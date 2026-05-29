# GymTwin AI Deployment Notes

## Recommended Deployment

- Recommended platform: Vercel
- This project is a Next.js App Router app and is well suited to Vercel’s default deployment flow.

## Vercel Deployment Steps

1. Run `npm run build`
2. Run `npm run lint`
3. Install the CLI if needed: `npm install -g vercel`
4. Authenticate: `vercel login`
5. From the project directory run: `cd /Users/adonyflorencio/gymtwin-ai`
6. Create or link the project: `vercel`
7. Deploy production: `vercel --prod`

## Environment Notes

- No backend service is required for the MVP.
- No authentication or payment environment variables are needed.
- Local development uses port `3001`, but deployment will use the platform-provided port automatically.

## Camera / HTTPS Requirement

- Camera access in production requires HTTPS.
- `localhost` works for development, but deployed previews and production environments must be served securely.
- Real phone camera testing should always use the deployed HTTPS URL.

## MediaPipe Asset Notes

- MediaPipe runtime files are served from `public/mediapipe/`.
- The pose model asset is served from `public/models/`.
- MediaPipe assets must stay inside `public/` so they are served at runtime.
- Keep the runtime model path at `/models/pose_landmarker_lite.task`.
- Verify these files are present in deployment output if camera tracking fails after deploy.

## Avatar Asset Notes

- Avatar image assets must stay in `public/avatars/`.
- Current runtime paths are:
  - `/avatars/GTFMODEL.png`
  - `/avatars/GTMMODEL.png`
- If avatar images fail after deploy, verify those files were included in the Vercel output.

## Privacy Notes

- This MVP does not upload video.
- This MVP does not upload still images.
- This MVP does not upload pose landmarks.
- This MVP does not upload voice audio.

## Voice Recognition Notes

- Browser speech recognition support varies by browser and device.
- Voice features may work differently across Chrome, Safari, and Android browsers.
- Camera and workout flows should still be testable even if voice recognition is unavailable.

## Common Troubleshooting

### Camera permission denied

- Confirm the site is using HTTPS.
- Check browser site permissions and re-enable camera access.
- Retry in a fresh tab after updating permissions.

### Model asset not loading

- Confirm the `/public/models/pose_landmarker_lite.task` file is deployed.
- Confirm `/public/mediapipe/*` runtime files are deployed.
- Check the browser network tab for 404s on MediaPipe assets.

### Mobile camera not opening

- Confirm the mobile browser allows camera access.
- Test on HTTPS, not plain HTTP.
- Retry after closing other apps that may hold the camera.

### Dev-only MediaPipe console warnings

- Some MediaPipe and WASM warnings may appear in development.
- If tracking still works and there are no 404s or permission failures, these warnings are usually non-blocking for local testing.

## Pre-Deployment Checks

- Run `npm run build`
- Run `npm run lint`
- Confirm Camera Sandbox works on localhost
- Confirm Camera Coach works for supported workout movements
