/* ==========================================================================
   Survey boilerplate: one question at a time.
   No dependencies, no build. Runs on every [data-survey] element on the page.
   Without this file the survey is one long form that still submits.

   Events (listen on the [data-survey] element):
   - survey:step    detail { index, step }       every time a step shows
   - survey:submit  detail { data, values }      before sending. Call
                    event.preventDefault() to send it yourself instead.
   ========================================================================== */

(() => {
  const touch = matchMedia('(pointer: coarse)').matches;

  document.querySelectorAll('[data-survey]').forEach(init);

  function init(root) {
    const form = root.querySelector('form');
    const done = root.querySelector('[data-survey-done]');
    const back = root.querySelector('[data-survey-back]');
    const questions = [...form.querySelectorAll('[data-step]')];
    const steps = done ? [...questions, done] : questions;
    const picked = new Map(); // radio group name → checked radio, for click-to-deselect
    const fills = new Map(); // [data-fill] element → fallback text
    let index = 0;
    let busy = false;

    form.noValidate = true; // validated per step below
    steps.forEach((step) => { step.tabIndex = -1; });
    form.querySelectorAll('input[type="radio"]:checked').forEach((radio) => picked.set(radio.name, radio));

    fillFromUrl();
    fillDays();
    root.classList.add('is-ready');
    show(0, root.hasAttribute('data-autofocus'));

    /* Navigation ----------------------------------------------------------- */

    function show(i, moveFocus = true) {
      index = Math.max(0, Math.min(i, steps.length - 1));
      const step = steps[index];

      steps.forEach((other, j) => {
        other.dataset.state = j < index ? 'past' : j === index ? 'current' : 'next';
        other.inert = j !== index;
      });

      root.style.setProperty('--progress', (index + 1) / steps.length);
      if (back) back.disabled = index === 0 || step === done;
      if (moveFocus) focus(step);
      root.dispatchEvent(new CustomEvent('survey:step', { bubbles: true, detail: { index, step } }));
    }

    function focus(step) {
      // On phones, don't pop the keyboard open on every step
      const field = !touch && step.querySelector('textarea, input.survey-field');
      (field || step).focus({ preventScroll: true });
    }

    function next() {
      const step = steps[index];
      if (busy || step === done || !validate(step)) return;
      if (index === questions.length - 1) submit();
      else show(index + 1);
    }

    function skip() {
      const step = steps[index];
      step.querySelectorAll('input, textarea, select').forEach((field) => {
        if (field.type === 'radio' || field.type === 'checkbox') {
          field.checked = false;
          if (picked.get(field.name) === field) picked.delete(field.name);
        } else {
          field.value = '';
        }
      });
      clearError(step);
      updateFills();
      if (index === questions.length - 1) submit();
      else show(index + 1);
    }

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-survey-next]')) next();
      else if (event.target.closest('[data-survey-skip]')) skip();
      else if (event.target.closest('[data-survey-back]')) show(index - 1);
    });

    // Enter = next. Shift+Enter is a new line in long answers (and Enter, on phones).
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return;
      const target = event.target;
      if (target.closest('button, a')) return;
      if (target.matches('textarea') && (event.shiftKey || touch)) return;
      event.preventDefault();
      next();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      next();
    });

    /* Choices -------------------------------------------------------------- */

    // Clicking the selected radio deselects it
    form.addEventListener('click', (event) => {
      const radio = event.target;
      if (!(radio instanceof HTMLInputElement) || radio.type !== 'radio') return;
      if (picked.get(radio.name) === radio) setChecked(radio, false);
    });

    // "Something else": typing selects it, emptying it deselects it
    form.addEventListener('input', (event) => {
      const text = event.target.closest('[data-other-text]');
      const check = text && text.closest('label').querySelector('[data-other-check]');
      if (check) setChecked(check, text.value !== '');
      updateFills();
    });

    form.addEventListener('change', (event) => {
      const input = event.target;
      clearError(input.closest('[data-step]'));

      if (input.type === 'radio') {
        picked.set(input.name, input.checked ? input : null);
        // Picking another option empties this group's "Something else"
        form.querySelectorAll(`[data-other-check][name="${CSS.escape(input.name)}"]`).forEach((check) => {
          if (!check.checked) otherText(check).value = '';
        });
      }

      if (input.matches('[data-other-check]')) {
        const text = otherText(input);
        if (input.checked && document.activeElement !== text) text.focus();
        if (!input.checked) text.value = '';
      }

      updateFills();
    });

    function otherText(check) {
      return check.closest('label').querySelector('[data-other-text]');
    }

    function setChecked(input, checked) {
      if (input.checked === checked) return;
      input.checked = checked;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* Validation ----------------------------------------------------------- */

    function validate(step) {
      // A "Something else" without text doesn't count as an answer
      step.querySelectorAll('[data-other-check]:checked').forEach((check) => {
        if (!otherText(check).value.trim()) setChecked(check, false);
      });

      const invalid = [...step.querySelectorAll('input, textarea, select')].find((field) => !field.checkValidity());
      if (!invalid) return true;

      if (invalid.classList.contains('survey-input')) {
        // Hidden radio or checkbox: show the message in the step
        showError(step, invalid.validationMessage);
        invalid.focus();
      } else {
        invalid.reportValidity();
      }
      return false;
    }

    function showError(step, message) {
      let el = step.querySelector('[data-survey-error]');
      if (!el) {
        el = document.createElement('p');
        el.className = 'survey-error';
        el.setAttribute('role', 'alert');
        el.setAttribute('data-survey-error', '');
        const actions = step.querySelector('.survey-actions');
        if (actions) actions.before(el);
        else step.querySelector('.survey-column').append(el);
      }
      el.textContent = message;
    }

    function clearError(step) {
      const el = step && step.querySelector('[data-survey-error]');
      if (el) el.textContent = '';
    }

    /* Sending -------------------------------------------------------------- */

    async function submit() {
      const step = steps[index];
      const data = new FormData(form);
      const values = {};
      for (const [key, value] of data) {
        if (value === '') continue;
        values[key] = key in values ? [].concat(values[key], value) : value;
      }

      const action = form.getAttribute('action');
      const send = root.dispatchEvent(new CustomEvent('survey:submit', {
        bubbles: true,
        cancelable: true,
        detail: { data, values },
      }));

      if (send && action) {
        const buttons = step.querySelectorAll('button');
        busy = true;
        buttons.forEach((button) => button.setAttribute('aria-busy', 'true'));
        try {
          const response = await fetch(form.action, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          console.error('[survey]', error);
          showError(step, form.dataset.error || 'That didn’t send. Try again.');
          return;
        } finally {
          busy = false;
          buttons.forEach((button) => button.removeAttribute('aria-busy'));
        }
      } else if (send) {
        console.info('[survey] No form action set, so nothing was sent. Answers:', values);
      }

      // "Thanks, Sam." uses the first word of the name field
      root.querySelectorAll('[data-echo]').forEach((el) => {
        const value = String(values[el.dataset.echo] || '').trim().split(/\s+/)[0];
        el.textContent = value ? (el.dataset.prefix || '') + value : '';
      });

      if (done) show(steps.length - 1);
    }

    /* Personal links and dates --------------------------------------------- */

    // Optional: ?name= and ?company= in the link prefill the fields with those names.
    // Each [data-fill] falls back to ?key= from the link, else its own text.
    function fillFromUrl() {
      const params = new URLSearchParams(location.search);
      form.querySelectorAll('.survey-field').forEach((field) => {
        const value = params.get(field.name);
        if (value && !field.value) field.value = value;
      });
      root.querySelectorAll('[data-fill]').forEach((el) => {
        fills.set(el, params.get(el.dataset.fill) || el.textContent);
      });
      updateFills();
    }

    // [data-fill="company"] shows the answer named "company": the typed text,
    // or the one option picked (lowercased). Several, none or "Something else"
    // show the fallback, so "a new website" becomes "a new project".
    function updateFills() {
      fills.forEach((fallback, el) => {
        el.textContent = answer(el.dataset.fill) || fallback;
      });
    }

    function answer(name) {
      const given = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)].filter((field) =>
        field.type === 'checkbox' || field.type === 'radio' ? field.checked : field.value.trim()
      );
      if (given.length !== 1 || given[0].matches('[data-other-check]')) return '';
      const field = given[0];
      return field.classList.contains('survey-input') ? field.value.toLowerCase() : field.value.trim();
    }

    // [data-days] lists the next working days (5, or the number you set)
    function fillDays() {
      const list = root.querySelector('[data-days]');
      const template = list && list.querySelector('.survey-chip');
      if (!template) return;

      const count = Number(list.dataset.days) || 5;
      const weekday = new Intl.DateTimeFormat(document.documentElement.lang || undefined, { weekday: 'short' });
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      const chips = [];

      while (chips.length < count) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const chip = template.cloneNode(true);
        const input = chip.querySelector('input');
        input.checked = false;
        input.value = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
          .map((n) => String(n).padStart(2, '0'))
          .join('-');
        chip.querySelector('span').textContent = `${weekday.format(date)} ${date.getDate()}`;
        chips.push(chip);
      }

      list.replaceChildren(...chips);
    }
  }
})();
