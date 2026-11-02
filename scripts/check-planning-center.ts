import { getPlanningCenterServiceContext } from "../src/lib/tools/planningCenter";

// Explicit opt-in: no calls, Vapi requests, Convex writes, fixture fallback, or raw response logging.
async function main() {
  if (!process.argv.includes("--read-demo")) {
    console.error("Read-only check requires --read-demo after configuring the separate fictional demo organization. See docs/planning-center-integration.md.");
    process.exitCode = 1;
    return;
  }
  const result = await getPlanningCenterServiceContext();
  console.log(JSON.stringify({ verification: "real-read-only-api-check", ...result }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch(() => {
  console.error("Read-only Planning Center check could not complete.");
  process.exitCode = 1;
});
