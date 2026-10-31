#!/usr/bin/env bash
# Runs every scenario in scripts/scenarios sequentially and writes a summary table.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=docs/voice-tests/summary-$(date +%Y%m%d-%H%M%S).md
echo "| Scenario | Expected intent | Ended | Tool calls (Vapi) | Report |" > "$OUT"
echo "|---|---|---|---|---|" >> "$OUT"
for f in scripts/scenarios/*.json; do
  name=$(basename "$f" .json)
  echo "=== $name"
  npx tsx --env-file=.env.local scripts/voice-test.ts "$f" 2>&1 | grep -v "^    at " | tee "/tmp/voice-$name.log" | tail -8
  rep=$(ls -t docs/voice-tests/*-"$name".json 2>/dev/null | head -1)
  if [ -n "$rep" ]; then
    python3 -I - "$rep" "$OUT" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]))
with open(sys.argv[2],'a') as o:
    o.write(f"| {r['scenario']} | {r['expectedIntent']} | {r.get('endedReason')} | {', '.join(r['vapiToolCalls'])} | {sys.argv[1]} |\n")
PY
  fi
done
echo "summary: $OUT"; cat "$OUT"
