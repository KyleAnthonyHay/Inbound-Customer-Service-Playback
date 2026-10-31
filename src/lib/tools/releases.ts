import { kb } from "./kb";
import { compareVersions, isValidVersion } from "./version";
import { getCurrentPlaybackAppInfo } from "./apple";

/**
 * "Get relevant documented changes since version": combines the LIVE Apple
 * current-version lookup with the bounded, documented release-note history.
 * Never claims complete coverage; reports gaps explicitly.
 */
const hasWord = (text: string, word: string) => new RegExp(`\\b${word}\\b`, "i").test(text);

export async function getRelevantChangesSinceVersion(args: { installedVersion: string; symptom?: string }) {
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

  return {
    ok: true as const,
    installedVersion: installed,
    current: {
      version: current,
      source: "live" as const,
      provider: apple.ok ? apple.provider : "Apple iTunes Lookup API",
      retrievedAt: apple.ok ? apple.retrievedAt : null,
      releaseDate: apple.ok ? apple.app.currentVersionReleaseDate : null,
    },
    isUpToDate: upToDate,
    documentedReleasesBetween: between.map((r) => r.version),
    relevantChanges: relevant,
    history: { source: "documentation" as const, provider: "MultiTracks Help Center release notes", snapshotRetrievedAt: kb.retrievedAt, coverage: documented.map((r) => r.version) },
    gaps,
    updateIsDisruptive: true,
    updateCaution: "Updating closes Playback and takes a few minutes, so it should wait until after a service or rehearsal.",
    guidance:
      upToDate === true
        ? "Caller is already on the current version. Do not recommend updating as a fix; continue with documented troubleshooting."
        : relevant.length
          ? "A documented fix exists in a newer version. Say which version fixed it, then give the caution in one sentence before suggesting the update; offer a non-disruptive step first if the caller is mid-service."
          : "No documented fix for this symptom between the installed and current versions. Updating is not a targeted fix here.",
  };
}
