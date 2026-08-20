import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Date formatting in this app is locale-sensitive ("en-MY") and cycle maths is
// timezone-sensitive. CI pins TZ=Asia/Kuala_Lumpur via the test script so these
// assertions match what a user in the app's home timezone actually sees.

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
