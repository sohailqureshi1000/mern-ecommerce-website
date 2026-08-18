# WORKFLOW.md — AI-Assisted Workflow Drill (FE-03)

## What was built
A user account settings form (name, email, phone, shipping address, password
change) for the SOHAIL MERN ecommerce app, built twice on separate branches:
`round1-vague` (one-sentence prompt, output accepted as-is) and
`round2-precise` (fresh session, plan mode, file references, explicit
constraints, and a "write tests and run them" verification step).

## Correctness
Round 1 produced a working form, but validation is limited to the HTML
`required` attribute on two fields (name, email) — there is no email format
check, no phone format check, and no confirm-password field, so a mistyped
password change silently submits a value the user didn't intend. Round 2
added `validateSettingsForm.js`, which checks email format via regex, phone
via a 10–15 digit pattern, postal code format, and requires a matching
`confirmPassword` plus `currentPassword` before any password change is sent.

One gap survived into **both** branches: `server/src/controllers/userController.js`
is byte-for-byte identical on both rounds and never validates email or phone
format server-side — it only trims and lowercases. Round 2's client-side
validation is solid, but a direct API call (e.g. via Postman) still bypasses
it entirely. This is the one concrete correctness issue I'd flag in review
regardless of which round produced it.

## Accessibility
Round 1's inputs have `<label htmlFor>` but no error-to-input association.
Round 2 wires every field with `aria-invalid` and `aria-describedby` pointing
at its inline error message, so a screen reader announces the specific
problem instead of a generic top-of-form alert.

## Edge cases
Round 1 relies entirely on the server rejecting bad input and showing one
generic alert. Round 2's validator and its two test files
(`validateSettingsForm.test.js`, `checkDuplicateEmail.test.js`) explicitly
cover: empty submit, invalid email, invalid phone, short password, mismatched
confirm-password, skipped password when the field is left blank, missing
current-password, and a duplicate-email stub — 8 named cases vs. zero in
round 1.

## Review effort and time
Round 1 took one message and produced something that *ran*, so it looked
"done" in under a minute — but I only found the missing validation by reading
the code afterward. Round 2 took longer up front: it asked two clarifying
questions (see below) before writing any code, and I had to read and approve
a plan. End-to-end it was slower to start but needed far less post-hoc
fixing, since the tests it wrote itself caught issues before I even opened
the files.

## AI mistake I caught
My round-2 prompt referenced `@src/pages/Signup.jsx`, which doesn't exist in
this repo (the real files are `Login.jsx` and `Register.jsx`). Instead of
guessing, Cursor's agent stopped and asked which file to use as the pattern.
It also flagged that the existing `Settings.jsx` (from round 1) already had
shipping-address fields that my prompt didn't mention, and asked whether to
drop them or keep them — I chose to keep them and apply the same
validation/accessibility pattern to the whole form, not just the fields I'd
listed.
