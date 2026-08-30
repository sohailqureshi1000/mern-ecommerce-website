# Reflection

## What was hardest, and why

Two things fought for "hardest," and they were opposites of each other.

The first was the tool-call lifecycle in the chat UI. Streaming a response is one state machine; streaming a response where the model might *also* call a tool partway through is a bigger one. I had to track four distinct states for `searchProducts` (`input-streaming`, `input-available`, `output-available`, `output-error`) on top of the normal streaming/error/retry states of the chat itself, and keep them all readable in `ChatPage.jsx` without the component turning into a wall of conditionals. Sabotage-testing it in FE-08 — deliberately killing the connection mid-stream, sending malformed JSON, forcing a 429 — is what actually surfaced how many of those combinations I hadn't handled yet.

The second was almost the opposite problem: a result that looked catastrophic but wasn't real. After fixing the accessibility issues, I ran Lighthouse on the Vite dev server and got a Performance score of 49 — a huge drop from the 90 I'd measured before. My first instinct was that I'd broken something. It turned out the dev server was serving completely unminified, unbundled JavaScript (a single dependency chunk alone was 2.7 MB), so the number was measuring Vite's dev tooling, not my app. Running the same audit against a real production build (`npm run build` + `preview`) put it back at 94, and the live Incognito run hit 100/100. The lesson wasn't really about the score — it was realizing I'd almost "fixed" a problem that didn't exist, because I trusted a number without asking what environment produced it.

## What I'd do differently next time

I'd run the performance audit against a production build from the very first pass, not just at the end. If I'd done that from the start, I'd never have seen the misleading 49 and wasted time second-guessing a change that was actually correct. More generally, I'd treat "which environment is this number coming from" as a question to ask before reacting to any metric, not after.

I'd also write the "how it fails safely" documentation *as I built* each failure case in FE-08, instead of reconstructing it from the code afterward for the capstone README. The behavior was already right — sabotage-testing had already forced me to handle it — but writing it up after the fact meant re-reading my own code to remember exactly what each edge case did.

## One thing that surprised me

How much of "AI-assisted development" is really about what the AI *doesn't* silently paper over, not what it produces on the first try. The clearest example wasn't even in this repo's main flow — it was the FE-03 workflow drill, where a vague one-line prompt produced a settings form that looked finished in under a minute but was missing real validation. The AI didn't lie about what it built; it just built exactly what I asked for, which wasn't the same as what I needed. The more useful moment was actually when an agent *stopped* instead of guessing — I'd referenced a file that didn't exist in the repo, and rather than inventing something plausible, it asked which real file I meant. That's the behavior I want more of: not "never wrong," but "visibly uncertain instead of confidently wrong."