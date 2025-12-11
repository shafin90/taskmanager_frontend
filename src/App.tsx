import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'senior' | 'junior';
  orgId: string;
};

type OrgUser = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'senior' | 'junior';
  orgId: string;
  managerId?: string;
  designationId?: string;
};

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string;
  priority?: number;
  assignedTo?: string; // userId
  isCompleted: boolean;
  orgId: string;
};

type Designation = {
  _id: string;
  name: string;
  description?: string;
  role: 'senior' | 'junior' | 'mid-level' | 'fresher';
};

type Target = {
  _id: string;
  title: string;
  description?: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  status: 'open' | 'in_progress' | 'done';
  progress: number;
  dueDate?: string;
};

type ChatMessage = {
  _id: string;
  senderId: string;
  recipientId?: string;
  content: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<{ total: number; done: number; open: number; perUser: any[] }>({
    total: 0,
    done: 0,
    open: 0,
    perUser: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState(3);
  const [status, setStatus] = useState<Task['status']>('TODO');
  const [assignedTo, setAssignedTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | ''>('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeMenu, setActiveMenu] = useState<
    'tasks' | 'designation' | 'employees' | 'target' | 'assign' | 'progress' | 'chat'
  >('tasks');

  // Organization setup forms (owner only)
  const [desigName, setDesigName] = useState('');
  const [desigDesc, setDesigDesc] = useState('');
  const [desigRole, setDesigRole] = useState<'senior' | 'junior' | 'mid-level' | 'fresher'>('senior');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState<'senior' | 'junior'>('senior');
  const [empDesignationId, setEmpDesignationId] = useState('');
  const [empManagerId, setEmpManagerId] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [targetDesc, setTargetDesc] = useState('');
  const [targetPeriod, setTargetPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [targetDue, setTargetDue] = useState('');
  const [chatText, setChatText] = useState('');
  const [chatRecipient, setChatRecipient] = useState('');

  const apiBase = API_URL.replace(/\/+$/, '');

  const userMap = useMemo(() => {
    const map: Record<string, OrgUser> = {};
    orgUsers.forEach((u) => (map[u.id] = u));
    return map;
  }, [orgUsers]);

  const allowedAssignees = useMemo(() => {
    if (!user) return [];
    const juniors = orgUsers.filter((u) => u.role === 'junior');
    if (user.role === 'owner') return juniors;
    if (user.role === 'senior') return juniors.filter((j) => j.managerId === user.id);
    return [];
  }, [orgUsers, user]);

  useEffect(() => {
    const storedToken = localStorage.getItem('task_token');
    const storedUser = localStorage.getItem('task_user');
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('task_user');
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('task_token', token);
      fetchBootstrap();
    } else {
      localStorage.removeItem('task_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('task_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('task_user');
    }
  }, [user]);

  const authHeaders: Record<string, string> = token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      };

  const authFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options?.headers || {}),
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  };

  const handleLogin = async (onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      setInfo('Logged in');
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (onSuccess?: () => void) => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email, password, name, orgName }),
      });
      if (!res.ok) throw new Error('Registration failed');
      setInfo('Registered! Please login.');
      setMode('login');
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBootstrap = async () => {
    await Promise.all([fetchTasks(), fetchOrgUsers(), fetchDesignations(), fetchTargets(), fetchMessages(), fetchSummary()]);
  };

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);
      const res = await authFetch(`${API_URL}/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      setTasks(data.data || data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgUsers = async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/users/org`);
      if (res.status === 403) {
        setInfo('Only owner or senior can load users.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      const mapped = (data || []).map((u: any) => ({
        id: u._id || u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        orgId: u.orgId,
        managerId: u.managerId,
        designationId: u.designationId,
      })) as OrgUser[];
      setOrgUsers(mapped);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const fetchDesignations = async () => {
    if (!token || !user) return;
    try {
      const res = await authFetch(`${API_URL}/designations/org/${user.orgId}`);
      if (res.status === 403) {
        setInfo('Only owner or senior can view designations.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load designations');
      const data = await res.json();
      setDesignations(data || []);
    } catch (err) {
      // Non-blocking
      console.warn(err);
    }
  };

  const fetchTargets = async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/targets`);
      if (!res.ok) throw new Error('Failed to load targets');
      const data = await res.json();
      setTargets(data || []);
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/chat`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.warn(err);
    }
  };

  const fetchSummary = async () => {
    if (!token || user?.role !== 'owner') return;
    try {
      const res = await authFetch(`${API_URL}/tasks/summary/org`);
      if (!res.ok) throw new Error('Failed to load summary');
      const data = await res.json();
      setSummary(data || { total: 0, done: 0, open: 0, perUser: [] });
    } catch (err) {
      console.warn(err);
    }
  };

  const createTask = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authFetch(`${API_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          dueDate,
          priority,
          status,
          assignedTo: assignedTo || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTasks();
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority(3);
      setStatus('TODO');
      setDueDate('');
      setInfo('Task created');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createDesignation = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authFetch(`${API_URL}/designations`, {
        method: 'POST',
        body: JSON.stringify({ name: desigName, description: desigDesc, role: desigRole }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create designation');
      }
      setDesigName('');
      setDesigDesc('');
      setInfo('Designation created');
      await fetchDesignations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async () => {
    if (!token) return;
    if (!empDesignationId) {
      setError('Select a designation first');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authFetch(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify({
          name: empName,
          email: empEmail,
          password: empPassword,
          role: empRole,
          designationId: empDesignationId || undefined,
          managerId: empRole === 'junior' ? empManagerId : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEmpName('');
      setEmpEmail('');
      setEmpPassword('');
      setEmpDesignationId('');
      setEmpManagerId('');
      setInfo('Employee created');
      await fetchOrgUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const assignJunior = async (juniorId: string, managerId: string) => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/users/assign/${juniorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ managerId }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchOrgUsers();
      setInfo('Assignment updated');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const createTarget = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authFetch(`${API_URL}/targets`, {
        method: 'POST',
        body: JSON.stringify({
          title: targetTitle,
          description: targetDesc || undefined,
          period: targetPeriod,
          dueDate: targetDue || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTargetTitle('');
      setTargetDesc('');
      setTargetDue('');
      setInfo('Target created');
      await fetchTargets();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!token) return;
    if (!chatText.trim()) return;
    try {
      const res = await authFetch(`${API_URL}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content: chatText, recipientId: chatRecipient || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setChatText('');
      await fetchMessages();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateTarget = async (id: string, status: Target['status'], progress?: number) => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_URL}/targets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          progress: typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTargets();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const logout = (onDone?: () => void) => {
    setToken(null);
    setUser(null);
    setTasks([]);
    setOrgUsers([]);
    setDesignations([]);
    setInfo('Logged out');
    onDone?.();
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.isCompleted || t.status === 'DONE').length;
  const open = total - completed;
  const grouped = useMemo(() => {
    return {
      TODO: tasks.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter((t) => t.status === 'DONE'),
    };
  }, [tasks]);

  const targetSummary = useMemo(() => {
    const total = targets.length;
    const done = targets.filter((t) => t.status === 'done').length;
    const inProgress = targets.filter((t) => t.status === 'in_progress').length;
    const open = targets.filter((t) => t.status === 'open').length;
    return { total, done, inProgress, open };
  }, [targets]);

  return (
    <BrowserRouter>
      <AppRoutes
        state={{
          mode,
          email,
          password,
          name,
          orgName,
          token,
          user,
          tasks,
          orgUsers,
          designations,
          targets,
          messages,
          summary,
          loading,
          error,
          info,
          title,
          description,
          dueDate,
          priority,
          status,
          assignedTo,
          filterStatus,
          search,
          viewMode,
          activeMenu,
          orgId: user?.orgId || '',
          desigName,
          desigDesc,
          desigRole,
          empName,
          empEmail,
          empPassword,
          empRole,
          empDesignationId,
          empManagerId,
          targetTitle,
          targetDesc,
          targetPeriod,
          targetDue,
          chatText,
          chatRecipient,
        }}
        actions={{
          setMode,
          setEmail,
          setPassword,
          setName,
          setOrgName,
          setToken,
          setUser,
          setTasks,
          setOrgUsers,
          setDesignations,
          setTargets,
          setMessages,
          setSummary,
          setLoading,
          setError,
          setInfo,
          setTitle,
          setDescription,
          setDueDate,
          setPriority,
          setStatus,
          setAssignedTo,
          setFilterStatus,
          setSearch,
          setViewMode,
          setActiveMenu,
          setDesigName,
          setDesigDesc,
          setDesigRole,
          setEmpName,
          setEmpEmail,
          setEmpPassword,
          setEmpRole,
          setEmpDesignationId,
          setEmpManagerId,
          setTargetTitle,
          setTargetDesc,
          setTargetPeriod,
          setTargetDue,
          setChatText,
          setChatRecipient,
        }}
        handlers={{
          handleLogin,
          handleRegister,
          createTask,
          createDesignation,
          createEmployee,
          logout,
          fetchTasks,
          fetchOrgUsers,
          fetchDesignations,
          fetchTargets,
          fetchMessages,
          fetchSummary,
          createTarget,
          sendMessage,
          assignJunior,
          updateTarget,
          targetSummary,
          apiBase,
          grouped,
          totals: { open, completed, total },
          allowedAssignees,
          userMap,
        }}
      />
    </BrowserRouter>
  );
}

type AppState = {
  mode: 'login' | 'register';
  email: string;
  password: string;
  name: string;
  orgName: string;
  orgId: string;
  token: string | null;
  user: User | null;
  tasks: Task[];
  orgUsers: OrgUser[];
  designations: Designation[];
  targets: Target[];
  messages: ChatMessage[];
  summary: { total: number; done: number; open: number; perUser: any[] };
  loading: boolean;
  error: string | null;
  info: string | null;
  title: string;
  description: string;
  dueDate: string;
  priority: number;
  status: Task['status'];
  assignedTo: string;
  filterStatus: Task['status'] | '';
  search: string;
  viewMode: 'board' | 'list';
  activeMenu: 'tasks' | 'designation' | 'employees' | 'target' | 'assign' | 'progress' | 'chat';
  desigName: string;
  desigDesc: string;
  desigRole: 'senior' | 'junior' | 'mid-level' | 'fresher';
  empName: string;
  empEmail: string;
  empPassword: string;
  empRole: 'senior' | 'junior';
  empDesignationId: string;
  empManagerId: string;
  targetTitle: string;
  targetDesc: string;
  targetPeriod: 'week' | 'month' | 'quarter' | 'year';
  targetDue: string;
  chatText: string;
  chatRecipient: string;
};

type AppActions = {
  setMode: (v: AppState['mode']) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setName: (v: string) => void;
  setOrgName: (v: string) => void;
  setToken: (v: string | null) => void;
  setUser: (v: User | null) => void;
  setTasks: (v: Task[]) => void;
  setOrgUsers: (v: OrgUser[]) => void;
  setDesignations: (v: Designation[]) => void;
  setTargets: (v: Target[]) => void;
  setMessages: (v: ChatMessage[]) => void;
  setSummary: (v: { total: number; done: number; open: number; perUser: any[] }) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setInfo: (v: string | null) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setDueDate: (v: string) => void;
  setPriority: (v: number) => void;
  setStatus: (v: Task['status']) => void;
  setAssignedTo: (v: string) => void;
  setFilterStatus: (v: Task['status'] | '') => void;
  setSearch: (v: string) => void;
  setViewMode: (v: 'board' | 'list') => void;
  setActiveMenu: (v: AppState['activeMenu']) => void;
  setDesigName: (v: string) => void;
  setDesigDesc: (v: string) => void;
  setDesigRole: (v: AppState['desigRole']) => void;
  setEmpName: (v: string) => void;
  setEmpEmail: (v: string) => void;
  setEmpPassword: (v: string) => void;
  setEmpRole: (v: 'senior' | 'junior') => void;
  setEmpDesignationId: (v: string) => void;
  setEmpManagerId: (v: string) => void;
  setTargetTitle: (v: string) => void;
  setTargetDesc: (v: string) => void;
  setTargetPeriod: (v: 'week' | 'month' | 'quarter' | 'year') => void;
  setTargetDue: (v: string) => void;
  setChatText: (v: string) => void;
  setChatRecipient: (v: string) => void;
};

type AppHandlers = {
  handleLogin: (onSuccess?: () => void) => void;
  handleRegister: (onSuccess?: () => void) => void;
  createTask: () => void;
  createDesignation: () => void;
  createEmployee: () => void;
  logout: (onDone?: () => void) => void;
  fetchTasks: () => void;
  fetchOrgUsers: () => void;
  fetchDesignations: () => void;
  fetchTargets: () => void;
  fetchMessages: () => void;
  fetchSummary: () => void;
  createTarget: () => void;
  sendMessage: () => void;
  assignJunior: (juniorId: string, managerId: string) => void;
  updateTarget: (id: string, status: Target['status'], progress?: number) => void;
  targetSummary: { total: number; done: number; inProgress: number; open: number };
  apiBase: string;
  grouped: { TODO: Task[]; IN_PROGRESS: Task[]; DONE: Task[] };
  totals: { open: number; completed: number; total: number };
  allowedAssignees: OrgUser[];
  userMap: Record<string, OrgUser>;
};

function AppRoutes({
  state,
  actions,
  handlers,
}: {
  state: AppState;
  actions: AppActions;
  handlers: AppHandlers;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep route in sync with auth state on refresh
  useEffect(() => {
    if (state.token && location.pathname === '/auth') {
      navigate('/app', { replace: true });
    }
    if (!state.token && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [state.token, location.pathname, navigate]);

  // If owner and tasks menu is hidden, move to designation
  useEffect(() => {
    if (state.user?.role === 'owner' && state.activeMenu === 'tasks') {
      actions.setActiveMenu('designation');
    }
  }, [state.user?.role, state.activeMenu]);
  const goAuth = () => navigate('/auth', { replace: true });
  const goApp = () => navigate('/app', { replace: true });

  const onLogin = () => {
    handlers.handleLogin(goApp);
  };

  const onRegister = () => {
    handlers.handleRegister(() => actions.setMode('login'));
  };

  const onLogout = () => {
    handlers.logout(goAuth);
  };

  const authScreen = (
    <div className="content">
      <div className="topbar">
        <div className="env">
          <span className="pill-sub">API</span>
          <span className="env-url">{handlers.apiBase}</span>
        </div>
      </div>
      <main className="auth-container">
        <section className="panel auth-panel">
          <div className="panel-header">
            <h2>{state.mode === 'login' ? 'Sign in' : 'Create owner account'}</h2>
            <button
              className="link"
              onClick={() => {
                actions.setMode(state.mode === 'login' ? 'register' : 'login');
                actions.setError(null);
                actions.setInfo(null);
              }}
            >
              {state.mode === 'login' ? 'Need an account?' : 'Back to login'}
            </button>
          </div>
          {state.mode === 'register' && (
            <>
              <div className="field">
                <label>Owner name</label>
                <input value={state.name} onChange={(e) => actions.setName(e.target.value)} placeholder="Name" />
              </div>
              <div className="field">
                <label>Company name</label>
                <input value={state.orgName} onChange={(e) => actions.setOrgName(e.target.value)} placeholder="Acme Corp" />
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input
              value={state.email}
              onChange={(e) => actions.setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              value={state.password}
              onChange={(e) => actions.setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          </div>
          <button className="primary" disabled={state.loading} onClick={state.mode === 'login' ? onLogin : onRegister}>
            {state.loading ? 'Working…' : state.mode === 'login' ? 'Login' : 'Register owner'}
          </button>
          {state.error && <p className="error">{state.error}</p>}
          {state.info && <p className="info">{state.info}</p>}
        </section>
      </main>
    </div>
  );

  const assigneeSelect = (
    <select value={state.assignedTo} onChange={(e) => actions.setAssignedTo(e.target.value)}>
      <option value="">Select junior</option>
      {handlers.allowedAssignees.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} ({u.email})
        </option>
      ))}
    </select>
  );

  const isOwner = state.user?.role === 'owner';
  const isSenior = state.user?.role === 'senior';
  const canCreateTasks = isOwner || isSenior;

  const designationView = (
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
              Create account
            </button>
            {state.designations.length === 0 && <p className="muted">Add a designation first.</p>}
          </>
        ) : (
          <p className="muted">Login as the owner to create accounts.</p>
        )}
      </section>
    </>
  );

  const taskPanel = (
    <>
      <section className="panel">
        <div className="panel-header">
          <h2>Create task</h2>
          <span className="muted">Owners and seniors can assign tasks to juniors</span>
        </div>
        {!canCreateTasks && <p className="muted">Only owners and seniors can create tasks.</p>}
        <div className="field">
          <label>Title</label>
          <input value={state.title} onChange={(e) => actions.setTitle(e.target.value)} placeholder="Prepare sprint plan" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            value={state.description}
            onChange={(e) => actions.setDescription(e.target.value)}
            placeholder="What needs to be done?"
            rows={3}
          />
        </div>
        <div className="cols">
          <div className="field">
            <label>Status</label>
            <select value={state.status} onChange={(e) => actions.setStatus(e.target.value as Task['status'])}>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>
          <div className="field">
            <label>Due date</label>
            <input type="date" value={state.dueDate} onChange={(e) => actions.setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="cols">
          <div className="field">
            <label>Priority (1-5)</label>
            <input type="number" min={1} max={5} value={state.priority} onChange={(e) => actions.setPriority(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Assign to (junior)</label>
            {assigneeSelect}
          </div>
        </div>
        <button className="primary" disabled={state.loading || !state.token || !canCreateTasks} onClick={handlers.createTask}>
          {state.token ? (state.loading ? 'Saving…' : 'Create task') : 'Login to create'}
        </button>
      </section>

      <section className="panel full">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Tasks</h2>
            <div className="view-toggle">
              <button className={`chip-btn ${state.viewMode === 'board' ? 'active' : ''}`} onClick={() => actions.setViewMode('board')}>
                Board
              </button>
              <button className={`chip-btn ${state.viewMode === 'list' ? 'active' : ''}`} onClick={() => actions.setViewMode('list')}>
                List
              </button>
            </div>
          </div>
          <div className="tag">{state.tasks.length} items</div>
          <div className="filters">
            <div className="chip-row">
              {['', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                <button
                  key={s || 'all'}
                  className={`chip-btn ${state.filterStatus === s ? 'active' : ''}`}
                  onClick={() => actions.setFilterStatus(s as any)}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
            <input
              className="search"
              placeholder="Search title/description"
              value={state.search}
              onChange={(e) => actions.setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlers.fetchTasks();
              }}
            />
            <button className="ghost" disabled={state.loading} onClick={handlers.fetchTasks}>
              Refresh
            </button>
          </div>
        </div>
          {state.token && (
            <div className="insights" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="pill tiny">
                <div className="pill-title">Tasks</div>
                <div className="pill-sub">{handlers.totals.total} total · {handlers.totals.completed} done</div>
              </div>
              {state.tasks.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="96" height="96" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#eee" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#111"
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(
                        0,
                        Math.min(100, handlers.totals.total ? Math.round((handlers.totals.completed / handlers.totals.total) * 100) : 0),
                      )} 100`}
                      strokeDashoffset="25"
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill="#111">
                      {handlers.totals.total ? Math.round((handlers.totals.completed / handlers.totals.total) * 100) : 0}%
                    </text>
                  </svg>
                  <div className="pill tiny" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div className="pill-title">Progress</div>
                    <div className="pill-sub">
                      {handlers.totals.completed} done · {handlers.totals.open} open
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {state.token && (
            <div className="panel" style={{ marginTop: 8 }}>
              <div className="panel-header">
                <div className="panel-title">
                  <h2>My assigned tasks</h2>
                  <span className="muted">Tasks assigned to you</span>
                </div>
              </div>
              {state.user && state.tasks.filter((t) => t.assignedTo === state.user?.id).length === 0 && (
                <p className="muted">No tasks assigned to you yet.</p>
              )}
              <div className="board">
                {state.user &&
                  state.tasks
                    .filter((t) => t.assignedTo === state.user?.id)
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

          <div className="insights" style={{ marginTop: 8 }}>
          <div className="pill tiny">
            <div className="pill-title">Open</div>
            <div className="pill-sub">{handlers.totals.open}</div>
          </div>
          <div className="pill tiny">
            <div className="pill-title">Done</div>
            <div className="pill-sub">{handlers.totals.completed}</div>
          </div>
          <div className="pill tiny">
            <div className="pill-title">Total</div>
            <div className="pill-sub">{handlers.totals.total}</div>
          </div>
        </div>
        {!state.token && <p className="muted">Login to see your tasks.</p>}
        {state.token && state.tasks.length === 0 && <p className="muted">No tasks yet. Create one above.</p>}
        {state.token && state.tasks.length > 0 && state.viewMode === 'board' && (
          <div className="board">
            {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((col) => (
              <div key={col} className="column">
                <div className="column-header">
                  <span>{col === 'TODO' ? 'To do' : col === 'IN_PROGRESS' ? 'In progress' : 'Done'}</span>
                  <span className="tag">{handlers.grouped[col].length}</span>
                </div>
                <div className="column-body">
                  {handlers.grouped[col].map((task) => (
                    <div key={task._id} className="task-card">
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                      <div className="task-meta">
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        {task.priority && <span>Priority {task.priority}</span>}
                        {task.assignedTo && <span>Assignee: {handlers.userMap[task.assignedTo]?.name || '—'}</span>}
                      </div>
                    </div>
                  ))}
                  {handlers.grouped[col].length === 0 && <div className="empty">No items</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {state.token && state.tasks.length > 0 && state.viewMode === 'list' && (
          <div className="list-table">
            <div className="list-head">
              <span>Title</span>
              <span>Status</span>
              <span>Assignee</span>
              <span>Due</span>
              <span>Priority</span>
            </div>
            {state.tasks.map((task) => (
              <div key={task._id} className="list-row">
                <span className="task-title">{task.title}</span>
                <span className="chip">{task.status}</span>
                <span>{handlers.userMap[task.assignedTo || '']?.name || '—'}</span>
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                <span>{task.priority ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const employeesView = (
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

  const targetView = (
    <section className="panel">
      <div className="panel-header">
        <h2>Targets</h2>
        <span className="muted">Track goals for week / month / quarter / year.</span>
      </div>
      {isOwner ? (
        <>
          <div className="cols">
            <div className="field">
              <label>Title</label>
              <input value={state.targetTitle} onChange={(e) => actions.setTargetTitle(e.target.value)} placeholder="Hit $X revenue" />
            </div>
            <div className="field">
              <label>Period</label>
              <select value={state.targetPeriod} onChange={(e) => actions.setTargetPeriod(e.target.value as any)}>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div className="field">
              <label>Due date</label>
              <input type="date" value={state.targetDue} onChange={(e) => actions.setTargetDue(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={state.targetDesc} onChange={(e) => actions.setTargetDesc(e.target.value)} placeholder="Optional details" rows={2} />
          </div>
          <button className="primary" disabled={state.loading || !state.token || !state.targetTitle.trim()} onClick={handlers.createTarget}>
            Save target
          </button>
        </>
      ) : (
        <p className="muted">Owner only.</p>
      )}
      {state.targets.length > 0 && (
        <>
          <div className="insights" style={{ marginTop: 12 }}>
            <div className="pill tiny">
              <div className="pill-title">Total</div>
              <div className="pill-sub">{handlers.targetSummary.total}</div>
            </div>
            <div className="pill tiny">
              <div className="pill-title">Open</div>
              <div className="pill-sub">{handlers.targetSummary.open}</div>
            </div>
            <div className="pill tiny">
              <div className="pill-title">In progress</div>
              <div className="pill-sub">{handlers.targetSummary.inProgress}</div>
            </div>
            <div className="pill tiny">
              <div className="pill-title">Done</div>
              <div className="pill-sub">{handlers.targetSummary.done}</div>
            </div>
          </div>
          <div className="list-table" style={{ marginTop: 12 }}>
            <div className="list-head">
              <span>Title</span>
              <span>Period</span>
              <span>Status</span>
              <span>Progress</span>
            </div>
            {state.targets.map((t) => (
              <div key={t._id} className="list-row">
                <span className="task-title">{t.title}</span>
                <span className="chip">{t.period}</span>
                <span>
                  <select
                    defaultValue={t.status}
                    onChange={(e) => handlers.updateTarget(t._id, e.target.value as Target['status'], t.progress)}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                  </select>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={t.progress ?? 0}
                    onMouseUp={(e) => handlers.updateTarget(t._id, t.status, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handlers.updateTarget(t._id, t.status, Number((e.target as HTMLInputElement).value))}
                  />
                  <span style={{ minWidth: 36 }}>{t.progress ?? 0}%</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );

  const assignView = (
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

  const progressView = (
    <section className="panel">
      <div className="panel-header">
        <h2>Progress</h2>
        <span className="muted">Overall and per-employee summaries.</span>
      </div>
      <div className="insights">
        <div className="pill tiny">
          <div className="pill-title">Open tasks</div>
          <div className="pill-sub">{state.summary.open}</div>
        </div>
        <div className="pill tiny">
          <div className="pill-title">Done tasks</div>
          <div className="pill-sub">{state.summary.done}</div>
        </div>
        <div className="pill tiny">
          <div className="pill-title">Total</div>
          <div className="pill-sub">{state.summary.total}</div>
        </div>
      </div>
      <div className="list-table">
        <div className="list-head">
          <span>Employee</span>
          <span>Done</span>
          <span>Total</span>
        </div>
        {(state.summary.perUser || []).map((row: any) => (
          <div key={row._id || 'unassigned'} className="list-row">
            <span className="task-title">{handlers.userMap[row._id]?.name || 'Unassigned'}</span>
            <span>{row.done}</span>
            <span>{row.total}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const chatView = (
    <section className="panel">
      <div className="panel-header">
        <h2>Chat</h2>
        <span className="muted">Placeholder chat space.</span>
      </div>
      {state.token ? (
        <>
          <div className="cols">
            <div className="field">
              <label>To</label>
              <select value={state.chatRecipient} onChange={(e) => actions.setChatRecipient(e.target.value)}>
                <option value="">All</option>
                {state.orgUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Message</label>
              <input value={state.chatText} onChange={(e) => actions.setChatText(e.target.value)} placeholder="Type a message" />
            </div>
            <button className="primary" disabled={!state.chatText.trim()} onClick={handlers.sendMessage}>
              Send
            </button>
          </div>
          <div className="list-table" style={{ marginTop: 12 }}>
            <div className="list-head">
              <span>From</span>
              <span>To</span>
              <span>Content</span>
            </div>
            {state.messages.map((m) => (
              <div key={m._id} className="list-row">
                <span>{handlers.userMap[m.senderId]?.name || 'Unknown'}</span>
                <span>{m.recipientId ? handlers.userMap[m.recipientId]?.name || 'Unknown' : 'All'}</span>
                <span>{m.content}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="muted">Login to chat.</p>
      )}
    </section>
  );

  const renderContent = () => {
    switch (state.activeMenu) {
      case 'designation':
        return designationView;
      case 'employees':
        return employeesView;
      case 'target':
        return targetView;
      case 'assign':
        return assignView;
      case 'progress':
        return progressView;
      case 'chat':
        return chatView;
      case 'tasks':
      default:
        return taskPanel;
    }
  };

  const appShell = (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot" />
          <span className="brand-name">TaskManager</span>
        </div>
        <div className="nav-group">
          <div className="nav-label">Workspace</div>
          {state.user?.role !== 'owner' && (
            <button className={`nav-item ${state.activeMenu === 'tasks' ? 'active' : ''}`} onClick={() => actions.setActiveMenu('tasks')}>
              Tasks
            </button>
          )}
          <button
            className={`nav-item ${state.activeMenu === 'designation' ? 'active' : ''}`}
            onClick={() => actions.setActiveMenu('designation')}
          >
            Create designation
          </button>
          <button
            className={`nav-item ${state.activeMenu === 'employees' ? 'active' : ''}`}
            onClick={() => actions.setActiveMenu('employees')}
          >
            Employee list
          </button>
          <button className={`nav-item ${state.activeMenu === 'target' ? 'active' : ''}`} onClick={() => actions.setActiveMenu('target')}>
            Target
          </button>
          <button className={`nav-item ${state.activeMenu === 'assign' ? 'active' : ''}`} onClick={() => actions.setActiveMenu('assign')}>
            Assign employees
          </button>
          <button
            className={`nav-item ${state.activeMenu === 'progress' ? 'active' : ''}`}
            onClick={() => actions.setActiveMenu('progress')}
          >
            Progress
          </button>
          <button className={`nav-item ${state.activeMenu === 'chat' ? 'active' : ''}`} onClick={() => actions.setActiveMenu('chat')}>
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
            <span className="env-url">{handlers.apiBase}</span>
          </div>
          {state.user ? (
            <div className="pill">
              <div>
                <div className="pill-title">{state.user.name || state.user.email}</div>
                <div className="pill-sub">{state.user.role}</div>
              </div>
              <button className="ghost" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>

        <main className="main">
          {renderContent()}
          {state.error && <p className="error">{state.error}</p>}
          {state.info && <p className="info">{state.info}</p>}
        </main>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/auth" element={authScreen} />
      <Route path="/app" element={state.token ? appShell : <Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to={state.token ? '/app' : '/auth'} replace />} />
    </Routes>
  );
}

export default App;

