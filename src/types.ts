export type User = {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'senior' | 'junior';
    orgId: string;
};

export type OrgUser = {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'senior' | 'junior';
    orgId: string;
    managerId?: string;
    designationId?: string;
};

export type Task = {
    _id: string;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate: string;
    priority?: number;
    assignedTo?: string; // userId
    isCompleted: boolean;
    orgId: string;
    parentTaskId?: string;
    estimatedHours?: number;
};

export type Designation = {
    _id: string;
    name: string;
    description?: string;
    role: 'senior' | 'junior' | 'mid-level' | 'fresher';
};

export type Target = {
    _id: string;
    title: string;
    description?: string;
    period: 'week' | 'month' | 'quarter' | 'year';
    status: 'open' | 'in_progress' | 'done';
    progress: number;
    dueDate?: string;
};

export type Report = {
    _id: string;
    requesterId: string;
    responderId: string;
    taskId?: string;
    requestMessage: string;
    responseMessage?: string;
    status: 'REQUESTED' | 'SUBMITTED' | 'REVIEWED';
    grade?: number;
    createdAt: string;
};

export type ChatMessage = {
    _id: string;
    senderId: string;
    recipientId?: string;
    content: string;
    createdAt: string;
};

export type AppState = {
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
    summary: { total: number; done: number; open: number; perUser: any[]; reportStats: any[] };
    loading: boolean;
    error: string | null;
    info: string | null;
    title: string;
    description: string;
    dueDate: string;
    priority: number;
    assignedTo: string;
    filterStatus: Task['status'] | '';
    search: string;
    viewMode: 'board' | 'list';
    activeMenu: 'tasks' | 'designation' | 'employees' | 'target' | 'assign' | 'progress' | 'chat' | 'reports';
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
    reports: Report[];
};

export type AppActions = {
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
    setReports: (v: Report[]) => void;
    setSummary: (v: { total: number; done: number; open: number; perUser: any[]; reportStats: any[] }) => void;
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

export type AppHandlers = {
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
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
    fetchReports: () => void;
};
