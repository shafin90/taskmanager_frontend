import React from 'react';
import { AppState, AppActions, AppHandlers } from '../types';

interface EmployeesViewProps {
    state: AppState;
    actions: AppActions;
    handlers: AppHandlers;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ state, handlers }) => {
    return (
        <section className="panel full">
            <div className="panel-header">
                <h2>Employees</h2>
                <span className="muted">Owner can see all seniors and juniors.</span>
            </div>
            {state.orgUsers.length === 0 ? (
                <p className="muted">No employees yet. Create accounts in “Create designation”.</p>
            ) : (
                <div className="list-table">
                    <div className="list-head">
                        <span>Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Manager</span>
                        <span>Designation</span>
                    </div>
                    {state.orgUsers.map((u) => (
                        <div key={u.id} className="list-row">
                            <span className="task-title">{u.name}</span>
                            <span>{u.email}</span>
                            <span className="chip">{u.role}</span>
                            <span>{u.managerId ? handlers.userMap[u.managerId]?.name || 'Senior' : u.role === 'junior' ? 'Unassigned' : '—'}</span>
                            <span>{u.designationId ? state.designations.find((d) => d._id === u.designationId)?.name || '—' : '—'}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
