
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserPlus, Trash2, Lock, Unlock, CheckCircle2, XCircle, Home, X, Eye, EyeOff } from 'lucide-react';

interface Props {
  users: User[];
  onUpdateUser: (user: User) => void;
  onAddUser: (userData: { fullName: string; username: string; role: UserRole; password?: string }) => void;
  onDeleteUser: (id: string) => void;
  onBack: () => void;
}

export const AdminPortalView: React.FC<Props> = ({ users, onUpdateUser, onAddUser, onDeleteUser, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ fullName: '', username: '', role: 'USER' as UserRole, password: '' });

  const toggleApp = (user: User, appId: string) => {
    const newApps = user.allowedApps.includes(appId)
      ? user.allowedApps.filter(id => id !== appId)
      : [...user.allowedApps, appId];
    onUpdateUser({ ...user, allowedApps: newApps });
  };

  const toggleStatus = (user: User) => {
    onUpdateUser({ ...user, status: user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) {
      alert('Wypełnij wszystkie pola, w tym hasło!');
      return;
    }
    onAddUser(formData);
    setIsModalOpen(false);
    setFormData({ fullName: '', username: '', role: 'USER', password: '' });
  };

  const getAppName = (id: string) => {
    switch(id) {
      case 'claims': return 'Likwidacja';
      case 'legal': return 'NFM Dispatcher';
      case 'pricing': return 'Hertz Fleet';
      default: return id;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] p-10 relative">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
              <Home size={20} />
           </button>
           <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Zarządzanie Zespołem</h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Panel Administratora Systemu</p>
           </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <UserPlus size={16} /> Dodaj Członka Zespołu
        </button>
      </header>

      <div className="max-w-6xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Użytkownik / Dane</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Dostępne Moduły</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                      {u.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{u.fullName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">@{u.username} • {u.role}</span>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold text-slate-500">
                          <span>{showPasswords[u.id] ? (u.password || 'pro123') : '••••••'}</span>
                          <button onClick={() => togglePasswordVisibility(u.id)} className="hover:text-indigo-600 transition-colors">
                            {showPasswords[u.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {u.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {u.status === 'ACTIVE' ? 'Aktywny' : 'Zablokowany'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center gap-2">
                    {['claims', 'legal', 'pricing'].map(appId => (
                      <button 
                        key={appId}
                        onClick={() => toggleApp(u, appId)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${u.allowedApps.includes(appId) ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}
                      >
                        {getAppName(appId)}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => toggleStatus(u)}
                      className={`p-2.5 rounded-xl transition-all ${u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                      title={u.status === 'ACTIVE' ? 'Zablokuj' : 'Odblokuj'}
                    >
                      {u.status === 'ACTIVE' ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DODAWANIA UŻYTKOWNIKA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 animate-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Nowy pracownik</h3>
              <p className="text-slate-400 text-xs font-bold uppercase mt-1">Uzupełnij dane profilowe</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Imię i Nazwisko</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all"
                  placeholder="np. Jan Kowalski"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Login</label>
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all"
                    placeholder="jkowalski"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Hasło</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rola w systemie</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all appearance-none"
                >
                  <option value="USER">Standardowy Użytkownik</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Anuluj
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Zapisz profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
