
import React, { useMemo } from 'react';
import { Layers, Calendar, Database, Trash2, HardDrive } from 'lucide-react';
import { Claim, UserRole } from '../types.ts';
import { syncService } from '../lib/syncService.ts';
import * as XLSX from 'xlsx';

interface SidebarProps {
  userRole?: UserRole;
  onDataImported: (claims: Claim[]) => void;
  availableDates: string[];
  baseDate: string;
  compareDate: string;
  onBaseDateChange: (date: string) => void;
  onCompareDateChange: (date: string) => void;
  onResetDB: () => void;
  selectedImportDate: string;
  onImportDateChange: (date: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, onDataImported, availableDates, baseDate, compareDate, onBaseDateChange, onCompareDateChange, onResetDB,
  selectedImportDate, onImportDateChange
}) => {
  const storageUsage = useMemo(() => syncService.getStorageUsage(), [availableDates]);

  const extractLastComment = (text: any): string => {
    if (!text) return 'Brak opisu';
    let str = String(text);
    
    const parts = str.split(/\d{2}\.\d{2}\.\d{4}\s\d{2}:\d{2}/);
    if (parts.length > 1) {
      str = parts[parts.length - 1].replace(/[:\-]/, '').trim();
    }
    
    // OPTYMALIZACJA: Skracamy komentarz do 400 znaków, aby oszczędzać localStorage
    if (str.length > 400) {
      return str.substring(0, 397) + '...';
    }
    return str.trim();
  };

  const processFiles = async (files: FileList): Promise<Claim[]> => {
    const allClaims: Claim[] = [];
    const today = new Date();
    const importStamp = selectedImportDate; 

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });

      let headerIdx = rows.findIndex(r => r && r.some(c => String(c).toLowerCase().includes('id zgłoszenia')));
      if (headerIdx === -1) headerIdx = 4;

      const headers = rows[headerIdx];
      const find = (keys: string[]) => headers.findIndex(h => h && keys.some(k => String(h).toLowerCase().trim().includes(k)));
      
      const idx = {
        id: find(['id zgłoszenia', 'numer']),
        status: find(['status']),
        date: find(['data zgłoszenia', 'otwarcia']),
        adv: find(['realizuje', 'doradca']),
        mod: find(['data modyfikacji', 'akcji', 'czynności']),
        desc: find(['opis pracownika', 'notatka', 'komentarz'])
      };

      rows.slice(headerIdx + 1).forEach((row) => {
        if (!row[idx.id]) return;
        const open = row[idx.date] instanceof Date ? row[idx.date] : new Date();
        const last = row[idx.mod] instanceof Date ? row[idx.mod] : open;
        const age = Math.max(0, Math.floor((today.getTime() - open.getTime()) / 86400000));
        const inact = Math.max(0, Math.floor((today.getTime() - last.getTime()) / 86400000));
        
        allClaims.push({
          id: `${importStamp}-${String(row[idx.id]).trim()}`,
          claimNumber: String(row[idx.id]).trim(),
          openDate: open.toISOString(),
          lastActionDate: last.toISOString(),
          status: String(row[idx.status] || 'Brak danych').trim(),
          advisor: String(row[idx.adv] || 'Nieprzypisany'),
          age,
          inactivityDays: inact,
          priority: Math.round(Math.min(100, (inact * 10) + (age / 10))),
          importDate: importStamp,
          lastComment: idx.desc > -1 ? extractLastComment(row[idx.desc]) : 'Brak opisu'
        });
      });
    }
    return allClaims;
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 z-50">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-2 text-[#2D3192] font-black text-xl mb-1">
          <Layers className="h-6 w-6" /> <span>CLAIMS PRO</span>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Analityczny 1.2</p>
      </div>

      <div className="p-8 space-y-8 overflow-y-auto flex-1">
        <section className="space-y-4">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Zasilanie Bazy</label>
          <div className="bg-indigo-50/40 p-5 rounded-[32px] border border-indigo-100/50 space-y-4">
            <div>
              <label className="text-[9px] font-black text-indigo-500 uppercase block ml-1 mb-2">Data danych</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none z-0" size={16} />
                <input 
                  type="date" 
                  value={selectedImportDate}
                  onChange={(e) => onImportDateChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-indigo-100 rounded-2xl text-[13px] font-black text-slate-700 focus:outline-none focus:border-indigo-400 transition-all cursor-pointer shadow-sm relative z-10 opacity-100"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>
            <div className="space-y-3">
               <input type="file" multiple className="hidden" id="main-up" onChange={async e => {
                 if(e.target.files) {
                   const data = await processFiles(e.target.files);
                   onDataImported(data);
                 }
               }} />
               <label htmlFor="main-up" className="flex items-center justify-center w-full h-28 border-2 border-dashed border-indigo-200 rounded-[32px] cursor-pointer bg-white hover:bg-indigo-50 hover:border-indigo-400 transition-all group shadow-sm">
                 <div className="text-center">
                   <Database className="mx-auto mb-2 text-indigo-400 group-hover:scale-110 transition-transform" size={24} />
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Kliknij aby wgrać</p>
                 </div>
               </label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Okresy Analizy</label>
          <div className="space-y-3">
            <DateSelector label="Stan Obecny" value={baseDate} onChange={onBaseDateChange} dates={availableDates} color="indigo" />
            <DateSelector label="Stan Poprzedni" value={compareDate} onChange={onCompareDateChange} dates={availableDates} color="emerald" />
          </div>
        </section>
      </div>

      <div className="p-8 pt-4 border-t border-slate-50 space-y-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={12} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase">Miejsce w bazie</span>
            </div>
            <span className={`text-[9px] font-black uppercase ${storageUsage > 80 ? 'text-rose-500' : 'text-slate-500'}`}>{storageUsage}%</span>
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${storageUsage > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
              style={{ width: `${storageUsage}%` }}
            ></div>
          </div>
          {storageUsage > 90 && (
            <p className="text-[8px] text-rose-500 font-bold mt-2 leading-tight uppercase">Uwaga: Brak miejsca. Wyczyść bazę danych!</p>
          )}
        </div>

        {userRole === 'ADMIN' && (
          <button type="button" onClick={onResetDB} className="w-full py-4 text-rose-500 hover:text-white hover:bg-rose-500 text-[10px] font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-2 border border-rose-200 hover:border-rose-500 shadow-sm">
            <Trash2 size={14} /> Wyczyść Bazę
          </button>
        )}
      </div>
    </aside>
  );
};

const DateSelector = ({ label, value, onChange, dates, color }: any) => (
  <div>
    <label className={`text-[8px] font-bold text-${color}-500 uppercase ml-2 mb-1 block`}>{label}</label>
    <div className="relative">
      <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 text-${color}-500 pointer-events-none`} size={14} />
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full pl-12 pr-4 py-3.5 bg-${color}-50/50 border border-${color}-100 rounded-2xl text-[11px] font-bold text-${color}-900 focus:outline-none appearance-none cursor-pointer hover:bg-${color}-50 transition-colors`}>
        <option value="">Wybierz...</option>
        {dates.map(d => <option key={`${label}-${d}`} value={d}>{d}</option>)}
      </select>
    </div>
  </div>
);
