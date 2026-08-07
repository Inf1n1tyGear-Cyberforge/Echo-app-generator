import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, FolderKanban, CheckCircle2, Circle,
  ArrowLeft, Trash2, LayoutDashboard,
  ListTodo, Clock, Sparkles, Search,
  Flag, Calendar, MessageSquare, X,
  BarChart3, AlertCircle, Edit3,
} from 'lucide-react';
import { eventRecorder } from '../lib/event-recorder';

// ── Types ───────────────────────────────────────────────
type TaskStatus = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'medium' | 'high';

interface TaskNote {
  id: string;
  text: string;
  createdAt: number;
}

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  notes: TaskNote[];
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
  createdAt: number;
}

// ── Helpers ──────────────────────────────────────────────
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS: Record<TaskStatus, string> = { todo: 'text-text-dim', in_progress: 'text-warning', done: 'text-success' };
const PRIORITY_LABELS: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_COLORS: Record<Priority, string> = { low: 'text-success border-success/30', medium: 'text-warning border-warning/30', high: 'text-destructive border-destructive/30' };
const PRIORITY_BG: Record<Priority, string> = { low: 'bg-success/5', medium: 'bg-warning/5', high: 'bg-destructive/5' };

let idCounter = 0;
const genId = () => `pm-${++idCounter}-${Date.now()}`;

// ── Component ────────────────────────────────────────────
export default function SimulatedPMApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState<string | null>(null);
  const [editTaskValue, setEditTaskValue] = useState('');
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [editProjectValue, setEditProjectValue] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [viewMode, setViewMode] = useState<'board' | 'stats'>('board');
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      eventRecorder.captureNavigation('demo://flowboard', 'FlowBoard - Project Management');
    }
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // ── Filtered tasks ───────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    let tasks = activeProject.tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.name.toLowerCase().includes(q) || t.notes.some(n => n.text.toLowerCase().includes(q)));
    }
    if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);
    if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority);
    return tasks;
  }, [activeProject, searchQuery, filterStatus, filterPriority]);

  // ── Project CRUD ─────────────────────────────────────────
  const handleCreateProject = () => {
    const name = projectInput.trim();
    if (!name) return;
    setProjects(prev => [...prev, { id: genId(), name, tasks: [], createdAt: Date.now() }]);
    setShowCreateProject(false);
    setProjectInput('');
    eventRecorder.captureClick(`Create Project: "${name}"`);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    eventRecorder.captureClick(`Delete Project: "${proj?.name}"`);
  };

  const handleRenameProject = () => {
    const newName = editProjectValue.trim();
    if (!newName || !editingProjectName) return;
    setProjects(prev => prev.map(p => p.id === editingProjectName ? { ...p, name: newName } : p));
    setEditingProjectName(null);
    setEditProjectValue('');
    eventRecorder.captureClick(`Rename project to: "${newName}"`);
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    const proj = projects.find(p => p.id === id);
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPriority('all');
    setViewMode('board');
    eventRecorder.captureClick(`Open Project: "${proj?.name}"`);
    eventRecorder.captureNavigation(`demo://flowboard/project/${id}`, `Project: ${proj?.name}`);
  };

  // ── Task CRUD ────────────────────────────────────────────
  const handleAddTask = () => {
    const name = taskInput.trim();
    if (!name || !activeProjectId) return;
    const task: Task = { id: genId(), name, status: 'todo', priority: 'medium', dueDate: null, notes: [], createdAt: Date.now() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: [...p.tasks, task] } : p));
    setShowAddTask(false);
    setTaskInput('');
    eventRecorder.captureClick(`Add Task: "${name}"`);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeProjectId) return;
    const task = activeProject?.tasks.find(t => t.id === taskId);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p));
    eventRecorder.captureClick(`Delete Task: "${task?.name}"`);
  };

  const handleRenameTask = () => {
    const newName = editTaskValue.trim();
    if (!newName || !editingTaskName || !activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === editingTaskName ? { ...t, name: newName } : t) } : p));
    setEditingTaskName(null);
    setEditTaskValue('');
    eventRecorder.captureClick(`Rename task to: "${newName}"`);
  };

  // ── Status / Priority ────────────────────────────────────
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) } : p));
    eventRecorder.captureClick(`Change Status: "${activeProject?.tasks.find(t => t.id === taskId)?.name}" → ${STATUS_LABELS[newStatus]}`);
  };

  const handlePriorityChange = (taskId: string, newPriority: Priority) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t) } : p));
    eventRecorder.captureClick(`Change Priority: "${activeProject?.tasks.find(t => t.id === taskId)?.name}" → ${PRIORITY_LABELS[newPriority]}`);
  };

  const handleDueDateChange = (taskId: string, date: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, dueDate: date || null } : t) } : p));
    eventRecorder.captureClick(`Set due date for task: ${taskId}`);
  };

  // ── Notes ────────────────────────────────────────────────
  const handleAddNote = () => {
    const text = noteInput.trim();
    if (!text || !showNoteModal || !activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === showNoteModal ? { ...t, notes: [...t.notes, { id: genId(), text, createdAt: Date.now() }] } : t) } : p));
    setNoteInput('');
    eventRecorder.captureClick(`Add note to task`);
  };

  const handleDeleteNote = (taskId: string, noteId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, notes: t.notes.filter(n => n.id !== noteId) } : t) } : p));
  };

  // ── Task counts ──────────────────────────────────────────
  const taskCounts = (tasks: Task[]) => ({
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    total: tasks.length,
  });

  // ── Render: Dashboard ──────────────────────────────────
  const renderDashboard = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border/40 bg-surface/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">FlowBoard</h2>
            <p className="text-[10px] text-text-dim">Project Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          {projects.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No projects yet</h3>
            <p className="text-xs text-text-muted max-w-[220px] mb-6">
              Create your first project to start managing tasks with FlowBoard.
            </p>
            <button onClick={() => setShowCreateProject(true)} className="btn-primary text-sm py-2 px-5 flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">All Projects</h3>
              <button onClick={() => setShowCreateProject(true)} className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 cursor-pointer">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {projects.map(project => {
              const counts = taskCounts(project.tasks);
              return (
                <div
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  onKeyDown={e => e.key === 'Enter' && handleOpenProject(project.id)}
                  role="button"
                  tabIndex={0}
                  className="w-full card p-4 text-left group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                        {editingProjectName === project.id ? (
                          <div className="flex gap-1.5 flex-1">
                            <input
                              value={editProjectValue}
                              onChange={e => setEditProjectValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameProject(); if (e.key === 'Escape') setEditingProjectName(null); }}
                              className="input-field text-xs py-1 px-2 flex-1"
                              autoFocus
                              onClick={e => e.stopPropagation()}
                            />
                            <button onClick={e => { e.stopPropagation(); handleRenameProject(); }} className="text-xs px-2 py-1 rounded bg-primary text-white cursor-pointer">Save</button>
                          </div>
                        ) : (
                          <span
                            className="text-sm font-semibold text-foreground truncate"
                            onDoubleClick={e => { e.stopPropagation(); setEditingProjectName(project.id); setEditProjectValue(project.name); }}
                          >
                            {project.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-dim">
                        <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />{counts.total} task{counts.total !== 1 ? 's' : ''}</span>
                        {counts.done > 0 && <span className="text-success">{counts.done} done</span>}
                        {counts.inProgress > 0 && <span className="text-warning">{counts.inProgress} active</span>}
                        {counts.todo > 0 && <span className="text-text-dim">{counts.todo} todo</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1.5 rounded-lg text-text-dim hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateProject && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateProject(false)}>
          <div className="card p-5 w-[90%] max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4">Create Project</h3>
            <input value={projectInput} onChange={e => setProjectInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateProject()} placeholder="Project name..." className="input-field text-sm mb-4" autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateProject(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Cancel</button>
              <button onClick={handleCreateProject} disabled={!projectInput.trim()} className="btn-primary text-xs py-2 px-4 disabled:opacity-50 cursor-pointer">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render: Project Detail ─────────────────────────────
  const renderProjectDetail = () => {
    if (!activeProject) return null;
    const counts = taskCounts(activeProject.tasks);
    const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
    const priorityCounts = { high: activeProject.tasks.filter(t => t.priority === 'high').length, medium: activeProject.tasks.filter(t => t.priority === 'medium').length, low: activeProject.tasks.filter(t => t.priority === 'low').length };
    const overdueTasks = activeProject.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 bg-surface/30 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => { setActiveProjectId(null); eventRecorder.captureClick('Back to Dashboard'); }} className="p-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">{activeProject.name}</h2>
              <p className="text-[10px] text-text-dim">{counts.total} tasks · {overdueTasks > 0 ? `${overdueTasks} overdue` : 'all on track'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode(viewMode === 'board' ? 'stats' : 'board')} className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'stats' ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-foreground'}`} title={viewMode === 'stats' ? 'Task Board' : 'Stats View'}>
                {viewMode === 'stats' ? <ListTodo className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              </button>
              <button onClick={() => { setShowSearch(!showSearch); eventRecorder.captureClick('Toggle search'); }} className={`p-2 rounded-lg transition-colors cursor-pointer ${showSearch ? 'bg-primary/10 text-primary' : 'text-text-dim hover:text-foreground'}`}>
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks & notes..." className="input-field text-xs pl-9 py-2" autoFocus />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-foreground cursor-pointer"><X className="w-3 h-3" /></button>}
              </div>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-text-dim shrink-0">{progress}%</span>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)} className="text-[10px] px-2 py-1 rounded-lg bg-muted/50 border border-border/30 text-text-muted outline-none cursor-pointer">
                <option value="all">All status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as typeof filterPriority)} className="text-[10px] px-2 py-1 rounded-lg bg-muted/50 border border-border/30 text-text-muted outline-none cursor-pointer">
                <option value="all">All priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}
        </div>

        {/* Stats view */}
        {viewMode === 'stats' ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{counts.done}</p>
                <p className="text-[10px] text-text-dim">Done</p>
              </div>
              <div className="card p-3 text-center">
                <Clock className="w-5 h-5 text-warning mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{counts.inProgress}</p>
                <p className="text-[10px] text-text-dim">In Progress</p>
              </div>
              <div className="card p-3 text-center">
                <Circle className="w-5 h-5 text-text-dim mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{counts.todo}</p>
                <p className="text-[10px] text-text-dim">To Do</p>
              </div>
              <div className="card p-3 text-center">
                <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{overdueTasks}</p>
                <p className="text-[10px] text-text-dim">Overdue</p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Priority Breakdown</h3>
              <div className="space-y-2">
                {(['high', 'medium', 'low'] as Priority[]).map(p => {
                  const pct = counts.total > 0 ? Math.round((priorityCounts[p] / counts.total) * 100) : 0;
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <Flag className={`w-3.5 h-3.5 ${p === 'high' ? 'text-destructive' : p === 'medium' ? 'text-warning' : 'text-success'}`} />
                      <span className="text-xs text-foreground min-w-[50px]">{PRIORITY_LABELS[p]}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p === 'high' ? 'bg-destructive' : p === 'medium' ? 'bg-warning' : 'bg-success'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-text-dim min-w-[30px] text-right">{priorityCounts[p]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Task Board */
          <div className="flex-1 overflow-y-auto p-5">
            {filteredTasks.length === 0 && activeProject.tasks.length > 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="w-10 h-10 text-text-dim mb-3" />
                <h3 className="text-sm font-bold text-foreground mb-1">No matching tasks</h3>
                <p className="text-xs text-text-muted max-w-[200px] mb-4">Try a different filter or search term</p>
                <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); }} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Clear Filters</button>
              </div>
            ) : activeProject.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3"><ListTodo className="w-7 h-7 text-primary" /></div>
                <h3 className="text-sm font-bold text-foreground mb-1">No tasks yet</h3>
                <p className="text-xs text-text-muted max-w-[200px] mb-5">Add your first task to start tracking work in this project.</p>
                <button onClick={() => setShowAddTask(true)} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add Task</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Tasks {searchQuery && `(filtered)`}</h3>
                  <button onClick={() => setShowAddTask(true)} className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
                </div>
                {filteredTasks.map(task => (
                  <div key={task.id} className="card p-3.5 group">
                    <div className="flex items-start gap-3">
                      {/* Status toggle */}
                      <button onClick={() => { const cycle: TaskStatus[] = ['todo', 'in_progress', 'done']; const idx = cycle.indexOf(task.status); handleStatusChange(task.id, cycle[(idx + 1) % 3]); }} className="cursor-pointer mt-0.5" title={`Status: ${STATUS_LABELS[task.status]}`}>
                        {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-success" /> : task.status === 'in_progress' ? <Clock className="w-5 h-5 text-warning" /> : <Circle className="w-5 h-5 text-text-dim" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingTaskName === task.id ? (
                          <div className="flex gap-1.5 mb-1">
                            <input value={editTaskValue} onChange={e => setEditTaskValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRenameTask(); if (e.key === 'Escape') setEditingTaskName(null); }} className="input-field text-xs py-1 px-2 flex-1" autoFocus />
                            <button onClick={handleRenameTask} className="text-xs px-2 py-1 rounded bg-primary text-white cursor-pointer">Save</button>
                          </div>
                        ) : (
                          <span className={`text-sm block ${task.status === 'done' ? 'line-through text-text-dim' : 'text-foreground'}`}
                            onDoubleClick={() => { setEditingTaskName(task.id); setEditTaskValue(task.name); }}>
                            {task.name}
                          </span>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${PRIORITY_COLORS[task.priority]} ${PRIORITY_BG[task.priority]}`}>
                            <Flag className="w-2.5 h-2.5" />
                            {PRIORITY_LABELS[task.priority]}
                          </span>

                          <label className="flex items-center gap-1 text-[10px] text-text-dim cursor-pointer">
                            <Calendar className="w-2.5 h-2.5" />
                            <input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={e => handleDueDateChange(task.id, e.target.value)}
                              className="bg-transparent border-none outline-none text-[10px] text-text-muted w-[90px] cursor-pointer"
                              title="Set due date"
                            />
                          </label>

                          <button onClick={() => { setShowNoteModal(task.id); setNoteInput(''); eventRecorder.captureClick(`View notes: "${task.name}"`); }} className="flex items-center gap-1 text-[10px] text-text-dim hover:text-foreground transition-colors cursor-pointer">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {task.notes.length}
                          </button>

                          <select value={task.priority} onChange={e => handlePriorityChange(task.id, e.target.value as Priority)}
                            className="text-[10px] px-1 py-0.5 rounded bg-muted/30 border border-border/30 text-text-dim outline-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <option value="low">Low</option>
                            <option value="medium">Med</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded text-text-dim hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer mt-0.5" title="Delete task">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddTask(false)}>
            <div className="card p-5 w-[90%] max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-foreground mb-4">Add Task</h3>
              <input value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} placeholder="Task name..." className="input-field text-sm mb-4" autoFocus />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddTask(false)} className="btn-secondary text-xs py-2 px-4 cursor-pointer">Cancel</button>
                <button onClick={handleAddTask} disabled={!taskInput.trim()} className="btn-primary text-xs py-2 px-4 disabled:opacity-50 cursor-pointer">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNoteModal && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNoteModal(null)}>
            <div className="card p-5 w-[90%] max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Notes</h3>
                <button onClick={() => setShowNoteModal(null)} className="text-text-dim hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Existing notes */}
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {activeProject?.tasks.find(t => t.id === showNoteModal)?.notes.map(note => (
                  <div key={note.id} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5 group/note">
                    <p className="text-xs text-text-muted flex-1">{note.text}</p>
                    <button onClick={() => handleDeleteNote(showNoteModal!, note.id)} className="text-text-dim hover:text-destructive transition-colors opacity-0 group-hover/note:opacity-100 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {activeProject?.tasks.find(t => t.id === showNoteModal)?.notes.length === 0 && (
                  <p className="text-xs text-text-dim text-center py-3">No notes yet</p>
                )}
              </div>

              {/* Add note */}
              <div className="flex gap-2">
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} placeholder="Write a note..." className="input-field text-xs py-2 px-3 flex-1" autoFocus />
                <button onClick={handleAddNote} disabled={!noteInput.trim()} className="btn-primary text-xs py-2 px-3 disabled:opacity-50 cursor-pointer">Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">
      {/* Status bar */}
      <div className="px-5 py-2 bg-background/90 border-b border-border/20 flex items-center justify-between text-[10px] text-text-dim shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-recording animate-pulse-recording" />
          <span>FlowBoard · Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Recording
          </span>
          <span>{projects.reduce((sum, p) => sum + p.tasks.length, 0)} tasks</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeProject ? renderProjectDetail() : renderDashboard()}
      </div>
    </div>
  );
}