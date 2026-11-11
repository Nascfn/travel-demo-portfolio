// Wendle concept site. No dependencies, no network requests.

// The signature: the photograph follows the journey you point at.
(() => {
  const list = document.querySelector('.rows');
  const stage = document.getElementById('stage');
  if (!list || !stage) return;
  const rows = [...list.querySelectorAll('.row')];
  const shots = [...stage.querySelectorAll('.shot')];
  const picks = rows.map((row) => row.querySelector('.pick'));
  const select = document.getElementById('journey');

  const show = (index) => {
    rows.forEach((row, i) => row.classList.toggle('is-current', i === index));
    shots.forEach((shot, i) => shot.classList.toggle('is-on', i === index));
  };
  const chosen = () => Math.max(0, picks.findIndex((pick) => pick.checked));

  rows.forEach((row, i) => {
    // Pointing with a mouse previews; a tap or a key chooses.
    row.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') show(i); });
    picks[i].addEventListener('focus', () => show(i));
    picks[i].addEventListener('change', () => {
      show(i);
      if (select) select.value = picks[i].value;
    });
  });
  list.addEventListener('pointerleave', () => show(chosen()));
  show(chosen());
})();

// The nav plate slides away on the way down and returns on the way up, so
// it never sits over a heading that is being read. While the photograph is
// pinned where the plate would land, the plate stays away.
(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const stage = document.getElementById('stage');
  const root = document.documentElement;
  // Overscroll at either end springs back and would read as a change of direction.
  const scrollTop = () => Math.min(Math.max(window.scrollY, 0), Math.max(root.scrollHeight - window.innerHeight, 0));
  const overStage = () => {
    if (!stage || getComputedStyle(stage).position !== 'sticky') return false;
    const s = stage.getBoundingClientRect();
    return s.top < nav.offsetTop + nav.offsetHeight && s.bottom > nav.offsetTop
      && s.left < nav.offsetLeft + nav.offsetWidth && s.right > nav.offsetLeft;
  };
  let last = scrollTop();
  let queued = false;
  const update = () => {
    queued = false;
    const y = scrollTop();
    if (y < 120) nav.classList.remove('is-away');
    else if (y > last + 4 || overStage()) nav.classList.add('is-away');
    else if (y < last - 4) nav.classList.remove('is-away');
    last = y;
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
})();

// One-time arrivals: the wide photograph settles, the ink rules and the
// itinerary bars draw, each when it comes into view.
(() => {
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window)) { items.forEach((item) => item.classList.add('is-in')); return; }
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      seen.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  items.forEach((item) => seen.observe(item));
})();

// The request form is not connected to anything in this concept. It checks
// the fields, sends nothing and says so. Set data-endpoint to wire it up.
document.querySelectorAll('form[data-endpoint]').forEach((form) => {
  const help = form.querySelector('[role="status"]');
  const fields = [...form.querySelectorAll('[required]')];
  const messages = {
    name: 'Add your name so we know who to ask for.',
    email: 'That address looks incomplete. Write it as name@example.com.',
  };
  const check = (field) => {
    const ok = field.checkValidity();
    field.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  fields.forEach((field) => field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true' && check(field)) help.textContent = '';
  }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const bad = fields.filter((field) => !check(field));
    if (bad.length) {
      help.textContent = messages[bad[0].name];
      bad[0].focus();
      return;
    }
    if (!form.dataset.endpoint) {
      help.textContent = 'Nothing was sent: this form is not connected in this concept.';
      return;
    }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((response) => { help.textContent = response.ok ? 'Your request is with us. We will write back to arrange the hour.' : 'That did not go through. Try again in a minute.'; })
      .catch(() => { help.textContent = 'That did not go through. Try again in a minute.'; })
      .finally(() => { button.disabled = false; button.removeAttribute('aria-busy'); });
  });
});
