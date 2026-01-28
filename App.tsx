
import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import ShoppingList from './components/ShoppingList';
import GoalsList from './components/GoalsList';
import { AgendaEvent, AppNotification, ShoppingItem, Goal } from './types';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Target, 
  ShoppingCart, 
  Search, 
  Plus, 
  Clock, 
  X, 
  ArrowLeft, 
  Sun, 
  Moon, 
  VolumeX, 
  Trash2,
  Repeat,
  ExternalLink,
  ChevronRight,
  Menu,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus
} from 'lucide-react';

type ViewMode = 'dashboard' | 'calendar' | 'shopping' | 'goals';
type AuthMode = 'login' | 'register';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('elite-auth') === 'true';
  });
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('elite-theme');
    return saved === 'dark';
  });
  
  const [events, setEvents] = useState<AgendaEvent[]>(() => {
    const saved = localStorage.getItem('elite-agenda-events');
    if (saved) {
      return JSON.parse(saved).map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      }));
    }
    return [];
  });

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('elite-shopping-list');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('elite-goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');

  const [newEvent, setNewEvent] = useState<Partial<AgendaEvent>>({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    priority: 'medium',
    category: 'other',
    reminderMinutes: 15,
    recurrence: 'none'
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('elite-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('elite-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('elite-agenda-events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('elite-shopping-list', JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    localStorage.setItem('elite-goals', JSON.stringify(goals));
  }, [goals]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (authMode === 'register') {
      const existingUsers = JSON.parse(localStorage.getItem('elite-users') || '[]');
      if (existingUsers.some((u: any) => u.user === loginUser)) {
        setLoginError('Este usuário já existe!');
        return;
      }
      const newUser = { user: loginUser, pass: loginPass };
      localStorage.setItem('elite-users', JSON.stringify([...existingUsers, newUser]));
      setIsAuthenticated(true);
      localStorage.setItem('elite-auth', 'true');
      localStorage.setItem('elite-current-user', loginUser);
    } else {
      // Login mode
      const users = JSON.parse(localStorage.getItem('elite-users') || '[]');
      // Fallback para admin padrão caso não existam usuários
      if (users.length === 0 && loginUser === 'admin' && loginPass === '1234') {
        setIsAuthenticated(true);
        localStorage.setItem('elite-auth', 'true');
        localStorage.setItem('elite-current-user', 'admin');
        return;
      }

      const userMatch = users.find((u: any) => u.user === loginUser && u.pass === loginPass);
      if (userMatch) {
        setIsAuthenticated(true);
        localStorage.setItem('elite-auth', 'true');
        localStorage.setItem('elite-current-user', loginUser);
      } else {
        setLoginError('Usuário ou senha incorretos!');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('elite-auth');
    localStorage.removeItem('elite-current-user');
  };

  const startAlarmSound = () => {
    if (isAlarmPlaying) return;
    setIsAlarmPlaying(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const interval = setInterval(() => {
      if (!isAlarmPlaying) { clearInterval(interval); return; }
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    }, 1000);
  };

  const stopAlarmSound = () => setIsAlarmPlaying(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach(event => {
        if (event.reminderMinutes === undefined) return;
        let shouldTrigger = false;
        let notificationKey = '';

        if (event.recurrence === 'daily') {
          const eventTime = event.start.getHours() * 60 + event.start.getMinutes();
          const nowTime = now.getHours() * 60 + now.getMinutes();
          const triggerTime = eventTime - (event.reminderMinutes || 0);
          const todayKey = now.toISOString().split('T')[0];
          notificationKey = `${event.id}-${event.reminderMinutes}-${todayKey}`;
          if (nowTime === triggerTime && !notifiedIds.has(notificationKey)) { shouldTrigger = true; }
        } else {
          const reminderTime = new Date(event.start.getTime() - event.reminderMinutes * 60000);
          notificationKey = `${event.id}-${event.reminderMinutes}`;
          if (now >= reminderTime && now < event.start && !notifiedIds.has(notificationKey)) { shouldTrigger = true; }
        }

        if (shouldTrigger) {
          triggerNotification(event);
          setNotifiedIds(prev => new Set(prev).add(notificationKey));
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [events, notifiedIds]);

  const triggerNotification = (event: AgendaEvent) => {
    const isMedicine = event.category === 'health' || event.title.toLowerCase().includes('remédio');
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      eventId: event.id,
      title: isMedicine ? '💊 Alarme de Saúde' : 'Lembrete de Evento',
      message: `${event.title} ${event.recurrence === 'daily' ? '(Diário)' : ''} começa em breve!`,
      timestamp: new Date()
    };
    setActiveNotifications(prev => [newNotif, ...prev]);
    if (isMedicine || event.category === 'health') { startAlarmSound(); }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(newNotif.title, { body: newNotif.message });
    }
  };

  const openModalForNewEvent = (date: Date) => {
    const start = new Date(date);
    start.setHours(new Date().getHours() + 1, 0, 0, 0);
    setNewEvent({ title: '', description: '', start, end: new Date(start.getTime() + 3600000), priority: 'medium', category: 'other', reminderMinutes: 15, recurrence: 'none' });
    setModalDate(start.toISOString().split('T')[0]);
    setModalTime(start.toTimeString().slice(0, 5));
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const openModalForExistingEvent = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setNewEvent(event);
    setModalDate(event.start.toISOString().split('T')[0]);
    setModalTime(event.start.toTimeString().slice(0, 5));
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !modalDate || !modalTime) return;
    const combinedStart = new Date(`${modalDate}T${modalTime}:00`);
    const updatedEvent = {
      ...newEvent,
      start: combinedStart,
      end: new Date(combinedStart.getTime() + 3600000)
    } as AgendaEvent;

    if (selectedEvent) {
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    } else {
      const event: AgendaEvent = { ...updatedEvent, id: Math.random().toString(36).substr(2, 9) };
      setEvents(prev => [...prev, event]);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const dismissNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
    stopAlarmSound();
  };

  const addGoal = (goalData: Omit<Goal, 'id'>) => setGoals(prev => [...prev, { ...goalData, id: Math.random().toString(36).substr(2, 9) }]);
  const removeGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));
  const toggleGoal = (id: string) => setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : g.progress } : g));
  const updateGoalProgress = (id: string, progress: number) => setGoals(prev => prev.map(g => g.id === id ? { ...g, progress, completed: progress === 100 } : g));

  const addShoppingItem = (name: string, value: number, quantity: number) => setShoppingItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, value, quantity, completed: false }]);
  const removeShoppingItem = (id: string) => setShoppingItems(prev => prev.filter(i => i.id !== id));
  const toggleShoppingItem = (id: string) => setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  const updateShoppingItemValue = (id: string, newValue: number) => setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, value: newValue } : i));
  const updateShoppingItemQuantity = (id: string, newQuantity: number) => setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQuantity } : i));

  const currentUser = localStorage.getItem('elite-current-user') || 'Usuário';

  // Auth View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-500">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-200 dark:shadow-none mb-4 animate-bounce">
              A
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">Arthur</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
              {authMode === 'login' ? 'Bem-vindo de volta!' : 'Comece sua jornada aqui.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block px-2">Nome de Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block px-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white transition-all"
                  required
                />
              </div>
            </div>

            {loginError && (
              <p className="text-center text-red-500 text-xs font-bold animate-pulse">{loginError}</p>
            )}

            <button 
              type="submit"
              className={`w-full py-4 ${authMode === 'login' ? 'bg-indigo-600' : 'bg-emerald-600'} hover:opacity-90 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
            >
              {authMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
              {authMode === 'login' ? 'Acessar Conta' : 'Criar Conta Agora'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setLoginError(null); }}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
            >
              {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui cadastro? Faça Login'}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-10 font-bold uppercase tracking-widest">
            Arthur Personal Assistant &copy; 2024
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden lg:flex transition-colors duration-300">
        <div className="p-6 flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode('dashboard')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">A</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">Arthur</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <button onClick={() => setViewMode('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold ${viewMode === 'dashboard' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setViewMode('calendar')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold ${viewMode === 'calendar' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <CalendarIcon size={20} /> Calendário
          </button>
          <button onClick={() => setViewMode('goals')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold ${viewMode === 'goals' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Target size={20} /> Metas
          </button>
          <button onClick={() => setViewMode('shopping')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold ${viewMode === 'shopping' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <ShoppingCart size={20} /> Compras
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
            <img src={`https://ui-avatars.com/api/?name=${currentUser}&background=6366f1&color=fff`} alt="User" className="w-10 h-10 rounded-full shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser}</p>
              <button onClick={handleLogout} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Sair do app</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 lg:pb-0">
        <header className="h-16 lg:h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <div className="lg:hidden flex items-center gap-2 mr-2">
               <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm">A</div>
               <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[80px]">Arthur</span>
            </div>
            {viewMode !== 'dashboard' && (
              <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 px-2 py-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all font-semibold text-sm">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Início</span>
              </button>
            )}
            <div className="relative w-full max-w-[200px] sm:max-w-sm hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Procurar..." className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAlarmPlaying && (
              <button onClick={stopAlarmSound} className="p-2 bg-red-600 text-white rounded-xl animate-pulse shadow-lg font-bold text-xs flex items-center gap-1">
                <VolumeX size={14} /> <span className="hidden sm:inline">Parar</span>
              </button>
            )}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => openModalForNewEvent(new Date())} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-xs sm:text-sm">
              <Plus size={16} /> <span>Novo</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 scroll-smooth">
          <div className="max-w-[1200px] mx-auto p-4 sm:p-8">
            {viewMode === 'dashboard' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                <header className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">Olá, {currentUser}!</h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">Sua rotina está sob controle.</p>
                  </div>
                  <button onClick={handleLogout} className="lg:hidden p-2 text-slate-400 hover:text-red-500 transition-colors">
                    Sair
                  </button>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewMode('calendar')}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4"><CalendarIcon size={20} /></div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">Calendário</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">{events.length} compromissos</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewMode('goals')}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4"><Target size={20} /></div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">Metas</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">{goals.filter(g => !g.completed).length} ativas</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer col-span-2 sm:col-span-1" onClick={() => setViewMode('shopping')}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4"><ShoppingCart size={20} /></div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">Compras</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">{shoppingItems.length} itens</p>
                  </div>
                </div>

                <section className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 text-sm sm:text-base"><Clock className="text-indigo-500" size={18} /> Atividades</h3>
                    <button onClick={() => setViewMode('calendar')} className="text-[10px] sm:text-xs font-bold text-indigo-600 flex items-center gap-1">Calendário <ExternalLink size={12} /></button>
                  </div>
                  <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
                    {events.filter(e => e.start > new Date() || e.recurrence === 'daily').sort((a,b) => a.start.getTime() - b.start.getTime()).slice(0, 5).map(e => (
                      <div key={e.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl sm:rounded-2xl transition-all cursor-pointer" onClick={() => openModalForExistingEvent(e)}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-700 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          {e.recurrence === 'daily' ? <Repeat size={18} className="text-indigo-500" /> : <p className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{e.start.getDate()}</p>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">{e.title}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {e.recurrence === 'daily' ? 'Todo dia' : e.start.toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="text-slate-300" size={16} />
                      </div>
                    ))}
                    {events.length === 0 && <p className="text-center py-8 text-slate-400 text-xs italic">Nenhum compromisso agendado.</p>}
                  </div>
                </section>
              </div>
            )}
            
            {viewMode === 'calendar' && <Calendar events={events} onAddEvent={openModalForNewEvent} onSelectEvent={openModalForExistingEvent} onDeleteEvent={handleDeleteEvent} />}
            {viewMode === 'goals' && <GoalsList goals={goals} onAddGoal={addGoal} onRemoveGoal={removeGoal} onToggleGoal={toggleGoal} onUpdateProgress={updateGoalProgress} />}
            {viewMode === 'shopping' && <ShoppingList items={shoppingItems} onAddItem={addShoppingItem} onRemoveItem={removeShoppingItem} onToggleItem={toggleShoppingItem} onUpdateItemValue={updateShoppingItemValue} onUpdateItemQuantity={updateShoppingItemQuantity} />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setViewMode('dashboard')} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${viewMode === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setViewMode('calendar')} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${viewMode === 'calendar' ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
          <CalendarIcon size={20} />
          <span className="text-[10px] font-bold">Agenda</span>
        </button>
        <button onClick={() => setViewMode('goals')} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${viewMode === 'goals' ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
          <Target size={20} />
          <span className="text-[10px] font-bold">Metas</span>
        </button>
        <button onClick={() => setViewMode('shopping')} className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${viewMode === 'shopping' ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`}>
          <ShoppingCart size={20} />
          <span className="text-[10px] font-bold">Compras</span>
        </button>
      </nav>

      {/* Notifications */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] sm:w-80">
        {activeNotifications.map(notif => (
          <div key={notif.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 flex gap-4 animate-in slide-in-from-right-8 pointer-events-auto">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{notif.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
              <button onClick={() => dismissNotification(notif.id)} className="mt-3 w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Parar Alarme</button>
            </div>
            <button onClick={() => dismissNotification(notif.id)} className="text-slate-300"><X size={16} /></button>
          </div>
        ))}
      </div>

      {/* Modal - Mobile Optimized */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
             <div className="flex justify-between items-center">
               <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{selectedEvent ? 'Editar' : 'Novo Evento'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><X/></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título</label>
                 <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Nome da tarefa" className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" />
               </div>

               <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data</label>
                    <input type="date" value={modalDate} onChange={e => setModalDate(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all text-xs sm:text-sm" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hora</label>
                    <input type="time" value={modalTime} onChange={e => setModalTime(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 font-black transition-all text-xs sm:text-sm" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Categoria</label>
                    <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value as any})} className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-xs sm:text-sm">
                      <option value="personal">Pessoal</option>
                      <option value="work">Trabalho</option>
                      <option value="health">Saúde</option>
                      <option value="other">Outro</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Repetição</label>
                    <select value={newEvent.recurrence} onChange={e => setNewEvent({...newEvent, recurrence: e.target.value as any})} className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-xs sm:text-sm">
                      <option value="none">Único</option>
                      <option value="daily">Diário</option>
                    </select>
                 </div>
               </div>

               <div className="flex gap-3 pt-2 sm:pt-4">
                 <button onClick={handleSaveEvent} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                   Salvar
                 </button>
                 {selectedEvent && (
                   <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="px-5 py-4 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-2xl border border-red-100 dark:border-red-800 hover:bg-red-100 transition-all active:scale-95">
                     <Trash2 size={22} />
                   </button>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
