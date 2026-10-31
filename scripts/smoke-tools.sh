#!/usr/bin/env bash
# Posts fake Vapi tool-calls to the local webhook and prints results.
# Usage: scripts/smoke-tools.sh [base_url]
set -euo pipefail
BASE="${1:-http://localhost:3000}"
CALL_ID="smoke-$(date +%s)"
post() {
  local name="$1" args="$2"
  curl -s -X POST "$BASE/api/vapi/tools" -H 'content-type: application/json' \
    -d "{\"message\":{\"type\":\"tool-calls\",\"call\":{\"id\":\"$CALL_ID\"},\"toolCallList\":[{\"id\":\"tc-$name\",\"type\":\"function\",\"function\":{\"name\":\"$name\",\"arguments\":$args}}]}}" \
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
