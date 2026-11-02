import { kb } from "./kb";
import { compareVersions, isValidVersion } from "./version";
import { getCurrentPlaybackAppInfo } from "./apple";

/**
 * "Get relevant documented changes since version": combines the LIVE Apple
 * current-version lookup with the bounded, documented release-note history.
 * Never claims complete coverage; reports gaps explicitly.
 */
const hasWord = (text: string, word: string) => new RegExp(`\\b${word}\\b`, "i").test(text);

export async function getRelevantChangesSinceVersion(args: { installedVersion: string; symptom?: string; platform?: string; osVersion?: string }) {
  const installed = (args.installedVersion ?? "").trim();
  if (!isValidVersion(installed)) {
    return {
      ok: false as const,
      reason: "invalid-version" as const,
      message: "Ask the caller for their Playback version, e.g. 8.6.2. It is shown in Playback's settings/about screen.",
    };
  }

  const apple = await getCurrentPlaybackAppInfo();
  const current = apple.ok && isValidVersion(apple.app.currentVersion) ? apple.app.currentVersion : null;

  const documented = [...kb.releases].sort((a, b) => compareVersions(a.version, b.version));
  const newest = documented[documented.length - 1]?.version ?? null;

  // Releases strictly newer than installed and <= current (if current is known).
  const between = documented.filter(
    (r) => compareVersions(r.version, installed) > 0 && (!current || compareVersions(r.version, current) <= 0)
  );

  const symptomTokens = (args.symptom ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const relevant = between
    .map((r) => {
      const hits = r.notes.filter((n) => symptomTokens.some((t) => hasWord(n, t)));
      const kwHits = (r.keywords ?? []).filter((k) => symptomTokens.some((t) => hasWord(k, t)));
      return { version: r.version, date: r.date, url: r.url, matchingNotes: hits, matchedKeywords: kwHits, allNotes: r.notes };
    })
    .filter((r) => !symptomTokens.length || r.matchingNotes.length || r.matchedKeywords.length);

  const gaps: string[] = [];
  if (!apple.ok) gaps.push(`Live App Store lookup failed: ${apple.error}. Current version is unknown.`);
  if (apple.ok && apple.versionMetadataInconsistent) gaps.push(...apple.warnings);
  if (current && newest && compareVersions(current, newest) > 0)
    gaps.push(`App Store shows ${current} but documented release notes only go up to ${newest}; changes in between are not covered.`);
  if (current && compareVersions(installed, current) > 0)
    gaps.push(`Installed version ${installed} is newer than the App Store version ${current}; the caller may be on a beta or the store data is stale.`);
  if (!kb.releases.length) gaps.push("No documented release history is loaded.");

  const upToDate = current ? compareVersions(installed, current) >= 0 : null;
  const platform = args.platform?.trim() || null;
  const osVersion = args.osVersion?.trim() || null;
  const storeMinimum = apple.ok && apple.app.minimumOsVersion && isValidVersion(apple.app.minimumOsVersion)
    ? apple.app.minimumOsVersion : null;
  // The iOS App Store minimum is not a macOS requirement. Unknown facts stay unknown.
  const iosPlatform = !!platform && /^(ios|ipados|ipad|iphone)$/i.test(platform);
  const osKnown = !!osVersion && /^\d+(?:\.\d+){0,2}$/.test(osVersion);
  const osRequirementMet = iosPlatform && osKnown && storeMinimum
    ? compareVersions(osVersion!, storeMinimum) >= 0 : null;
  const missingInformation: string[] = [];
  if (!current) missingInformation.push("currentVersion");
  if (!platform) missingInformation.push("platform");
  if (!osKnown) missingInformation.push("osVersion");
  if (platform && (!iosPlatform || !storeMinimum)) missingInformation.push("applicablePlatformRequirements");
  const blockers: string[] = [];
  if (upToDate) blockers.push("already-current-or-newer");
  if (osRequirementMet === false) blockers.push("installed-os-below-current-app-minimum");
  if (!relevant.length) blockers.push("no-matching-release-candidates");

  return {
    ok: true as const,
    installedVersion: installed,
    current: {
      version: current,
      source: "live" as const,
      provider: apple.ok ? apple.provider : "Apple iTunes Lookup API",
      retrievedAt: apple.ok ? apple.retrievedAt : null,
      releaseDate: apple.ok ? apple.app.currentVersionReleaseDate : null,
      minimumOsVersion: storeMinimum,
      minimumOsAppliesTo: "iOS/iPadOS only" as const,
    },
    isUpToDate: upToDate,
    documentedReleasesBetween: between.map((r) => r.version),
    relevantChanges: relevant,
    history: { source: "documentation" as const, provider: "MultiTracks Help Center release notes", snapshotRetrievedAt: kb.retrievedAt, coverage: documented.map((r) => r.version) },
    gaps,
    updateAssessment: {
      installedVersion: installed,
      installedVersionSource: "caller-provided argument; historical record notes are not confirmation",
      platform,
      osVersion,
      osRequirementMet,
      requirementsSource: iosPlatform && storeMinimum && apple.ok ? apple.url : null,
      missingInformation,
      blockers,
      prerequisitesComplete: missingInformation.length === 0 && blockers.length === 0 && osRequirementMet === true,
      candidateMatchNeedsReview: true,
      scope: "Checks known versions and the current app's applicable OS minimum. Does not verify audio accessories or establish a device's root cause. Keyword matches are candidates, not confirmed fixes for the caller.",
    },
    updateIsDisruptive: true,
    updateCaution: "Updating closes Playback. Honor any interruption constraints the caller has volunteered; no timing question is required.",
    guidance:
      upToDate === true
        ? "Caller is already on the current version. Do not recommend updating as a fix; continue with documented troubleshooting."
        : relevant.length
          ? "Candidate release notes were found. This is not an update recommendation: updateAssessment identifies missing facts or blockers, and the candidate notes still require review for actual symptom applicability. A matching note does not guarantee caller recovery."
          : "No matching release candidates were found in the available history. This does not establish that no defect exists; updating is not an evidence-based targeted fix from this result.",
  };
}
