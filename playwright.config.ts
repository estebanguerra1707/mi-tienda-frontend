import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.e2e" });
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:5173",
    video: "on",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
   projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "admin",
      dependencies: ["setup"],
      use: { storageState: "test-results/storage-admin.json" },
    },
  ],
});
