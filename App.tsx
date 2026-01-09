
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types.ts';
import { ClaimsAppView } from './components/ClaimsAppView.tsx';
import { AdminPortalView } from './components/AdminPortalView.tsx';
import { NfmDispatcherView } from './components/NfmDispatcherView.tsx';
import { HertzFleetManagerView } from './components/HertzFleetManagerView.tsx';
import { PresentationView } from './components/PresentationView.tsx';
import { LogIn, LayoutGrid, ShieldCheck, LogOut, Lock, Database, Briefcase, Settings, Send, Car, Presentation, Play, StopCircle } from 'lucide-react';

const AUTH_KEY = 'claims_pro_auth_v1';
const USERS_KEY = 'claims_pro_users_v1';

const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', fullName: 'Administrator Systemu', password: 'admin', role: 'ADMIN', status: 'ACTIVE', allowedApps: ['claims', 'legal', 'pricing'] },
  { id: '2', username: 'user1', fullName: 'Jan Kowalski', password: 'user123', role: 'USER', status: 'ACTIVE', allowedApps: ['claims'] }
];

type ViewState = 'login' | 'portal' | 'claims-app' | 'admin' | 'nfm-dispatcher' | 'hertz-fleet' | 'presentation';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<ViewState>('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Showcase State
  const [showcase, setShowcase] = useState<{ active: boolean; step: number; label: string }>({ active: false, step: 0, label: '' });
  const [forcedTab, setForcedTab] = useState<'general' | 'advisors' | 'critical' | 'management' | 'trends' | 'analysis'>('general');

  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_KEY);
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(INITIAL_USERS);
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }

    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      const u = JSON.parse(savedAuth);
      setCurrentUser(u);
      setView('portal');
    }
  }, []);

  // Live Showcase Orchestrator
  useEffect(() => {
    if (!showcase.active) return;

    const steps: { view: ViewState; tab?: any; label: string; duration: number }[] = [
      { view: 'portal', label: 'Centrum Operacyjne Claims Pro - Wszystkie narzędzia w jednym miejscu', duration: 4000 },
      { view: 'claims-app', tab: 'general', label: 'Moduł Likwidacji: Dashboard analityczny i monitoring portfela', duration: 5000 },
      { view: 'claims-app', tab: 'advisors', label: 'Zarządzanie Zespołem: Rankingi i wydajność doradców', duration: 5000 },
      { view: 'claims-app', tab: 'trends', label: 'Analiza Trendów: Historia obciążenia portfela', duration: 4000 },
      { view: 'nfm-dispatcher', label: 'NFM Dispatcher: Automatyzacja generowania raportów serwisowych', duration: 5000 },
      { view: 'hertz-fleet', label: 'Hertz Fleet Action: Monitoring logistyki i alertów terminowych', duration: 5000 },
      { view: 'portal', label: 'Dziękujemy za uwagę - Claims Pro Enterprise v1.2', duration: 3000 },
    ];

    const current = steps[showcase.step];
    setView(current.view);
    if (current.tab) setForcedTab(current.tab);
    setShowcase(prev => ({ ...prev, label: current.label }));

    const timer = setTimeout(() => {
      if (showcase.step < steps.length - 1) {
        setShowcase(prev => ({ ...prev, step: prev.step + 1 }));
      } else {
        setShowcase({ active: false, step: 0, label: '' });
        setView('portal');
      }
    }, current.duration);

    return () => clearTimeout(timer);
  }, [showcase.active, showcase.step]);

  const startShowcase = () => {
    setShowcase({ active: true, step: 0, label: 'Przygotowanie demo...' });
  };

  const stopShowcase = () => {
    setShowcase({ active: false, step: 0, label: '' });
    setView('portal');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === loginForm.username);
    if (foundUser && loginForm.password === (foundUser.password || 'pro123')) {
      setCurrentUser(foundUser);
      setView('portal');
      localStorage.setItem(AUTH_KEY, JSON.stringify(foundUser));
    } else {
      alert('Błędny login lub hasło.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    localStorage.removeItem(AUTH_KEY);
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center mb-10">
              <div className="bg-indigo-600 p-4 rounded-[24px] mb-6"><Briefcase className="text-white w-8 h-8" /></div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Claims Pro</h1>
              <p className="text-slate-400 text-xs font-bold uppercase mt-2">Enterprise Access</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" placeholder="Login" />
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold" placeholder="••••••••" />
              <button className="w-full bg-indigo-600 text-white font-black uppercase text-xs py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2"><LogIn size={16} /> Zaloguj</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Real-time Showcase Overlay */}
      {showcase.active && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] w-full max-w-4xl px-10 animate-in slide-in-from-bottom-10">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl flex items-center justify-between gap-10">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Play fill="white" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Live Presentation Mode</p>
                <h4 className="text-white text-lg font-bold tracking-tight">{showcase.label}</h4>
              </div>
            </div>
            <button onClick={stopShowcase} className="text-slate-400 hover:text-white transition-colors"><StopCircle size={32} /></button>
          </div>
        </div>
      )}

      {view === 'claims-app' && <ClaimsAppView key={currentUser?.id} currentUser={currentUser} onBackToPortal={() => setView('portal')} forcedTab={showcase.active ? forcedTab : undefined} />}
      {view === 'nfm-dispatcher' && <NfmDispatcherView onBack={() => setView('portal')} />}
      {view === 'hertz-fleet' && <HertzFleetManagerView onBack={() => setView('portal')} />}
      {view === 'presentation' && <PresentationView onBack={() => setView('portal')} onStartLiveShowcase={startShowcase} />}
      {view === 'admin' && (
        <AdminPortalView 
          users={users} 
          onUpdateUser={(u) => setUsers(prev => prev.map(x => x.id === u.id ? u : x))} 
          onAddUser={() => {}}
          onDeleteUser={() => {}}
          onBack={() => setView('portal')}
        />
      )}

      {view === 'portal' && (
        <div className="min-h-screen bg-[#F8FAFC] p-10 font-['Inter']">
          <header className="max-w-6xl mx-auto flex justify-between items-center mb-16">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-1">Cześć, {currentUser?.fullName}!</h2>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-[10px]">Wybierz narzędzie do pracy</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setView('presentation')} className="flex items-center gap-2 bg-indigo-50 px-5 py-3 rounded-2xl border border-indigo-100 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                <Presentation size={16} /> Slide Room
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-50 text-rose-500 px-5 py-3 rounded-2xl text-[11px] font-black uppercase"><LogOut size={16} /> Wyloguj</button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <PortalCard title="Likwidacja Szkód" icon={<Database className="text-indigo-500" />} onClick={() => setView('claims-app')} />
            <PortalCard title="NFM Dispatcher" icon={<Send className="text-emerald-500" />} onClick={() => setView('nfm-dispatcher')} />
            <PortalCard title="Hertz Fleet Action" icon={<Car className="text-amber-500" />} onClick={() => setView('hertz-fleet')} />
          </main>
        </div>
      )}
    </div>
  );
};

const PortalCard = ({ title, icon, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all text-left group">
    <div className="bg-slate-50 w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-black text-slate-800 uppercase">{title}</h3>
    <p className="text-slate-400 text-sm font-medium mt-4">Uruchom dedykowany moduł operacyjny.</p>
  </button>
);

export default App;
