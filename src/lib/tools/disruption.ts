/**
 * Classifies a troubleshooting step by how disruptive it is to a live
 * rehearsal or service. Deterministic, so the agent's forewarning comes from
 * data rather than a guess each turn.
 */
export type Disruption = { disruptive: boolean; kind?: string; caution?: string };

const RULES: Array<{ re: RegExp; kind: string; caution: string }> = [
  { re: /\b(update|upgrade|app store|install the latest|newer version)\b/i, kind: "update", caution: "Updating the app closes Playback and takes a few minutes; don't do this during a service." },
  { re: /\b(reinstall|uninstall|delete the app|remove the app)\b/i, kind: "reinstall", caution: "Reinstalling removes downloaded songs until they are re-downloaded; not during a service." },
  { re: /\bdelete all setlists\b|\bremove (and re-?add )?(the )?song\b|\bre-?add the song\b|\bdelete (the )?(song|setlist)\b|\bre-?download\b/i, kind: "delete-content", caution: "This removes the song from the device and re-downloads it, so only do it when you have time before you play." },
  { re: /\b(restart|reboot|power (off|cycle)|force[- ]?quit|close and reopen|fully close)\b/i, kind: "restart", caution: "This stops playback for a moment; if you're live, wait for a break." },
  { re: /\b(sign out|log out|sign back in|re-?authorize)\b/i, kind: "sign-out", caution: "Signing out can interrupt cloud access until you sign back in." },
  { re: /\b(reset|restore from cloud|change (the )?(audio|output) device|switch (the )?(audio|output))\b/i, kind: "settings-change", caution: "Changing this setting takes effect immediately and can cut audio for a moment." },
];

export function classifyStep(text: string): Disruption {
  for (const r of RULES) if (r.re.test(text)) return { disruptive: true, kind: r.kind, caution: r.caution };
  return { disruptive: false };
}
