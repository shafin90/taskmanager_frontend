import React from 'react';
import { User } from '../App';

interface MainLayoutProps {
    user: User | null;
    activeMenu: string;
    setActiveMenu: (menu: any) => void;
    onLogout: () => void;
    apiBase: string;
    children: React.ReactNode;
    error?: string | null;
    info?: string | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    user,
    activeMenu,
    setActiveMenu,
    onLogout,
    apiBase,
    children,
    error,
    info,
}) => {
    return (
        <div className="shell">
            <aside className="sidebar">
                <div className="brand">
                    <span className="dot" />
                    <span className="brand-name">TaskManager</span>
                </div>
                <div className="nav-group">
                    <div className="nav-label">Workspace</div>
                    {user?.role !== 'owner' && (
                        <button
                            className={`nav-item ${activeMenu === 'tasks' ? 'active' : ''}`}
                            onClick={() => setActiveMenu('tasks')}
                        >
                            Tasks
                        </button>
                    )}
                    <button
                        className={`nav-item ${activeMenu === 'designation' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('designation')}
                    >
                        Create designation
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('employees')}
                    >
                        Employee list
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'target' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('target')}
                    >
                        Target
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'assign' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('assign')}
                    >
                        Assign employees
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('progress')}
                    >
                        Progress
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('reports')}
                    >
                        Reports
                    </button>
                    <button
                        className={`nav-item ${activeMenu === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('chat')}
                    >
                        Chat
                    </button>
                    <button className="nav-item" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <div className="content">
                <div className="topbar">
                    <div className="env">
                        <span className="pill-sub">API</span>
                        <span className="env-url">{apiBase}</span>
                    </div>
                    {user ? (
                        <div className="pill">
                            <div>
                                <div className="pill-title">{user.name || user.email}</div>
                                <div className="pill-sub">{user.role}</div>
                            </div>
                            <button className="ghost" onClick={onLogout}>
                                Logout
                            </button>
                        </div>
                    ) : null}
                </div>

                <main className="main">
                    {children}
                    {error && <p className="error">{error}</p>}
                    {info && <p className="info">{info}</p>}
                </main>
            </div>
        </div>
    );
};
