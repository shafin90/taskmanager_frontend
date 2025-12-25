import React from 'react';
import { AppState, AppActions, AppHandlers } from '../types';

interface AssignViewProps {
    state: AppState;
    actions: AppActions;
    handlers: AppHandlers;
}

export const AssignView: React.FC<AssignViewProps> = ({ state, actions, handlers }) => {
    const isOwner = state.user?.role === 'owner';

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Assign employees</h2>
                <span className="muted">Pair juniors under seniors (owner only).</span>
            </div>
            {isOwner ? (
                <>
                    <div className="cols">
                        <div className="field">
                            <label>Senior</label>
                            <select value={state.empManagerId} onChange={(e) => actions.setEmpManagerId(e.target.value)}>
                                <option value="">Select senior</option>
                                {state.orgUsers
                                    .filter((u) => u.role === 'senior')
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Junior</label>
                            <select value={state.empDesignationId} onChange={(e) => actions.setEmpDesignationId(e.target.value)}>
                                <option value="">Select junior</option>
                                {state.orgUsers
                                    .filter((u) => u.role === 'junior')
                                    .map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                    <button
                        className="primary"
                        disabled={!state.empManagerId || !state.empDesignationId}
                        onClick={() => handlers.assignJunior(state.empDesignationId, state.empManagerId)}
                    >
                        Assign junior to senior
                    </button>
                    <div className="list-table" style={{ marginTop: 16 }}>
                        <div className="list-head">
                            <span>Senior</span>
                            <span>Junior</span>
                        </div>
                        {state.orgUsers
                            .filter((u) => u.role === 'junior')
                            .map((j) => (
                                <div key={j.id} className="list-row">
                                    <span>{handlers.userMap[j.managerId || '']?.name || 'Unassigned'}</span>
                                    <span>{j.name}</span>
                                </div>
                            ))}
                    </div>
                </>
            ) : (
                <p className="muted">Owner only.</p>
            )}
        </section>
    );
};
