import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Flame, Target,
  CheckCircle2, Circle, TrendingUp, Calendar,
  Zap, Award, Sparkles, Trophy,
  BookOpen, Dumbbell, Music, Coffee, Moon,
  Sun, Palette,
} from 'lucide-react';
import { eventRecorder } from '../lib/event-recorder';

// ── Types ───────────────────────────────────────────────
interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  logs: string[]; // ISO date strings
  streak: number;
  createdAt: number;
}

type Page = 'dashboard' | 'add-habit' | 'weekly' | 'stats';

const HABIT_ICONS = [BookOpen, Dumbbell, Music, Coffee, Moon, Sun, Palette, Zap];

const DEFAULT_HABITS = [
  { name: 'Morning Reading', icon: '📖', color: '#7c3aed', days: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'] },
  { name: 'Exercise', icon: '💪', color: '#22c55e', days: ['2026-01-01', '2026-01-03', '2026-01-05'] },
  { name: 'Meditate', icon: '🧘', color: '#3b82f6', days: ['2026-01-02', '2026-01-04', '2026-01-05'] },
  { name: 'Drink Water', icon: '💧', color: '#06b6d4', days: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'] },
];

const getToday = () => new Date().toISOString().split('T')[0];

const getWeekDates = () => {
  const dates: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const calculateStreak = (logs: string[]): number => {
  if (logs.length === 0) return 0;
  const sorted = [...new Set(logs)].sort().reverse();
  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today);

  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === streak) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

let idCounter = 0;
const genId = () => `habit-${++idCounter}-${Date.now()}`;

// ── Component ────────────────────────────────────────────
export default function SimulatedHabitTrackerApp() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('💪');
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const mountedRef = useRef(false);

  const weekDates = getWeekDates();

  // Initialize with sample data
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      eventRecorder.captureNavigation('demo://habittracker', 'HabitTracker - Daily Habits');

      const initialHabits: Habit[] = DEFAULT_HABITS.map(h => ({
        id: genId(),
        name: h.name,
        icon: h.icon,
        color: h.color,
        logs: h.days,
        streak: calculateStreak(h.days),
        createdAt: Date.now(),
      }));
      setHabits(initialHabits);
    }
  }, []);

  // Recalculate streaks when logs change
  useEffect(() => {
    setHabits(prev => prev.map(h => ({ ...h, streak: calculateStreak(h.logs) })));
  }, []);

  // ── Actions ──────────────────────────────────────────────
  const toggleHabit = (habitId: string) => {
    const today = getToday();
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const hasLog = h.logs.includes(today);
      const newLogs = hasLog
        ? h.logs.filter(d => d !== today)
        : [...h.logs, today];
      eventRecorder.captureClick(hasLog ? `Uncheck habit: "${h.name}"` : `Check habit: "${h.name}"`);
      return {
        ...h,
        logs: newLogs,
        streak: calculateStreak(newLogs),
      };
    }));
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    const habit: Habit = {
      id: genId(),
      name,
      icon: newHabitIcon,
      color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      logs: [],
      streak: 0,
      createdAt: Date.now(),
    };
    setHabits(prev => [...prev, habit]);
    setNewHabitName('');
    setCurrentPage('dashboard');
    eventRecorder.captureClick(`Add Habit: "${name}"`);
    eventRecorder.captureInput('habit-name-input', name);
  };

  const deleteHabit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    eventRecorder.captureClick(`Delete Habit: "${habit?.name}"`);
  };

  const editHabit = (habitId: string) => {
    const newName = editName.trim();
    if (!newName) return;
    setHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, name: newName } : h
    ));
    setEditingHabitId(null);
    setEditName('');
    eventRecorder.captureClick(`Rename habit to: "${newName}"`);
  };

  // ── Stats ────────────────────────────────────────────────
  const today = getToday();
  const todayCompleted = habits.filter(h => h.logs.includes(today)).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;
  const totalStreak = Math.max(...habits.map(h => h.streak), 0);
  const totalLogs = habits.reduce((sum, h) => sum + h.logs.length, 0);

  const thisWeekCompletions = weekDates.map(date =>
    habits.filter(h => h.logs.includes(date)).length
  );
  const bestDayThisWeek = Math.max(...thisWeekCompletions, 1);

  // ── Render: Dashboard ──────────────────────────────────
  const renderDashboard = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">HabitSpark</h2>
            <p className="text-[10px] text-text-dim">Daily Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentPage('stats'); eventRecorder.captureClick('View Stats'); }}
            className="p-2 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            title="Stats"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentPage('add-habit'); eventRecorder.captureClick('Add Habit'); }}
            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Today's progress mini-card */}
      {totalHabits > 0 && (
        <div className="px-5 py-3 border-b border-border/20 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-dim">Today's Progress</span>
            <span className="text-xs text-text-muted">{todayCompleted}/{totalHabits} done</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          {completionRate === 100 && totalHabits > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-success text-xs font-medium">
              <Trophy className="w-3.5 h-3.5" />
              All done for today!
            </div>
          )}
        </div>
      )}

      {/* Habit list */}
      <div className="flex-1 overflow-y-auto p-5">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-4">
              <Flame className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No habits yet</h3>
            <p className="text-xs text-text-muted max-w-[220px] mb-6">
              Build better habits by tracking them daily. Start with one small habit.
            </p>
            <button
              onClick={() => setCurrentPage('add-habit')}
              className="btn-primary text-sm py-2 px-5 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Habit
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Week mini-view */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">This Week</h3>
              <button
                onClick={() => { setCurrentPage('stats'); eventRecorder.captureClick('View Stats'); }}
                className="text-xs text-primary hover:text-accent transition-colors cursor-pointer"
              >
                View Stats
              </button>
            </div>

            {habits.map(habit => {
              const checkedToday = habit.logs.includes(today);
              return (
                <div
                  key={habit.id}
                  className={`card p-3.5 flex items-center gap-3 transition-all duration-200 ${
                    checkedToday ? 'border-success/30' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className="shrink-0 cursor-pointer"
                    title={checkedToday ? 'Mark as incomplete' : 'Mark as done'}
                  >
                    {checkedToday ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <Circle className="w-6 h-6 text-text-dim" />
                    )}
                  </button>

                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${habit.color}15` }}
                  >
                    <span>{habit.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {editingHabitId === habit.id ? (
                      <div className="flex gap-1.5">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') editHabit(habit.id); if (e.key === 'Escape') setEditingHabitId(null); }}
                          className="input-field text-xs py-1 px-2"
                          autoFocus
                        />
                        <button
                          onClick={() => editHabit(habit.id)}
                          className="text-xs px-2 py-1 rounded bg-primary text-white cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-sm font-medium block ${
                          checkedToday ? 'text-foreground' : 'text-text-muted'
                        }`}
                        onDoubleClick={() => { setEditingHabitId(habit.id); setEditName(habit.name); }}
                      >
                        {habit.name}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {habit.streak} day streak
                      </span>
                      <span>·</span>
                      <span>{habit.logs.length} total</span>
                    </div>
                  </div>

                  {/* Quick week preview for this habit */}
                  <div className="flex gap-0.5">
                    {weekDates.map(date => {
                      const done = habit.logs.includes(date);
                      return (
                        <div
                          key={date}
                          className={`w-2.5 h-2.5 rounded-sm ${
                            done
                              ? 'bg-success'
                              : date === today
                                ? 'bg-muted border border-border/50'
                                : 'bg-muted/30'
                          }`}
                          title={`${date}: ${done ? 'Done' : 'Not done'}`}
                        />
                      );
                    })}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-1 rounded text-text-dim hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Add Habit ──────────────────────────────────
  const renderAddHabit = () => {
    const icons = ['📖', '💪', '🧘', '💧', '🎵', '☕', '🌙', '☀️', '🎨', '⚡', '🍎', '✍️', '🏃', '🧠', '🌿'];

    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground">New Habit</span>
        </div>

        <div className="flex-1 p-5">
          <div className="space-y-5">
            {/* Icon picker */}
            <div>
              <label className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2 block">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {icons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewHabitIcon(icon)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      newHabitIcon === icon
                        ? 'bg-primary/20 border-2 border-primary scale-110'
                        : 'bg-muted/50 border border-border/30 hover:border-primary/30'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2 block">
                Habit Name
              </label>
              <input
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHabit()}
                placeholder="e.g. Read 20 pages, Run 5k..."
                className="input-field text-sm"
                autoFocus
              />
            </div>

            {/* Tip */}
            <div className="card p-4 bg-primary/5 border-primary/10">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Pro Tip</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Start small! A habit you can do in 2 minutes is easier to stick with than one that takes 30.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={addHabit}
              disabled={!newHabitName.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Habit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Stats ────────────────────────────────────────
  const renderStats = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">Your Stats</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card p-4 text-center">
            <Flame className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalStreak}</p>
            <p className="text-[10px] text-text-dim">Best Streak</p>
          </div>
          <div className="card p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
            <p className="text-[10px] text-text-dim">Today</p>
          </div>
          <div className="card p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalLogs}</p>
            <p className="text-[10px] text-text-dim">Total Checks</p>
          </div>
          <div className="card p-4 text-center">
            <Award className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalHabits}</p>
            <p className="text-[10px] text-text-dim">Active Habits</p>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="card p-4 mb-3">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">This Week</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {weekDates.map((date, i) => {
              const count = thisWeekCompletions[i];
              const height = Math.max((count / bestDayThisWeek) * 100, 8);
              const isToday = date === today;
              return (
                <div key={date} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[9px] text-text-dim">{count}</span>
                  <div className="w-full rounded-md relative" style={{ height: `${height}%`, minHeight: '12px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-md transition-all duration-500 ${
                        isToday ? 'bg-gradient-to-t from-primary to-accent' : 'bg-primary/30'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-text-dim'}`}>
                    {DAY_LABELS[i].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit breakdown */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Habit Breakdown</h3>
          <div className="space-y-2.5">
            {habits.map(h => {
              const pct = weekDates.length > 0
                ? Math.round((h.logs.filter(d => weekDates.includes(d)).length / weekDates.length) * 100)
                : 0;
              return (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{h.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{h.name}</span>
                      <span className="text-text-dim">{pct}% this week</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: h.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-0.5">
                    <Flame className="w-3 h-3" />
                    {h.streak}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">
      {/* Status bar */}
      <div className="px-5 py-2 bg-background/90 border-b border-border/20 flex items-center justify-between text-[10px] text-text-dim shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-recording animate-pulse-recording" />
          <span>HabitSpark · Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Recording
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {totalStreak} day streak
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentPage === 'dashboard' && renderDashboard()}
        {currentPage === 'add-habit' && renderAddHabit()}
        {currentPage === 'stats' && renderStats()}
      </div>
    </div>
  );
}