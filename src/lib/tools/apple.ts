import { compareVersions, isValidVersion } from "./version";

export const APPLE_LOOKUP_URL = "https://itunes.apple.com/lookup?id=751755884&country=us";

export type AppleLookupResult =
  | {
      ok: true;
      source: "live";
      provider: "Apple iTunes Lookup API";
      url: string;
      retrievedAt: string;
      app: {
        name: string;
        currentVersion: string;
        currentVersionReleaseDate: string | null;
        minimumOsVersion: string | null;
        releaseNotesHead: string | null;
        /** Non-empty lines of the live App Store release notes (capped), for symptom matching. */
        releaseNotesLines: string[];
        /** Version string mentioned at the top of the release notes, if any. */
        releaseNotesMentionsVersion: string | null;
      };
      /** True when releaseNotes text references a different version than `version`. */
      versionMetadataInconsistent: boolean;
      warnings: string[];
    }
  | { ok: false; source: "live"; provider: "Apple iTunes Lookup API"; url: string; error: string };

export async function getCurrentPlaybackAppInfo(): Promise<AppleLookupResult> {
  const retrievedAt = new Date().toISOString();
  try {
    const res = await fetch(APPLE_LOOKUP_URL, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fail(`Apple lookup returned HTTP ${res.status}`);
    const data = (await res.json()) as { resultCount?: number; results?: Array<Record<string, unknown>> };
    const r = data.results?.[0];
    if (!r) return fail("Apple lookup returned no results for app id 751755884");

    const version = String(r.version ?? "");
    const notes = typeof r.releaseNotes === "string" ? r.releaseNotes : "";
    const mention = notes.match(/Playback\s+(\d+\.\d+(?:\.\d+)?)/i)?.[1] ?? null;
    const warnings: string[] = [];
    if (!isValidVersion(version)) warnings.push("Version field missing or malformed.");
    const inconsistent = !!mention && mention !== version;
    if (inconsistent)
      warnings.push(
        `App Store version is ${version} but the release notes text refers to Playback ${mention}. Treat the notes as possibly belonging to an earlier release.`
      );

    return {
      ok: true,
      source: "live",
      provider: "Apple iTunes Lookup API",
      url: APPLE_LOOKUP_URL,
      retrievedAt,
      app: {
        name: String(r.trackName ?? "Playback"),
        currentVersion: version,
        currentVersionReleaseDate: typeof r.currentVersionReleaseDate === "string" ? r.currentVersionReleaseDate : null,
        minimumOsVersion: typeof r.minimumOsVersion === "string" ? r.minimumOsVersion : null,
        releaseNotesHead: notes ? notes.split("\n").filter(Boolean).slice(0, 3).join(" ").slice(0, 300) : null,
        releaseNotesMentionsVersion: mention,
        releaseNotesLines: notes
          .split("\n")
          .map((l) => l.replace(/^[\s•*-]+/, "").trim())
          .filter((l) => l.length > 3)
          .slice(0, 40),
      },
      versionMetadataInconsistent: inconsistent,
      warnings,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Apple lookup failed");
  }

  function fail(error: string): AppleLookupResult {
    return { ok: false, source: "live", provider: "Apple iTunes Lookup API", url: APPLE_LOOKUP_URL, error };
  }
}

/**
 * Compares the caller's iOS/iPadOS/macOS version against the App Store's
 * minimumOsVersion. Apple's lookup reports one minimum (the iOS one), so a
 * macOS version is not compared.
 */
export function checkOsCompatibility(deviceOsVersion: string | undefined, minimumOsVersion: string | null, platform?: string) {
  if (!deviceOsVersion || !isValidVersion(deviceOsVersion.replace(/^(ios|ipados|macos)\s*/i, ""))) return null;
  if (platform && /mac/i.test(platform)) return { deviceOsVersion, minimumOsVersion, compatible: null, note: "The App Store lookup only reports the iOS/iPadOS minimum; macOS compatibility is not checked." };
  if (!minimumOsVersion) return { deviceOsVersion, minimumOsVersion, compatible: null, note: "Apple's lookup did not return a minimum OS version." };
  const v = deviceOsVersion.replace(/^(ios|ipados|macos)\s*/i, "");
  const compatible = compareVersions(v, minimumOsVersion) >= 0;
  return {
    deviceOsVersion: v,
    minimumOsVersion,
    compatible,
    note: compatible
      ? "The device meets the current Playback version's minimum OS."
      : `The current Playback version needs iOS/iPadOS ${minimumOsVersion} or later and this device is on ${v}. The device can't install the latest Playback until its OS is updated (Settings, General, Software Update), and a device that can't reach ${minimumOsVersion} is unsupported for the latest version.`,
  };
}
