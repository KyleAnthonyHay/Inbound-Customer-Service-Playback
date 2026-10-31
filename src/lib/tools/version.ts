/** Loose semver compare for "8.6.3"-style strings. Returns -1, 0, 1. */
export function compareVersions(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function parse(v: string): number[] {
  return v
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((p) => parseInt(p, 10))
    .filter((n) => Number.isFinite(n));
}

export function isValidVersion(v: string | undefined | null): v is string {
  return !!v && parse(v).length >= 2;
}
