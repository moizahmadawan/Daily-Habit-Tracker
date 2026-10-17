import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, Circle, Leaf, Plus, Sparkles, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'roz-ka-saathi-habits-v1';
const ENGLISH_SEED_NAMES = {
  'seed-pani': 'Drink a glass of water',
  'seed-walk': 'Take a 10-minute walk',
  'seed-reading': 'Read before bed',
};

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeSeedHabits() {
  return [
    { id: 'seed-pani', name: ENGLISH_SEED_NAMES['seed-pani'], completedDates: [] },
    { id: 'seed-walk', name: ENGLISH_SEED_NAMES['seed-walk'], completedDates: [] },
    { id: 'seed-reading', name: ENGLISH_SEED_NAMES['seed-reading'], completedDates: [] },
  ];
}

function loadHabits() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((habit) =>
          habit &&
          typeof habit.id === 'string' &&
          typeof habit.name === 'string' &&
          Array.isArray(habit.completedDates),
        ).map((habit) => Object.hasOwn(ENGLISH_SEED_NAMES, habit.id)
          ? { ...habit, name: ENGLISH_SEED_NAMES[habit.id] }
          : habit);
      }
    }
  } catch {
    // A blocked or malformed local store should not stop someone using the tracker.
  }
  return makeSeedHabits();
}

function DailyHabitTracker() {
  const [habits, setHabits] = useState(loadHabits);
  const [habitName, setHabitName] = useState('');
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [today, setToday] = useState(() => getLocalDateKey());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch {
      setToast('Could not save in this browser. Check your storage settings.');
    }
  }, [habits]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentDate = getLocalDateKey();
      setToday((previous) => previous === currentDate ? previous : currentDate);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const completedCount = useMemo(
    () => habits.filter((habit) => habit.completedDates.includes(today)).length,
    [habits, today],
  );
  const percentage = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;
  const habitLabel = habits.length === 1 ? 'habit' : 'habits';
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
    [today],
  );

  function addHabit(event) {
    event.preventDefault();
    const name = habitName.trim();
    if (!name) {
      setFormError('Enter a name for your habit first.');
      return;
    }
    if (name.length > 60) {
      setFormError('Keep the name to 60 characters or fewer.');
      return;
    }
    setHabits((previous) => [...previous, {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      completedDates: [],
    }]);
    setHabitName('');
    setFormError('');
    setToast('Your new habit has been added.');
  }

  function toggleHabit(id) {
    const habit = habits.find((item) => item.id === id);
    if (!habit) return;
    const wasComplete = habit.completedDates.includes(today);
    setHabits((previous) => previous.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        completedDates: wasComplete
          ? item.completedDates.filter((date) => date !== today)
          : [...item.completedDates, today],
      };
    }));
    setToast(wasComplete ? 'Unchecked for today.' : 'Nice work! One more step done today.');
  }

  function deleteHabit(id) {
    setHabits((previous) => previous.filter((habit) => habit.id !== id));
    setToast('Habit removed from your list.');
  }

  return (
    <main className="page-shell" data-testid="page-habit-tracker">
      <header className="topbar">
        <div className="brand" data-testid="brand-roz-ka-saathi">
          <div className="brand-mark" aria-hidden="true"><Leaf size={21} strokeWidth={1.8} /></div>
          <div>
            <div className="brand-name">Daily Companion</div>
            <div className="brand-caption">Your everyday habit companion</div>
          </div>
        </div>
        <div className="top-note" data-testid="text-small-steps-note">
          <span aria-hidden="true" />
          <span>Small steps, better days</span>
        </div>
      </header>

      <div className="content-grid">
        <section className="main-column" aria-labelledby="welcome-heading">
          <p className="eyebrow">A fresh page</p>
          <h1 id="welcome-heading">At your own pace.<br /><em>Better each day.</em></h1>
          <p className="intro">Big changes aren't required. Just one small step today — then another tomorrow.</p>
          <p className="date-line" data-testid="text-today-date">Today, {dateLabel}</p>

          <section className="progress-panel" aria-label="Today's progress" data-testid="panel-daily-progress">
            <div className="progress-head">
              <div>
                <div className="progress-label">Today's progress</div>
                <div className="progress-count" data-testid="text-completion-count">
                  {completedCount} <small>/ {habits.length} {habitLabel}</small>
                </div>
              </div>
              <div className="progress-percent" data-testid="text-progress-percentage">{percentage}%</div>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Habits completed today"
              aria-valuemin="0"
              aria-valuemax={habits.length || 1}
              aria-valuenow={completedCount}
              data-testid="progress-daily-completion"
            >
              <div className="progress-fill" style={{ width: `${percentage}%` }} />
            </div>
            <p className="progress-caption" data-testid="text-progress-encouragement">
              {habits.length === 0
                ? "Add your first habit to begin today's page."
                : completedCount === habits.length
                  ? 'You did everything for today. Take a moment to celebrate!'
                  : completedCount === 0
                    ? 'Your first step is waiting.'
                    : `${habits.length - completedCount} ${habits.length - completedCount === 1 ? 'habit' : 'habits'} left — take your time.`}
            </p>
          </section>

          <section className="habit-area" aria-labelledby="habits-heading">
            <div className="section-head">
              <h2 className="section-title" id="habits-heading">My habits</h2>
              <span className="habit-count" data-testid="text-habit-total">{habits.length} {habitLabel}</span>
            </div>

            {habits.length > 0 ? (
              <div className="habit-list" role="list" aria-label="Your daily habits" data-testid="list-habits">
                {habits.map((habit, index) => {
                  const complete = habit.completedDates.includes(today);
                  return (
                    <article className={`habit-row${complete ? ' is-complete' : ''}`} role="listitem" key={habit.id} data-testid={`card-habit-${habit.id}`} style={{ animationDelay: `${index * 55}ms` }}>
                      <button
                        type="button"
                        className="habit-check"
                        onClick={() => toggleHabit(habit.id)}
                        aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${habit.name}`}
                        aria-pressed={complete}
                        data-testid={`button-toggle-habit-${habit.id}`}
                      >
                        {complete && <Check size={17} strokeWidth={2.7} aria-hidden="true" />}
                      </button>
                      <span className="habit-name" data-testid={`text-habit-name-${habit.id}`}>{habit.name}</span>
                      <span className="habit-status" data-testid={`status-habit-${habit.id}`}>
                        {complete ? <><CheckCheck size={14} aria-hidden="true" /> Done</> : 'To do today'}
                      </span>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteHabit(habit.id)}
                        aria-label={`Delete habit: ${habit.name}`}
                        data-testid={`button-delete-habit-${habit.id}`}
                      >
                        <Trash2 size={17} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" data-testid="empty-habits-state">
                <div className="empty-symbol" aria-hidden="true"><Circle size={22} strokeWidth={1.6} /></div>
                <h3 className="empty-title">There's room for a fresh start.</h3>
                <p className="empty-copy">Add your first habit below. Make it as small or important as you like.</p>
              </div>
            )}

            <form className="add-form" onSubmit={addHabit} data-testid="form-add-habit">
              <Plus className="add-icon" size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="new-habit">New habit name</label>
              <input
                id="new-habit"
                className="add-input"
                type="text"
                value={habitName}
                onChange={(event) => {
                  setHabitName(event.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Add a new habit..."
                maxLength={60}
                autoComplete="off"
                aria-describedby={formError ? 'habit-form-hint' : undefined}
                data-testid="input-new-habit"
              />
              <button className="add-button" type="submit" disabled={!habitName.trim()} data-testid="button-add-habit">
                <Plus size={15} aria-hidden="true" /> Add habit
              </button>
            </form>
            <p className={`form-hint${formError ? ' error' : ''}`} id="habit-form-hint" role={formError ? 'alert' : undefined} data-testid="text-habit-form-hint">
              {formError || 'Habit names can be up to 60 characters.'}
            </p>
          </section>
        </section>

        <aside className="side-column" aria-label="A small reminder for today">
          <section className="quote-card" data-testid="card-daily-reminder">
            <div className="quote-mark" aria-hidden="true">“</div>
            <blockquote>Little by little, a lot gets done.</blockquote>
            <div className="quote-rule" />
            <p className="quote-caption">A gentle reminder for today</p>
          </section>
          <section className="ritual-card" data-testid="card-gentle-reminder">
            <h2 className="ritual-title"><Sparkles size={17} strokeWidth={1.8} aria-hidden="true" /> Be kind to yourself</h2>
            <p className="ritual-copy">If today doesn't go as planned, that's okay. You can always start again tomorrow.</p>
          </section>
        </aside>
      </div>

      <footer className="footer-note">
        <span>Little habits. Big changes.</span>
      </footer>
      {toast && <div className="toast-message" role="status" aria-live="polite" data-testid="status-feedback"><Check size={16} aria-hidden="true" />{toast}</div>}
    </main>
  );
}

export default DailyHabitTracker;
