# AGENTS.md

Instructions for AI agents working in this repo. Humans: see README.md.

## Files

- `index.html`: the survey. One `[data-step]` per question, inside one `<form>`.
- `survey.css`: tokens in `:root` at the top, then components. All classes start with `survey-`.
- `survey.js`: step engine. One IIFE, no dependencies, runs on every `[data-survey]`.

No build step, no package manager. Open `index.html` or serve the folder (`python3 -m http.server`).

## Rules

1. Keep it dependency-free. No frameworks, no bundler, no npm packages.
2. Change the look through tokens. Don't hardcode colors, spacing or radii in components.
3. Copy existing markup patterns when adding a question or answer type. The JavaScript relies on these hooks:
   - `[data-survey]` root, `[data-step]` question, `[data-survey-done]` thanks screen
   - `[data-survey-next]`, `[data-survey-skip]`, `[data-survey-back]` buttons
   - `[data-other-check]` + `[data-other-text]` inside one `<label>` for "Something else"
   - `[data-fill="key"]` for URL tokens, `[data-echo="field"]` on the thanks screen, `[data-days]` for generated dates
   - `[data-survey-error]` for a step's error text
4. Keep native inputs. Radios and checkboxes stay real `<input>` elements, visually hidden with `.survey-input`, so keyboard, screen readers and form posts work.
5. No helper text, taglines or secondary labels. A step is a question, its answer, and Continue.
6. Field `name`s are readable slugs (`go-live`, `budget`). They are the keys people see in their inbox.
7. The last `[data-step]` submits. Its Continue is `type="submit"`, not `data-survey-next`.

## Adding a question

1. Copy the `[data-step]` with the answer type you need (see the table in README.md).
2. Give it a unique `aria-labelledby` id on the step and on the `<h2>`.
3. Give its inputs a new `name`.

## Checking your work

Serve the folder and walk the whole survey:

1. Enter advances. Shift+Enter adds a line in a textarea.
2. Clicking a selected radio deselects it.
3. Typing in "Something else" selects it. Clearing it deselects it.
4. Name and email block Continue until filled.
5. The thanks screen says "Thanks, <first name>." and the console logs the answers.
6. Check at 375px wide and in dark mode.
