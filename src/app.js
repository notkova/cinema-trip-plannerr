import { MOVIES, CINEMAS, SNACK_PRICE } from './data.js';
import { schedule, costs, parseFriends, planSummary } from './planner.js';

const STORAGE = { plans: 'kino-planer.plans', movies: 'kino-planer.movies' };

const state = {
  movies: [...MOVIES, ...load(STORAGE.movies, [])],
  plans: load(STORAGE.plans, []),
  search: '',
  genre: '',
};

const $ = (sel) => document.querySelector(sel);
const form = $('#plan-form');
const field = (name) => form.elements[name];

// ---------- Складирање ----------

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast('Не можам да зачувам во прелистувачот.');
  }
}

// ---------- Филмови ----------

function renderGenres() {
  const genres = [...new Set(state.movies.map((m) => m.genre))].sort((a, b) => a.localeCompare(b, 'mk'));
  $('#genre-filter').replaceChildren(
    new Option('Сите жанрови', ''),
    ...genres.map((g) => new Option(g, g, false, g === state.genre)),
  );
}

function renderMovies() {
  const q = state.search.toLowerCase();
  const visible = state.movies.filter(
    (m) => (!state.genre || m.genre === state.genre) && m.title.toLowerCase().includes(q),
  );
  const list = $('#movie-list');
  if (!visible.length) {
    list.innerHTML = '<p class="empty">Нема филмови за овој избор.</p>';
    return;
  }
  list.replaceChildren(
    ...visible.map((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'movie';
      btn.dataset.id = m.id;
      btn.setAttribute('aria-pressed', String(field('movie').value === m.id));
      btn.innerHTML = `<span class="emoji"></span><strong></strong><small></small>`;
      btn.querySelector('.emoji').textContent = m.emoji ?? '🎬';
      btn.querySelector('strong').textContent = m.title;
      btn.querySelector('small').textContent = `${m.genre} · ${m.duration} мин${m.rating ? ` · ${m.rating}` : ''}`;
      return btn;
    }),
  );
}

function renderMovieSelect() {
  const current = field('movie').value;
  field('movie').replaceChildren(...state.movies.map((m) => new Option(m.title, m.id, false, m.id === current)));
}

function selectMovie(id) {
  field('movie').value = id;
  renderMovies();
  updatePreview();
}

// ---------- Кино и термини ----------

function renderCinemaSelect() {
  field('cinema').replaceChildren(...CINEMAS.map((c) => new Option(c.name, c.id)));
}

function applyCinema() {
  const cinema = CINEMAS.find((c) => c.id === field('cinema').value) ?? CINEMAS[0];
  field('showtime').replaceChildren(...cinema.showtimes.map((t) => new Option(t, t)));
  field('ticketPrice').value = cinema.ticketPrice;
  field('travel').value = cinema.travelMinutes;
}

function applyTransport() {
  const walking = field('transport').value === 'walk';
  field('transportPrice').disabled = walking;
  if (walking) field('transportPrice').value = 0;
}

// ---------- План ----------

function readPlan() {
  const movie = state.movies.find((m) => m.id === field('movie').value);
  const cinema = CINEMAS.find((c) => c.id === field('cinema').value);
  const showtime = field('showtime').value;
  if (!movie || !cinema || !showtime) return null;

  const friends = parseFriends(field('friends').value);
  const transport = field('transport').value;
  const travelMinutes = Number(field('travel').value);

  return {
    movieId: movie.id,
    movieTitle: movie.title,
    cinemaName: cinema.name,
    date: field('date').value,
    friends,
    transport,
    notes: field('notes').value.trim(),
    schedule: schedule({ showtime, durationMinutes: movie.duration, travelMinutes }),
    costs: costs({
      people: friends.length + 1,
      ticketPrice: field('ticketPrice').value,
      snackPrice: field('snacks').checked ? SNACK_PRICE : 0,
      transport,
      transportPrice: field('transportPrice').value,
    }),
  };
}

function updatePreview() {
  const preview = $('#preview');
  const plan = readPlan();
  if (!plan) {
    preview.innerHTML = '<p class="error">Избери филм, кино и термин.</p>';
    return;
  }
  const items = [
    ['Тргнувате во', plan.schedule.leave],
    ['Почеток', plan.schedule.start],
    ['Крај (околу)', plan.schedule.end],
    ['Дома (околу)', plan.schedule.home],
    ['Луѓе', plan.costs.people],
    ['Вкупно', `${plan.costs.total} ден.`],
    ['По човек', `${plan.costs.perPerson} ден.`],
  ];
  const dl = document.createElement('dl');
  for (const [label, value] of items) {
    const div = document.createElement('div');
    div.innerHTML = '<dt></dt><dd></dd>';
    div.querySelector('dt').textContent = label;
    div.querySelector('dd').textContent = value;
    dl.append(div);
  }
  preview.replaceChildren(dl);
}

function savePlan(event) {
  event.preventDefault();
  const plan = readPlan();
  if (!plan || !form.reportValidity()) return;
  state.plans.push({ ...plan, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: Date.now() });
  save(STORAGE.plans, state.plans);
  renderPlans();
  toast('Планот е зачуван ✔');
}

function renderPlans() {
  const list = $('#plan-list');
  if (!state.plans.length) {
    list.innerHTML = '<p class="empty">Сè уште немате зачувани планови.</p>';
    return;
  }
  const today = todayISO();
  const sorted = [...state.plans].sort((a, b) =>
    `${a.date} ${a.schedule.start}`.localeCompare(`${b.date} ${b.schedule.start}`),
  );
  list.replaceChildren(
    ...sorted.map((plan) => {
      const el = document.createElement('article');
      el.className = `plan${plan.date < today ? ' past' : ''}`;
      el.innerHTML = `<pre></pre>
        <div class="actions">
          <button type="button" class="link" data-action="copy">📋 Копирај</button>
          <button type="button" class="link" data-action="share">📤 Сподели</button>
          <button type="button" class="link" data-action="delete">🗑️ Избриши</button>
        </div>`;
      el.querySelector('pre').textContent = planSummary(plan);
      el.dataset.id = plan.id;
      return el;
    }),
  );
}

async function onPlanAction(event) {
  const btn = event.target.closest('button[data-action]');
  if (!btn) return;
  const plan = state.plans.find((p) => p.id === btn.closest('.plan').dataset.id);
  if (!plan) return;
  const text = planSummary(plan);

  if (btn.dataset.action === 'delete') {
    if (!confirm('Да го избришам овој план?')) return;
    state.plans = state.plans.filter((p) => p.id !== plan.id);
    save(STORAGE.plans, state.plans);
    renderPlans();
  } else if (btn.dataset.action === 'share' && navigator.share) {
    navigator.share({ title: 'Одиме во кино!', text }).catch(() => {});
  } else {
    try {
      await navigator.clipboard.writeText(text);
      toast('Копирано — пратете им го на пријателите!');
    } catch {
      toast('Копирањето не успеа.');
    }
  }
}

// ---------- Додавање филм ----------

function addMovie(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const movie = {
    id: `u${Date.now()}`,
    title: String(data.get('title')).trim(),
    genre: String(data.get('genre')).trim(),
    duration: Number(data.get('duration')),
    emoji: '🎬',
  };
  if (!movie.title || !movie.genre || !(movie.duration > 0)) return;
  state.movies.push(movie);
  save(STORAGE.movies, state.movies.filter((m) => m.id.startsWith('u')));
  event.target.reset();
  renderGenres();
  renderMovieSelect();
  selectMovie(movie.id);
  toast(`„${movie.title}“ е додаден`);
}

// ---------- Помошни ----------

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2500);
}

// ---------- Почеток ----------

function init() {
  renderGenres();
  renderMovieSelect();
  renderCinemaSelect();
  applyCinema();
  applyTransport();
  field('date').value = todayISO();
  field('date').min = todayISO();

  $('#search').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderMovies();
  });
  $('#genre-filter').addEventListener('change', (e) => {
    state.genre = e.target.value;
    renderMovies();
  });
  $('#movie-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.movie');
    if (btn) selectMovie(btn.dataset.id);
  });
  $('#movie-form').addEventListener('submit', addMovie);

  field('cinema').addEventListener('change', applyCinema);
  field('transport').addEventListener('change', applyTransport);
  form.addEventListener('change', () => {
    renderMovies();
    updatePreview();
  });
  form.addEventListener('input', updatePreview);
  form.addEventListener('submit', savePlan);
  $('#plan-list').addEventListener('click', onPlanAction);

  renderMovies();
  renderPlans();
  updatePreview();
}

init();
