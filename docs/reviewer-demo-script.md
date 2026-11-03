# One guided demo call

Role-play a rehearsal problem. No Playback knowledge, equipment, or Planning Center account is needed. Follow these caller lines as the agent asks questions.

1. **Start:** “I'm getting ready for rehearsal on our iPad, but Graves Into Gardens won't open. I've pressed Try Again once and it's still stuck.”
2. **When asked about the message:** “It says ‘Audio Files Missing.’”
3. **After it guides two more retries:** “The next try still didn't work, but I pressed it again and it's opened now. Thank you!”
4. **When asked whether you need anything else:** “Yes—could you check Planning Center and tell me what other songs are on Sunday's demo plan?”
5. **After the plan answer:** “No, that's everything I needed. Thank you!”

If retries are guided one at a time, report the same results separately: the next fails; the following succeeds. Do not suggest the fix or report success before the agent guides it.

If asked for demo details: **John Doe**, customer **111**, Organization ID **480113**. If a setting is unfamiliar, say **“I'm not sure—where would I find that?”** The app version, if it helps you find it, is **8.6.4**.

The Planning Center lookup is a real, read-only API request for the shared **Regal Playback Demo** plan. Song recovery is fictional role-play. The agent may reuse a plan it already retrieved; an extra API request is unnecessary.

**Feedback:** Was it easy to follow? Did the plan answer fit your question? Did you hear the whole goodbye before disconnect?

This single sample is separate from the ten developer conversations. It completed a five-turn development text check with a live API result; [review and transcript](text-tests/reviewer-demo-review.md). Voice delivery and disconnect still require your manual check. Final delivery should use the matching reviewed agent configuration.
