# Open-ended developer conversation checks

Keep the ten selected situations across five intent groups. Each starts with an ordinary description of a goal or problem, not a technical diagnosis. Jordan has a separate [single usability try-out](jordan-voice-tests.md).

## Caller background, not a dialogue script

`scripts/text-cases/curated.json` keeps all caller/reviewer material under `reviewOnly`. Only the opening and later chosen caller utterances enter the support conversation. Each private caller profile distinguishes:

- **Goal:** what this person wants to achieve.
- **Knows:** facts they can state naturally.
- **Can read with help:** a model label, error, version or selected setting they can report after a useful observation question/navigation instruction. They need not know the technical term or remember a version.
- **Cannot verify:** genuine unknowns that cannot be solved by making the caller more cooperative.
- **Scripted outcome:** the response to an applicable action, fixed before testing. A suggested action, update installation or finished script is not itself recovery.

The coding agent reviews each actual reply and supplies an adaptive caller response. This is a manually steered text POC, not a blinded autonomous user simulator. Caller replies must be restricted to the background facts; reviewer expectations are used for scoring, not for coaching the agent toward a tool or diagnosis.

## Run and review

```sh
npm run text:cases -- start <empty-directory> scripts/text-cases/curated.json --first-opening
npm run text:cases -- reply <run-directory> <replies.json>
```

The first command starts ten isolated conversations, one opening each. Omit `--first-opening` to test both phrasings (twenty conversations). Review each reply before writing the next phase. Mark completed or stopped cases `done: true` to remove only their isolated test logs. The runner pins configuration and limits each conversation to twelve turns.

- Use everyday language, partial answers and genuine uncertainty from the profile. Misunderstandings are realistic; do not manufacture confusion on every question.
- A requested version can receive “I don’t know where to find that.” After useful navigation, the caller can read the predeclared value. This does not make version lookup mandatory for every issue.
- Do not translate “tracks” into a technical mix for the agent. Explain the wanted experience when asked; the agent must clarify the meaning rather than assume it.
- If a fact is genuinely unavailable, keep it unavailable. Log an unanticipated fixture gap rather than inventing a convenient model, setting or device capability.
- A novice can follow a simple documented step. If remaining work needs advanced investigation, cannot be verified, or the caller cannot carry it out and wants help, the agent should summarize the useful known context and offer a specialist. It should not ask an exhaustive technical checklist once review is needed.
- Do not ask for a human merely to force the expected escalation. Let the offer emerge, then accept it. A direct human request remains a separate control.
- Keep advice questions distinct from setup walkthroughs. Caller acknowledgment is not a request to begin configuration. Normal completion includes a broad further-help question and a reply; clear goodbye/leave requests still take priority.

## Score actual behavior

Record discovery and plain-language repair, useful versus unnecessary lookups, grounding, consent, caller-confirmed outcomes, specialist offers/actions and normal closing separately. Judge the goal actually expressed and clarified; do not grade an unspoken channel-count requirement as though the caller had requested it. An appropriate unexpected escalation can be valid; an ungrounded “fix” is not. Seven resolutions/three reviews is a coverage target, not a quota to manufacture.

Text inference uses Vapi model credits. No phone or automated voice session is created. Production is excluded. Tool effects on fictional dev records are real; human transfers are simulated. Text checks do not test GPT-Live speaker delegation, audio, timing or native disconnect and must not be labeled voice-call evidence.
