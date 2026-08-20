# Notes: Comparing my components to shadcn/ui

## Modal / Dialog

**What shadcn handled that I missed:**

1. **`DialogDescription` with `aria-describedby`** — shadcn links both a title
   (`aria-labelledby`) and a description (`aria-describedby`) to the dialog.
   My version only had `aria-labelledby`, so a screen reader user gets the
   title but no linked description of what the dialog is for.

2. **Inert/scroll-locked background** — shadcn's dialog (built on Base UI)
   makes the background content inert and locks page scroll while the
   dialog is open. My version left the background fully interactive and
   scrollable behind the overlay — a screen reader user could still
   navigate into it.

3. **Portal rendering** — shadcn renders the dialog content into a portal
   (effectively at the end of `<body>`), avoiding z-index/stacking issues
   from wherever the component happens to sit in the tree. My dialog
   rendered inline in place.

## Tabs

**What shadcn handled that I missed:**

1. **Vertical orientation support** — shadcn's Tabs accepts
   `orientation="horizontal" | "vertical"` and swaps the arrow key
   handling accordingly (Up/Down instead of Left/Right). I only
   implemented the horizontal case.

2. **Roving tabindex is a library-level primitive** — I hand-rolled the
   roving tabindex logic (tracking refs, updating `tabIndex` per tab).
   shadcn/Base UI's `Tabs.Tab` handles this internally, so consumers don't
   need to re-implement it per project.

## Disclosure

(shadcn doesn't ship a plain Disclosure component — closest equivalent is
Accordion. Not directly compared here.)

## General takeaways

- Building these by hand first made the ARIA APG patterns concrete —
  focus trap, roving tabindex, and aria-expanded aren't abstract rules
  anymore, they're code I had to write and test with a keyboard.
- Reviewing shadcn's source afterward showed that "looks like it works"
  and "is actually accessible" aren't the same thing — the description
  linking and inert background are both things a sighted, mouse-only test
  would never catch, but a screen reader user would notice immediately.