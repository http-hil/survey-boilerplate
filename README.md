# Survey boilerplate

A client-intake survey that asks the questions senior designers ask. One question per screen, black and white, Geist, every value in a token.

Three files and a font, no build, no dependencies: `index.html`, `survey.css`, `survey.js`, `fonts/`. Works offline.

**Demo:** [http-hil.github.io/survey-boilerplate](https://http-hil.github.io/survey-boilerplate/?name=Sam&company=Northwind)

## Start

1. Download this repo (Code → Download ZIP) and open `index.html` in a browser.
2. Rebrand: change the tokens at the top of `survey.css`.
3. Send the answers somewhere: set `action` on the `<form>` (see [Receive answers](#receive-answers)).

## Rebrand

Everything visual lives in the `:root` tokens at the top of `survey.css`:

| Token | What it does |
| --- | --- |
| `--color-bg`, `--color-fg` | Background and text, light and dark |
| `--color-accent` | Buttons and selected options. Points at `--color-fg` by default |
| `--font-sans` | The one font. Geist ships in `fonts/`. To swap, replace the file and the `@font-face` above the tokens |
| `--radius-control` | `0px` is square. Try `12px` |
| `--size-column` | Width of the question column |
| `--ease`, `--duration-step` | How a question slides in |

Dark mode follows the visitor's system. Force one with `<html data-theme="light">` or `"dark"`.

## Edit the questions

Each question is one `<div class="survey-step" data-step>`. Copy one to add a question, delete one to remove it. Progress, back and Enter adjust on their own.

Pick the answer type by copying a step that has it:

| Answer | Example step | Markup |
| --- | --- | --- |
| Short text, side by side | Q1 | `.survey-fields` with a `.survey-label` per field |
| Long text | Q2 | `<textarea class="survey-field">` |
| Pick one | Q12 | `.survey-choices` with `type="radio"` |
| Pick many | Q6 | `.survey-choices` with `type="checkbox"` |
| Many short options | Q4, Q11 | `.survey-chips` |

How choices behave:

- Click a selected radio to deselect it.
- "Something else" is a text field inside the option. Typing selects it, emptying it deselects it. Add one by copying a row with `data-other-check` and `data-other-text`.
- Add `required` to an input to make the question required. Only the name is required now.

## Personal links

You send the link, so you already know who you're sending it to. Put their name in it:

```
yoursite.com/start?name=Sam&company=Northwind
```

The first question opens with Sam and Northwind filled in. Any text field can be prefilled this way, by its `name`.

## Answers in the questions

A `<span data-fill="company">` shows the answer named `company`:

- Text: what they typed. "Can you explain in 2 sentences what Northwind does?"
- Choices: the one option they picked, lowercased. Pick Website at "What are we building" and later questions say "the new website".
- Several options, none, or "Something else": the fallback, so "the new project".

The fallback is `?company=` from the link, else the text inside the span ("your company", "project").

## Receive answers

Set the form's `action` to any endpoint that accepts a form POST:

```html
<form class="survey-form" method="post" action="https://formspree.io/f/your-id">
```

Works with Formspree, Basin, Getform, Make, Zapier, n8n or your own API. Without an `action`, nothing is sent and the answers are logged to the console.

Or handle it yourself:

```js
document.querySelector('[data-survey]').addEventListener('survey:submit', (event) => {
  event.preventDefault(); // skip the built-in POST
  console.log(event.detail.values); // { name: 'Sam', project: ['Website', 'Something else'], ... }
});
```

`survey:step` fires on every step, for analytics.

## The meeting step

"When are you available for a presentation of the proposal?" is the last step. Send submits everything with a preferred day and time, Skip submits without one. The days are the next 5 working days.

Using Cal.com, Calendly or Google Calendar booking pages? Put their embed inside `.survey-calendar` instead. Keep Skip.

## Keyboard

- `Enter`: next question
- `Shift + Enter`: new line in a long answer
- `Tab`, `Space`: move through and pick options

## Put it in your own site

- **Any site:** link `survey.css` and `survey.js`, paste the `.survey` block from `index.html`. Keep `fonts/` next to `survey.css`. The CSS only touches elements inside `.survey`.
- **React, Vue, Svelte:** render the same markup, then load `survey.js` after it mounts.
- **Webflow:** paste the `.survey` block into an Embed element, and `survey.css` and `survey.js` into the page's custom code. Upload `fonts/Geist-Variable.woff2` under Site settings → Fonts as "Geist" and delete the `@font-face` block.

The survey fills the screen (`100dvh`). Give it its own page. Remove `data-autofocus` from `.survey` if it sits lower on a page.

Without JavaScript it shows as one long form that still submits.

## License

MIT. Use it for client work, change everything.

Geist is by Vercel and basement.studio, under the SIL Open Font License (`fonts/OFL.txt`).
