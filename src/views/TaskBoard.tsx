import React from 'react';
import { Task, User, OrgUser } from '../types';

interface TaskBoardProps {
    user: User | null;
    tasks: Task[];
    token: string | null;
    loading: boolean;
    viewMode: 'board' | 'list';
    filterStatus: Task['status'] | '';
    search: string;
    totals: { total: number; completed: number; open: number };
    grouped: { TODO: Task[]; IN_PROGRESS: Task[]; DONE: Task[] };
    userMap: Record<string, User | OrgUser>;
    allowedAssignees: OrgUser[];
    newTaskState: {
        title: string;
        description: string;
        dueDate: string;
        priority: number;
        assignedTo: string;
    };
    setNewTaskState: (state: any) => void;
    actions: {
        setViewMode: (mode: 'board' | 'list') => void;
        setFilterStatus: (status: any) => void;
        setSearch: (s: string) => void;
    };
    handlers: {
        fetchTasks: () => void;
        createTask: () => void;
        authFetch: (url: string, options?: RequestInit) => Promise<Response>;
        apiBase: string;
    };
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
    user,
    tasks,
    token,
    loading,
    viewMode,
    filterStatus,
    search,
    totals,
    grouped,
    userMap,
    allowedAssignees,
    newTaskState,
    setNewTaskState,
    actions,
    handlers,
}) => {
    const isSenior = user?.role === 'senior' || user?.role === 'owner';
    const canCreateTasks = isSenior;

    const updateNewTask = (key: string, value: any) => {
        setNewTaskState({ ...newTaskState, [key]: value });
    };

    return (
        <>
            <section className="panel">
                <div className="panel-header">
                    <h2>Create Task</h2>
                    <span className="muted">Assign work to your team.</span>
                </div>
                <div className="cols">
                    <div className="field">
                        <label>Title</label>
                        <input
                            value={newTaskState.title}
                            onChange={(e) => updateNewTask('title', e.target.value)}
                            placeholder="Task title"
                        />
                    </div>
                    <div className="field">
                        <label>Due Date</label>
                        <input
                            type="date"
                            value={newTaskState.dueDate}
                            onChange={(e) => updateNewTask('dueDate', e.target.value)}
                        />
                    </div>
                </div>
                <div className="field">
                    <label>Description</label>
                    <textarea
                        value={newTaskState.description}
                        onChange={(e) => updateNewTask('description', e.target.value)}
                        rows={2}
                    />
                </div>
                <div className="cols">
                    <div className="field">
                        <label>Priority (1-5)</label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={newTaskState.priority}
                            onChange={(e) => updateNewTask('priority', Number(e.target.value))}
                        />
                    </div>
                    <div className="field">
                        <label>Assign to (junior)</label>
                        <select
                            value={newTaskState.assignedTo}
                            onChange={(e) => updateNewTask('assignedTo', e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {allowedAssignees.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    className="primary"
                    disabled={loading || !token || !canCreateTasks}
                    onClick={handlers.createTask}
                >
                    {token ? (loading ? 'Saving…' : 'Create task') : 'Login to create'}
                </button>
            </section>

            <section className="panel full">
                <div className="panel-header">
                    <div className="panel-title">
                        <h2>Tasks</h2>
                        <div className="view-toggle">
                            <button
                                className={`chip-btn ${viewMode === 'board' ? 'active' : ''}`}
                                onClick={() => actions.setViewMode('board')}
                            >
                                Board
                            </button>
                            <button
                                className={`chip-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => actions.setViewMode('list')}
                            >
                                List
                            </button>
                        </div>
                    </div>
                    <div className="tag">{tasks.length} items</div>
                    <div className="filters">
                        <div className="chip-row">
                            {['', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                                <button
                                    key={s || 'all'}
                                    className={`chip-btn ${filterStatus === s ? 'active' : ''}`}
                                    onClick={() => actions.setFilterStatus(s as any)}
                                >
                                    {s || 'All'}
                                </button>
                            ))}
                        </div>
                        <input
                            className="search"
                            placeholder="Search title/description"
                            value={search}
                            onChange={(e) => actions.setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handlers.fetchTasks();
                            }}
                        />
                        <button className="ghost" disabled={loading} onClick={handlers.fetchTasks}>
                            Refresh
                        </button>
                    </div>
                </div>

                {token && (
                    <div className="insights" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="pill tiny">
                            <div className="pill-title">Tasks</div>
                            <div className="pill-sub">
                                {totals.total} total · {totals.completed} done
                            </div>
                        </div>
                        {tasks.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {/* SVG Chart omitted for brevity in refactor, can add back later or separate component */}
                                <div className="pill tiny" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div className="pill-title">Progress</div>
                                    <div className="pill-sub">
                                        {totals.completed} done · {totals.open} open
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {token && (
                    <div className="panel" style={{ marginTop: 8 }}>
                        <div className="panel-header">
                            <div className="panel-title">
                                <h2>My assigned tasks</h2>
                                <span className="muted">Tasks assigned to you</span>
                            </div>
                        </div>
                        {user && tasks.filter((t) => t.assignedTo === user?.id).length === 0 && (
                            <p className="muted">No tasks assigned to you yet.</p>
                        )}
                        <div className="board">
                            {user &&
                                tasks
                                    .filter((t) => t.assignedTo === user?.id)
                                    .map((task) => (
                                        <div key={task._id} className="task-card">
                                            <div className="task-title">{task.title}</div>
                                            {task.description && <div className="task-desc">{task.description}</div>}
                                            <div className="task-meta">
                                                <span>Status: {task.status}</span>
                                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                {task.priority && <span>Priority {task.priority}</span>}
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>
                )}

                {!token && <p className="muted">Login to see your tasks.</p>}
                {token && tasks.length === 0 && <p className="muted">No tasks yet. Create one above.</p>}

                {token && tasks.length > 0 && viewMode === 'board' && (
                    <div className="board">
                        {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((col) => (
                            <div key={col} className="column">
                                <div className="column-header">
                                    <span>
                                        {col === 'TODO' ? 'To do' : col === 'IN_PROGRESS' ? 'In progress' : 'Done'}
                                    </span>
                                    <span className="tag">{grouped[col].length}</span>
                                </div>
                                <div className="column-body">
                                    {grouped[col].map((task) => {
                                        const subtasks = tasks.filter((t) => t.parentTaskId === task._id);
                                        return (
                                            <div key={task._id} className="task-card">
                                                <div className="task-title">{task.title}</div>
                                                {task.description && (
                                                    <div className="task-desc">{task.description}</div>
                                                )}
                                                <div className="task-meta">
                                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                                    {task.priority && <span>Priority {task.priority}</span>}
                                                    {task.assignedTo && (
                                                        <span>Assignee: {userMap[task.assignedTo]?.name || '—'}</span>
                                                    )}
                                                    {task.estimatedHours && <span>{task.estimatedHours}h</span>}
                                                </div>

                                                {subtasks.length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: 8,
                                                            paddingLeft: 8,
                                                            borderLeft: '2px solid #eee',
                                                        }}
                                                    >
                                                        <div className="tiny" style={{ marginBottom: 4 }}>
                                                            Subtasks:
                                                        </div>
                                                        {subtasks.map((st) => (
                                                            <div
                                                                key={st._id}
                                                                style={{ fontSize: '0.85rem', marginBottom: 2 }}
                                                            >
                                                                • {st.title} ({st.status})
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {isSenior && !task.parentTaskId && (
                                                    <button
                                                        className="small"
                                                        style={{ marginTop: 8, width: '100%' }}
                                                        onClick={() => {
                                                            const t = prompt('Subtask title:');
                                                            const h = prompt('Hours:');
                                                            if (t) {
                                                                handlers.authFetch(`${handlers.apiBase}/tasks`, {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({
                                                                        title: t,
                                                                        parentTaskId: task._id,
                                                                        estimatedHours: Number(h),
                                                                        dueDate: task.dueDate,
                                                                        status: 'TODO',
                                                                        priority: task.priority,
                                                                        orgId: task.orgId,
                                                                    }),
                                                                }).then(() => handlers.fetchTasks());
                                                            }
                                                        }}
                                                    >
                                                        + Break down
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {grouped[col].length === 0 && <div className="empty">No items</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {token && tasks.length > 0 && viewMode === 'list' && (
                    <div className="list-table">
                        <div className="list-head">
                            <span>Title</span>
                            <span>Status</span>
                            <span>Assignee</span>
                            <span>Due</span>
                        </div>
                        {tasks.map(t => (
                            <div key={t._id} className="list-row">
                                <span>{t.title}</span>
                                <span className="chip">{t.status}</span>
                                <span>{userMap[t.assignedTo || '']?.name || '-'}</span>
                                <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};
