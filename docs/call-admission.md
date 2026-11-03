# Development call admission

Activated on development only, November 2, 2026. Vapi's billing dashboard and authenticated, read-only `GET /org/limits` both reported **4 shared concurrent call lines**. The API reported 4 remaining at verification. Development and production assistants are distinct and belong to the same Vapi organization/subscription. No capacity was purchased or billing configuration changed.

## Behavior

- This app admits **one development voice call at a time**, across browsers and the existing websocket voice harness.
- Each start checks Vapi's live subscription-wide allowance/headroom. By default it needs at least **two free slots** before admitting dev, leaving at least one for production at that snapshot. Missing/invalid limits, unavailable Vapi checks or exhausted capacity block the start.
- A second org-wide call-list check detects existing development-assistant calls started outside the guard and conservatively counts queued/ringing/unknown statuses as occupied. A full 1,000-record response is ambiguous and blocks admission rather than ignoring older active calls.
- Genuine capacity/reservation blocks return HTTP 429 with “Development calling is temporarily unavailable to keep capacity available for production. Please try again later.” A failed configuration/provider check instead returns HTTP 503 with “We couldn't verify call availability. Please try again shortly.” A failed provider call creation returns HTTP 503 with “We couldn't start the development call. Please try again shortly.” All carry `Retry-After: 30`.
- Production keeps its existing direct browser/phone/harness paths. The guard does not terminate, preempt or control any call. Dashboard selection and support instructions/tools are unchanged.

## Server enforcement and recovery

The development web SDK uses its supported `apiBaseUrl` option to send its normal `/call/web` request to the development Convex `/dev-call/call/web` HTTP action. The development voice harness uses `/dev-call/websocket` on that same backend. The browser's body is ignored: the server fixes the saved dev assistant and 1,800-second maximum duration. Browser creation matches the installed Web SDK: `POST https://api.vapi.ai/call/web`, the existing public key, and `roomDeleteOnUserLeaveEnabled` at the top level. The websocket harness continues to use private-key `POST /call` with the explicit 24 kHz websocket transport. Private credentials are used for the capacity reads in both paths. The proxy returns only the call ID and connection URL, never Vapi's full assistant/credential-bearing response. Production does not use this proxy. Vapi documents the browser endpoint's [public authentication scope](https://docs.vapi.ai/customization/jwt-authentication).

An internal Convex mutation atomically reads/writes the indexed singleton `callAdmission` lease, so simultaneous dev starts cannot both pass. This is a persistent server reservation, independent of frontend state and server process lifetimes. Signed status-ended/end-report webhooks release the bound call's lease after storing the ended status. Binding also checks for an already-ended call, covering an end webhook arriving before the create response. Older tokens and unrelated calls cannot release a newer lease. There is no public reservation-release mutation.

Definite pre-creation failures and provider 4xx rejections release the lease. A timeout, 5xx, malformed successful response, failed binding or lost response after starting provider creation retains it; creation is never automatically retried. The lease expires after **40 minutes**, longer than the enforced 30-minute call duration plus setup/join allowance. This recovers missed end webhooks and abandoned requests. Browser hang-up does not release early while provider teardown may still be in flight. The provider call-list check blocks a new dev call if an older dev call is still active after expiry. An uncertain start or missed webhook can therefore temporarily block further dev testing.

## Configuration and activation

The known development backend is `ceaseless-rhinoceros-106`; the HTTP guard refuses any other backend URL. Its Convex environment contains:

| Variable | Purpose |
| --- | --- |
| `VAPI_PRIVATE_KEY` | Existing private Vapi key; server-side creation and read-only checks |
| `VAPI_PUBLIC_KEY` | Existing browser key; same browser-auth boundary as Vapi's SDK |
| `DEV_VAPI_ASSISTANT_ID` | Existing saved development assistant, verified distinct from production |
| `DEV_CALL_RESERVED_PRODUCTION_SLOTS` | Positive integer, defaults to `1`; reserve equal to/exceeding live capacity disables dev |
| `VAPI_TOOL_SECRET` | Existing webhook/harness secret; authenticates end events and websocket starts |

Secrets were passed to Convex via stdin without printing them. Frontend configuration is unchanged locally. The `dev` branch's Vercel Preview variables point to the development assistant/backend; production variables were not changed. No assistant sync is required because this change affects admission, not assistant behavior. Never use `npm run release` for this dev activation.

## Limits of the guarantee

Vapi documents [subscription-wide concurrency](https://docs.vapi.ai/calls/call-concurrency). Its limits endpoint is a status read, not an atomic provider reservation. Production or external calls can arrive between the capacity read and Vapi's call creation. This guard serializes app-managed dev starts and reserves headroom at the read; it cannot guarantee provider-level production priority under arbitrary simultaneous external traffic. The one-dev-call cap prevents this app alone from filling the current four-slot subscription.

The existing public key and saved assistant can still be used directly through Vapi, including old frontend deployments or already-open pages running the old code. Such starts bypass this guard. Reload localhost/use the updated dev preview for guarded browser testing. The guard notices an already-active dev assistant call on its next check but cannot prevent an external call racing it. Other organizations' traffic is reflected in live subscription headroom; the call-list check is scoped to the credential's organization. A separate subscription or provider-enforced per-workload allocation would be needed for strict isolation. No provider/billing/production changes were authorized here.

## Validation

`npm test` passed 92 tests, including nine admission tests; `npm run typecheck` and targeted ESLint passed. Mocks cover both transports, safe response projection, 25 simultaneous starts, reduced subscription capacity, configurable reserve, active external dev calls, saturated/incomplete reads, production refusal, uncertain creation, expiry, and end/bind races.

### Browser start correction

On November 2, a browser start returned HTTP 503 while Vapi reported all four slots free, no active calls, and the dev reservation already released. The capacity message was masking a setup/creation failure. The browser proxy had been using the general private-key `/call` path rather than the Web SDK's `/call/web` path and payload. It now mirrors the SDK's browser request and keeps the separate websocket creation path. Tests assert the endpoint, authentication scope, DTO, credential-safe projection and distinct failure messages; all 95 local tests and TypeScript checks passed. Development activation does not change production. No new voice call was started for these checks; the caller's manual retry verifies the live browser join and audio.

The [deployed admission check](dev-integration/call-admission.json) exercises actual Convex transactions and HTTP rejection/auth/CORS paths without starting a voice call. Eight simultaneous internal reservations yield one admission and seven rejections. With that test lease held, signed browser and harness requests return 429; unsigned requests return 401. The test lease is released afterward. No real call/transcript data is inserted or removed. No paid voice, text inference or live concurrency call tests were run; mocked creation is not voice/audio/lifecycle evidence.
