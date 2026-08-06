import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonRow } from '../components/SkeletonLoaders';
import { useToast } from '../context/ToastContext';
import { getRelativeDeadline, formatDate } from '../utils/dateUtils';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import {
  Plus, Trash2, CheckCircle2, Clock, Filter, Search, Edit3, X, ArrowUpDown, Calendar, Download
} from 'lucide-react';

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newEstMinutes, setNewEstMinutes] = useState(60);
  const [newDescription, setNewDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<'assignment' | 'exam' | 'announcement' | 'reading'>('assignment');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setNewTitle('');
    setNewSubject('General');
    setNewDeadline('');
    setNewPriority('medium');
    setNewEstMinutes(60);
    setNewDescription('');
    setNewTaskType('assignment');
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewSubject(task.subject || 'General');
    // Format deadline for datetime-local input
    if (task.deadline) {
      const d = new Date(task.deadline);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setNewDeadline(localIso);
    } else {
      setNewDeadline('');
    }
    setNewPriority(task.priority || 'medium');
    setNewEstMinutes(task.estimated_minutes || 60);
    setNewDescription(task.description || '');
    setNewTaskType(task.task_type || 'assignment');
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}`, { status: nextStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      showToast(nextStatus === 'completed' ? 'Task marked as completed!' : 'Task reopened', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update task status', 'error');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted successfully', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete task', 'error');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        title: newTitle,
        subject: newSubject,
        deadline: new Date(newDeadline).toISOString(),
        priority: newPriority,
        estimatedMinutes: Number(newEstMinutes),
        description: newDescription,
        taskType: newTaskType
      };

      if (editingTask) {
        const res = await api.patch(`/tasks/${editingTask.id}`, payload);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
        showToast('Task updated successfully!', 'success');
      } else {
        const res = await api.post('/tasks', payload);
        setTasks(prev => [res.data, ...prev]);
        showToast('Task created successfully!', 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save task', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter & Search & Sort Logic
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesSearch =
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = !statusFilter || t.status === statusFilter;
        const matchesPriority = !priorityFilter || t.priority === priorityFilter;
        const matchesSubject = !subjectFilter || t.subject === subjectFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesSubject;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'deadline') {
          comp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } else if (sortBy === 'priority') {
          const map = { high: 3, medium: 2, low: 1 };
          comp = (map[b.priority as keyof typeof map] || 0) - (map[a.priority as keyof typeof map] || 0);
        } else if (sortBy === 'title') {
          comp = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, subjectFilter, sortBy, sortOrder]);

  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Task Execution Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Search, filter, edit, and track all your academic commitments and deadlines.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Manual Task</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, subject, or description..."
              className="input pl-10"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
              title="Toggle sort order"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="capitalize">{sortOrder}</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select max-w-[150px] py-2 text-xs"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select max-w-[140px] py-1.5 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="select max-w-[140px] py-1.5 text-xs"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="select max-w-[140px] py-1.5 text-xs"
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(statusFilter || priorityFilter || subjectFilter || searchQuery) && (
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSubjectFilter(''); setSearchQuery(''); }}
              className="text-xs text-brand-500 hover:underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">Status</th>
                <th className="p-4">Title & Subject</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Type</th>
                <th className="p-4">Est. Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                filteredTasks.map((task) => {
                  const rel = getRelativeDeadline(task.deadline);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(task.id, task.status)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 hover:border-brand-500'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className={`font-semibold text-slate-900 dark:text-slate-100 ${task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{task.subject}</div>
                      </td>

                      <td className="p-4 text-xs">
                        <span className={rel.isOverdue ? 'text-red-500 font-semibold' : rel.isUrgent ? 'text-amber-500 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                          {rel.label}
                        </span>
                        <div className="text-[10px] text-slate-400">{formatDate(task.deadline)}</div>
                      </td>

                      <td className="p-4">
                        <StatusBadge type="priority" value={task.priority} />
                      </td>

                      <td className="p-4">
                        <StatusBadge type="taskType" value={task.task_type || 'assignment'} />
                      </td>

                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {task.estimated_minutes} min
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={getGoogleCalendarUrl({
                              title: task.title,
                              description: task.description,
                              deadline: task.deadline,
                              estimatedMinutes: task.estimated_minutes,
                              subject: task.subject
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Add to Google Calendar"
                          >
                            <Calendar className="h-4 w-4" />
                          </a>

                          <button
                            onClick={() => downloadIcsFile({
                              title: task.title,
                              description: task.description,
                              deadline: task.deadline,
                              estimatedMinutes: task.estimated_minutes,
                              subject: task.subject
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Export .ics iCalendar file"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                            title="Edit Task"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {filteredTasks.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                    No tasks found matching your filters. Try clearing search parameters or creating a new task.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 space-y-6 animate-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {editingTask ? 'Edit Task Commitment' : 'Create New Task'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Problem Set 4"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="select"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="select"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                    <option value="announcement">Announcement</option>
                    <option value="reading">Reading</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Estimated Minutes</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={newEstMinutes}
                  onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional details, guidelines, or submission instructions..."
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary"
                >
                  {createLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
