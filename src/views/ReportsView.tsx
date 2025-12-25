import React from 'react';
import { User, Report, OrgUser } from '../App';

interface ReportsViewProps {
    user: User | null;
    reports: Report[];
    userMap: Record<string, User | OrgUser>;
    allowedAssignees: OrgUser[];
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
    fetchReports: () => void;
    apiBase: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
    user,
    reports,
    userMap,
    allowedAssignees,
    authFetch,
    fetchReports,
    apiBase,
}) => {
    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Reports</h2>
                <span className="muted">Request and submit reports.</span>
            </div>
            <div className="cols">
                {(user?.role === 'owner' || user?.role === 'senior') && (
                    <div className="field">
                        <h3>Request Report</h3>
                        <div className="cols">
                            <div className="field">
                                <label>From</label>
                                <select
                                    id="rep-recipient"
                                    onChange={(e) => {
                                        const recipientId = e.target.value;
                                        const msg = prompt('Message for request?');
                                        if (recipientId && msg) {
                                            authFetch(`${apiBase}/reports`, {
                                                method: 'POST',
                                                body: JSON.stringify({ responderId: recipientId, requestMessage: msg }),
                                            }).then(() => fetchReports());
                                        }
                                    }}
                                >
                                    <option value="">Select employee</option>
                                    {allowedAssignees.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="list-table">
                <div className="list-head">
                    <span>From</span>
                    <span>To</span>
                    <span>Request</span>
                    <span>Response</span>
                    <span>Status</span>
                    <span>Action</span>
                </div>
                {reports.map((r) => (
                    <div key={r._id} className="list-row">
                        <span>{userMap[r.requesterId]?.name}</span>
                        <span>{userMap[r.responderId]?.name}</span>
                        <span>{r.requestMessage}</span>
                        <span>{r.responseMessage || '-'}</span>
                        <span className="chip">{r.status}</span>
                        <span>
                            {r.status === 'REQUESTED' && r.responderId === user?.id && (
                                <button
                                    className="small"
                                    onClick={() => {
                                        const resp = prompt('Enter your report:');
                                        if (resp) {
                                            authFetch(`${apiBase}/reports/${r._id}/submit`, {
                                                method: 'PATCH',
                                                body: JSON.stringify({ responseMessage: resp }),
                                            }).then(() => fetchReports());
                                        }
                                    }}
                                >
                                    Submit
                                </button>
                            )}
                            {r.status === 'SUBMITTED' && r.requesterId === user?.id && (
                                <button
                                    className="small"
                                    onClick={() => {
                                        const grade = prompt('Grade (0-100):');
                                        if (grade) {
                                            authFetch(`${apiBase}/reports/${r._id}/review`, {
                                                method: 'PATCH',
                                                body: JSON.stringify({ grade: Number(grade) }),
                                            }).then(() => fetchReports());
                                        }
                                    }}
                                >
                                    Review
                                </button>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};
