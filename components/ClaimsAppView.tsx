
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Dashboard } from './Dashboard.tsx';
import { ClaimsTable } from './ClaimsTable.tsx';
import { AdvisorAnalysis } from './AdvisorAnalysis.tsx';
import { ManagementReport } from './ManagementReport.tsx';
import { HistoricalTrend } from './HistoricalTrend.tsx';
import { MonthlyComparison } from './MonthlyComparison.tsx';
import { Claim, AdvisorKPI, ComparisonStatus, User, RecommendationStatus } from '../types.ts';
import { LayoutDashboard, Users, Clock, ArrowLeftRight, FileText, LineChart, Filter, Home, AlertCircle, Sparkles, Globe, BarChart3, CheckCircle2, XCircle, Activity, ClipboardList, TrendingUp } from 'lucide-react';
import { syncService } from '../lib/syncService.ts';

interface Props {
  currentUser: User | null;
  onBackToPortal: () => void;
  forcedTab?: 'general' | 'advisors' | 'critical' | 'management' | 'trends' | 'analysis';
}

export const ClaimsAppView: React.FC<Props> = ({ currentUser, onBackToPortal, forcedTab }) => {
  const [history, setHistory] = useState<Claim[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [baseDate, setBaseDate] = useState<string>('');
  const [compareDate, setCompareDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'general' | 'advisors' | 'critical' | 'management' | 'trends' | 'analysis'>('general');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [selectedImportDate, setSelectedImportDate] = useState<string>(new Date().toLocaleDateString('en-CA'));

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  const loadData = async () => {
    setIsSyncing(true);
    const data = await syncService.fetchAllClaims();
    setHistory(data);
    setIsSyncing(false);
  };

  const handleDataImported = async (newClaims: Claim[]) => {
    setIsSyncing(true);
    const existing = await syncService.fetchAllClaims();
    const combined = [...existing, ...newClaims];
    await syncService.saveClaims(combined);
    await loadData();
    setIsSyncing(false);
  };

  const handleResetDB = async () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić całą bazę danych?')) {
      await syncService.clearAllData();
      await loadData();
    }
  };

  const updateRecommendationStatus = async (claimId: string, status: RecommendationStatus) => {
    const updated = history.map(c => c.id === claimId ? { ...c, recommendationStatus: status } : c);
    setHistory(updated);
    await syncService.saveClaims(updated);
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableDates = useMemo(() => 
    Array.from(new Set<string>(history.map(c => c.importDate))).sort().reverse()
  , [history]);

  useEffect(() => {
    if (availableDates.length > 0) {
      if (!baseDate || !availableDates.includes(baseDate)) setBaseDate(availableDates[0]);
      if (availableDates.length > 1 && (!compareDate || !availableDates.includes(compareDate))) {
        setCompareDate(availableDates[1]);
      }
    }
  }, [availableDates, baseDate, compareDate]);

  const processedData = useMemo<Claim[]>(() => {
    const curr = history.filter(c => c.importDate === baseDate);
    const prev = history.filter(c => c.importDate === compareDate);
    const prevMap = new Map<string, Claim>();
    prev.forEach(c => prevMap.set(c.claimNumber, c));
    const currMap = new Map<string, Claim>();
    curr.forEach(c => currMap.set(c.claimNumber, c));
    const allNumbers = Array.from(new Set([...prevMap.keys(), ...currMap.keys()]));
    
    return allNumbers.map(num => {
      const p = prevMap.get(num);
      const c = currMap.get(num);
      let status: ComparisonStatus = 'STAGNACJA';
      if (c && !p) status = 'NOWA';
      else if (!c && p) status = 'ZAMKNIĘTA';
      else if (c && p && (c.lastActionDate !== p.lastActionDate || c.status !== p.status)) status = 'W TOKU - ZMIANA';
      return { ...(c || p) as Claim, comparisonStatus: status };
    });
  }, [history, baseDate, compareDate]);

  const advisorKPIs = useMemo((): AdvisorKPI[] => {
    const advisors = Array.from(new Set(processedData.map(c => c.advisor))) as string[];
    return advisors.map(name => {
      const my = processedData.filter(c => c.advisor === name);
      const active = my.filter(c => c.comparisonStatus !== 'ZAMKNIĘTA');
      return {
        name,
        openCount: active.length,
        closedCount: my.filter(c => c.comparisonStatus === 'ZAMKNIĘTA').length,
        newCount: active.filter(c => c.comparisonStatus === 'NOWA').length,
        stagnantCount: active.filter(c => c.inactivityDays > 7).length,
        avgAge: active.length ? Math.round(active.reduce((acc, c) => acc + c.age, 0) / active.length) : 0,
        overduePercent: active.length ? Math.round((active.filter(c => c.inactivityDays > 7).length / active.length) * 100) : 0
      };
    }).sort((a, b) => b.closedCount - a.closedCount);
  }, [processedData]);

  const prevClaims = useMemo(() => history.filter(c => c.importDate === compareDate), [history, compareDate]);

  const filteredPortfolio = useMemo(() => {
    let filtered = processedData.filter(c => c.comparisonStatus !== 'ZAMKNIĘTA');
    if (selectedAdvisor !== 'all') filtered = filtered.filter(c => c.advisor === selectedAdvisor);
    return filtered;
  }, [processedData, selectedAdvisor]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Inter']">
      <Sidebar 
        userRole={currentUser?.role}
        onDataImported={handleDataImported} 
        availableDates={availableDates}
        baseDate={baseDate} 
        compareDate={compareDate}
        onBaseDateChange={setBaseDate} 
        onCompareDateChange={setCompareDate}
        onResetDB={handleResetDB} 
        selectedImportDate={selectedImportDate}
        onImportDateChange={setSelectedImportDate}
      />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={onBackToPortal} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Home size={20} /></button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ArrowLeftRight className="text-[#2D3192] h-6 w-6" />
                <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Claims Pro</h1>
              </div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-[10px]">Analiza & Zarządzanie Portfelem</p>
            </div>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-pulse">
              <Activity size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase">Przetwarzanie danych...</span>
            </div>
          )}
        </header>

        <div className="space-y-10">
          <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1.5 rounded-[20px] w-fit border border-slate-200">
            <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<LayoutDashboard size={16}/>}>Dashboard</TabButton>
            <TabButton active={activeTab === 'critical'} onClick={() => setActiveTab('critical')} icon={<ClipboardList size={16}/>}>Zadania</TabButton>
            <TabButton active={activeTab === 'advisors'} onClick={() => setActiveTab('advisors')} icon={<Users size={16}/>}>Zespół</TabButton>
            <TabButton active={activeTab === 'management'} onClick={() => setActiveTab('management')} icon={<FileText size={16}/>}>Raport</TabButton>
            <TabButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} icon={<LineChart size={16}/>}>Trend</TabButton>
            <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<TrendingUp size={16}/>}>Analiza MoM</TabButton>
          </div>

          <div className="animate-in fade-in duration-500 pb-20">
            {activeTab === 'general' && <Dashboard claims={filteredPortfolio} fullComparison={processedData} />}
            {activeTab === 'critical' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                   <div>
                     <h3 className="font-black text-slate-800 uppercase text-sm">Lista Zadań i Rekomendacji</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sztuczna inteligencja Claims Engine podpowiada kolejny krok</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Filtr Doradcy:</span>
                     <select 
                      value={selectedAdvisor} 
                      onChange={e => setSelectedAdvisor(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-black uppercase outline-none focus:border-indigo-400 transition-all"
                     >
                       <option value="all">Wszyscy</option>
                       {advisorKPIs.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                     </select>
                   </div>
                </div>
                <ClaimsTable data={filteredPortfolio} onUpdateStatus={updateRecommendationStatus} />
              </div>
            )}
            {activeTab === 'advisors' && <AdvisorAnalysis data={advisorKPIs} />}
            {activeTab === 'management' && (
              <ManagementReport 
                claims={filteredPortfolio} 
                fullComparison={processedData} 
                prevClaims={prevClaims} 
                advisorKPIs={advisorKPIs} 
              />
            )}
            {activeTab === 'trends' && <HistoricalTrend data={availableDates.map(d => ({ date: d, count: history.filter(c => c.importDate === d).length }))} />}
            {activeTab === 'analysis' && <MonthlyComparison history={history} />}
          </div>
        </div>
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, children, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-3 rounded-[16px] text-[11px] font-black uppercase transition-all whitespace-nowrap ${active ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white/50'}`}>
    {icon} {children}
  </button>
);
