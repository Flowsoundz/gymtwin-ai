import type { CapacitorConfig } from "@capacitor/cli";

// Remote-shell architecture: the native app loads the production web app and
// layers native capabilities on top (HealthKit, push, audio session). Server
// API routes (food-scan, coach chat) keep working because the origin is the
// real site. webDir only serves the offline fallback page.
const config: CapacitorConfig = {
  appId: "com.gymtwin.app",
  appName: "GymTwin",
  webDir: "native-shell",
  server: {
    url: "https://www.gymtwinai.com",
    allowNavigation: ["www.gymtwinai.com", "gymtwinai.com", "*.supabase.co"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#070d1a",
  },
};

export default config;
