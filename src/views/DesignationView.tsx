import React from 'react';
import { AppState, AppActions, AppHandlers } from '../types';

interface DesignationViewProps {
    state: AppState;
    actions: AppActions;
    handlers: AppHandlers;
}

export const DesignationView: React.FC<DesignationViewProps> = ({ state, actions, handlers }) => {
    const isOwner = state.user?.role === 'owner';

    return (
        <>
            <section className="panel">
                <div className="panel-header">
                    <h2>Create designation</h2>
                    <span className="muted">Step 1: add a designation. Step 2: create an account and attach it.</span>
                </div>
                {isOwner ? (
                    <>
                        <div className="cols">
                            <div className="field">
                                <label>Designation name</label>
                                <input value={state.desigName} onChange={(e) => actions.setDesigName(e.target.value)} placeholder="Senior Engineer" />
                            </div>
                            <div className="field">
                                <label>Designation description</label>
                                <input value={state.desigDesc} onChange={(e) => actions.setDesigDesc(e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="field">
                                <label>Role type</label>
                                <select value={state.desigRole} onChange={(e) => actions.setDesigRole(e.target.value as any)}>
                                    <option value="senior">Senior</option>
                                    <option value="junior">Junior</option>
                                    <option value="mid-level">Mid-level</option>
                                    <option value="fresher">Fresher</option>
                                </select>
                            </div>
                        </div>
                        <button className="primary" disabled={state.loading || !state.token} onClick={handlers.createDesignation}>
                            Add designation
                        </button>
                        {state.designations.length > 0 && (
                            <div className="list-table" style={{ marginTop: 16 }}>
                                <div className="list-head">
                                    <span>Designation</span>
                                    <span>Role</span>
                                    <span>Description</span>
                                </div>
                                {state.designations.map((d) => (
                                    <div key={d._id} className="list-row">
                                        <span className="task-title">{d.name}</span>
                                        <span className="chip">{d.role}</span>
                                        <span>{d.description || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="muted">Login as the owner to manage designations.</p>
                )}
            </section>

            <section className="panel">
                <div className="panel-header">
                    <h2>Create account</h2>
                    <span className="muted">Step 2: choose a designation and create senior/junior credentials.</span>
                </div>
                {isOwner ? (
                    <>
                        <div className="cols">
                            <div className="field">
                                <label>Employee name</label>
                                <input value={state.empName} onChange={(e) => actions.setEmpName(e.target.value)} placeholder="Name" />
                            </div>
                            <div className="field">
                                <label>Employee email</label>
                                <input value={state.empEmail} onChange={(e) => actions.setEmpEmail(e.target.value)} placeholder="email@company.com" />
                            </div>
                            <div className="field">
                                <label>Password</label>
                                <input value={state.empPassword} onChange={(e) => actions.setEmpPassword(e.target.value)} placeholder="Temporary password" />
                            </div>
                        </div>
                        <div className="cols">
                            <div className="field">
                                <label>Role</label>
                                <select value={state.empRole} onChange={(e) => actions.setEmpRole(e.target.value as 'senior' | 'junior')}>
                                    <option value="senior">Senior</option>
                                    <option value="junior">Junior</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Designation (required)</label>
                                <select value={state.empDesignationId} onChange={(e) => actions.setEmpDesignationId(e.target.value)}>
                                    <option value="">Select designation</option>
                                    {state.designations.map((d) => (
                                        <option key={d._id} value={d._id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {state.empRole === 'junior' && (
                                <div className="field">
                                    <label>Reports to (senior)</label>
                                    <select value={state.empManagerId} onChange={(e) => actions.setEmpManagerId(e.target.value)}>
                                        <option value="">Select senior</option>
                                        {state.orgUsers
                                            .filter((u) => u.role === 'senior')
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button
                            className="primary"
                            disabled={state.loading || !state.token || state.designations.length === 0 || !state.empDesignationId}
                            onClick={handlers.createEmployee}
                        >
                            Create employee account
                        </button>
                    </>
                ) : (
                    <p className="muted">Owner only.</p>
                )}
            </section>
        </>
    );
};
