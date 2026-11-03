import { readFileSync } from "node:fs";
import { auditAcknowledgments, dialogueFromReport } from "./lib/acknowledgments";

try {
  const path = process.argv[2];
  if (!path) throw Error("Usage: npm run test:acknowledgments -- <safe-transcript-report.json>");
  const report = JSON.parse(readFileSync(path, "utf8"));
  const findings = auditAcknowledgments(dialogueFromReport(report));
  console.log(JSON.stringify({
    scope: report.voiceCallCreated === false ? "text-only; speaker untested" : "recorded dialogue; audio review still required",
    check: "duplicate acknowledgment openings within one caller turn",
    result: findings.length ? "FAIL" : "No matching duplicate openings found",
    findings,
  }, null, 2));
  if (findings.length) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Acknowledgment check failed.");
  process.exitCode = 1;
}
