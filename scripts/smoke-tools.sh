#!/usr/bin/env bash
# Posts fake Vapi tool-calls to the Convex-hosted webhook and prints results.
# Usage: scripts/smoke-tools.sh            (reads NEXT_PUBLIC_CONVEX_SITE_URL and VAPI_TOOL_SECRET from .env.local)
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${1:-$(grep '^NEXT_PUBLIC_CONVEX_SITE_URL=' .env.local | cut -d= -f2-)}"
SECRET="$(grep '^VAPI_TOOL_SECRET=' .env.local | cut -d= -f2- || true)"
CALL_ID="smoke-$(date +%s)"
post() {
  local name="$1" args="$2"
  curl -s -X POST "$BASE/vapi/tools" -H 'content-type: application/json' -H "x-demo-secret: $SECRET" \
    -d "{\"message\":{\"type\":\"tool-calls\",\"call\":{\"id\":\"$CALL_ID\"},\"toolCallList\":[{\"id\":\"tc-$name-$RANDOM\",\"type\":\"function\",\"function\":{\"name\":\"$name\",\"arguments\":$args}}]}}" \
    | python3 -I -c 'import sys,json; r=json.load(sys.stdin)["results"][0]; print(json.dumps(json.loads(r["result"]) if "result" in r else r, indent=1)[:900])'
  echo "-----"
}
echo "callId=$CALL_ID"
post search_playback_docs '{"query":"song stuck downloading"}'
post get_current_playback_app_info '{}'
post get_relevant_changes_since_version '{"installedVersion":"8.6.2","symptom":"Cloud Pro expired"}'
post get_relevant_changes_since_version '{"installedVersion":"8.6.4","symptom":"Cloud Pro expired"}'
post lookup_demo_customer '{"email":"priya.n@example.org"}'
post check_team_availability '{}'
post get_callback_slots '{"teamId":"playback-support"}'
post initiate_handoff '{"teamId":"playback-support"}'
