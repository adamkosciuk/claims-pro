
import React, { useState } from 'react';
import { Claim, RecommendationStatus } from '../types';
import { 
  AlertCircle, User, Wrench, FileSearch, ShieldAlert, Zap, 
  PhoneCall, Send, AlertTriangle, ArrowRightCircle, Hourglass, Info,
  MessageSquare, ChevronDown, ChevronUp, Clock, CheckCircle2, MinusCircle, Circle
} from 'lucide-react';
import { getSLALevel, inferBlockingReason, BlockingReason } from '../domain/claimEngine';
import { getRecommendedAction, ActionType, ActionRecommendation } from '../domain/decisionEngine';

interface ClaimsTableProps {
  data: Claim[];
  onUpdateStatus?: (claimId: string, status: RecommendationStatus) => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({ data, onUpdateStatus }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getRelativeTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    return `${diffDays} d. temu`;
  };

  const getActionShortLabel = (type: ActionType): string => {
    switch (type) {
      case ActionType.CALL_CLIENT: return 'Tel. Klient';
      case ActionType.CALL_WORKSHOP: return 'Tel. Serwis';
      case ActionType.SEND_REMINDER: return 'Przypomnij';
      case ActionType.ESCALATE: return 'Eskaluj';
      case ActionType.INTERNAL_CHASE: return 'Ponaglij';
      case ActionType.ASSIGN_TASK: return 'Podnieś';
      case ActionType.WAIT: return 'Czekaj';
      default: return 'Brak';
    }
  };

  const getPriorityStyles = (priority: string, status?: RecommendationStatus) => {
    if (status === 'DONE') return 'bg-emerald-50 text-emerald-400 border-emerald-100 opacity-60';
    if (status === 'SKIPPED') return 'bg-slate-50 text-slate-300 border-slate-100 opacity-40 grayscale';

    switch (priority) {
      case 'CRITICAL': return 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-200';
      case 'HIGH': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleStatusCycle = (e: React.MouseEvent, claimId: string, currentStatus?: RecommendationStatus) => {
    e.stopPropagation();
    if (!onUpdateStatus) return;
    
    let next: RecommendationStatus = 'TODO';
    if (!currentStatus || currentStatus === 'TODO') next = 'DONE';
    else if (currentStatus === 'DONE') next = 'SKIPPED';
    else if (currentStatus === 'SKIPPED') next = 'TODO';
    
    onUpdateStatus(claimId, next);
  };

  const renderActionBadge = (rec: ActionRecommendation, claim: Claim) => {
    const status = claim.recommendationStatus || 'TODO';
    
    return (
      <div className="flex items-center gap-2">
        <button 
          onClick={(e) => handleStatusCycle(e, claim.id, claim.recommendationStatus)}
          className={`shrink-0 transition-all hover:scale-110 ${status === 'DONE' ? 'text-emerald-500' : status === 'SKIPPED' ? 'text-slate-300' : 'text-slate-300 hover:text-indigo-400'}`}
        >
          {status === 'DONE' ? <CheckCircle2 size={18} fill="currentColor" className="text-white" /> : 
           status === 'SKIPPED' ? <MinusCircle size={18} /> : 
           <Circle size={18} />}
        </button>

        <div className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tight transition-all cursor-help flex-1 ${getPriorityStyles(rec.priority, status)}`}>
          {renderActionIcon(rec.type)}
          <span className="truncate">{status === 'DONE' ? 'WYKONANO' : getActionShortLabel(rec.type)}</span>
          
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 p-3 bg-slate-900 text-white rounded-2xl text-[10px] font-medium normal-case shadow-2xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1 text-indigo-400 uppercase font-black tracking-widest text-[8px]">
              <Info size={10} /> Uzasadnienie rekomendacji
            </div>
            {rec.explanation}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionIcon = (type: ActionType) => {
    const size = 14;
    switch (type) {
      case ActionType.CALL_CLIENT: 
      case ActionType.CALL_WORKSHOP: return <PhoneCall size={size} />;
      case ActionType.SEND_REMINDER: return <Send size={size} />;
      case ActionType.ESCALATE: return <AlertTriangle size={size} />;
      case ActionType.INTERNAL_CHASE: return <ArrowRightCircle size={size} />;
      case ActionType.ASSIGN_TASK: return <Zap size={size} />;
      default: return <Hourglass size={size} />;
    }
  };

  const renderReasonIconOnly = (reason: BlockingReason) => {
    const icons = {
      [BlockingReason.CLIENT]: { icon: <User size={16} />, color: 'text-blue-500 bg-blue-50 border-blue-100' },
      [BlockingReason.WORKSHOP]: { icon: <Wrench size={16} />, color: 'text-amber-500 bg-amber-50 border-amber-100' },
      [BlockingReason.DECISION]: { icon: <FileSearch size={16} />, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
      [BlockingReason.EXTERNAL]: { icon: <ShieldAlert size={16} />, color: 'text-rose-500 bg-rose-50 border-rose-100' },
      [BlockingReason.NEW]: { icon: <Zap size={16} />, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
      [BlockingReason.INTERNAL]: { icon: <AlertCircle size={16} />, color: 'text-slate-500 bg-slate-50 border-slate-100' },
      [BlockingReason.UNKNOWN]: { icon: <AlertCircle size={16} />, color: 'text-slate-300 bg-slate-50 border-slate-100' }
    };
    const config = icons[reason] || icons[BlockingReason.UNKNOWN];
    return (
      <div className="group relative flex justify-center">
        <div className={`p-2 rounded-xl border transition-transform group-hover:scale-110 ${config.color}`}>
          {config.icon}
        </div>
        <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-black uppercase rounded-lg whitespace-nowrap shadow-xl">
          {reason}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Legenda statusu:</span>
        <div className="flex items-center gap-4 border-r border-slate-100 pr-6 mr-2">
          <LegendItem icon={<Circle size={12} className="text-slate-300"/>} label="Do zrobienia" />
          <LegendItem icon={<CheckCircle2 size={12} className="text-emerald-500"/>} label="Wykonano" />
          <LegendItem icon={<MinusCircle size={12} className="text-slate-300"/>} label="Pominięto" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center">Zastoje:</span>
        <div className="flex items-center gap-4">
          <LegendItem icon={<User size={12} className="text-blue-500"/>} label="Klient" />
          <LegendItem icon={<Wrench size={12} className="text-amber-500"/>} label="Warsztat" />
          <LegendItem icon={<FileSearch size={12} className="text-indigo-500"/>} label="Decyzja" />
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-14 px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">SLA</th>
                <th className="w-48 px-6 py-4 text-[10px] font-black text-slate-400 uppercase">ID & Status</th>
                <th className="w-52 px-6 py-4 text-[10px] font-black text-indigo-600 uppercase">Działanie (Status)</th>
                <th className="w-20 px-4 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Powód</th>
                <th className="w-32 px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Bezruch</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Ostatni komentarz</th>
                <th className="w-32 px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Doradca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => {
                const reason = inferBlockingReason(c);
                const recommendation = getRecommendedAction(c);
                const isExpanded = expandedRow === c.id;
                
                return (
                  <React.Fragment key={c.id}>
                    <tr className={`transition-colors group ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-6 py-4 text-center">
                        <StatusDot days={c.inactivityDays} done={c.recommendationStatus === 'DONE'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{c.claimNumber}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase truncate" title={c.status}>{c.status}</div>
                      </td>
                      <td className="px-6 py-4">
                        {renderActionBadge(recommendation, c)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {renderReasonIconOnly(reason)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[11px] font-black ${c.inactivityDays > 7 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {getRelativeTime(c.lastActionDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div onClick={() => setExpandedRow(isExpanded ? null : c.id)} className="relative flex items-start gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 cursor-pointer group-hover:bg-white transition-all max-h-12 overflow-hidden">
                          <MessageSquare size={12} className="text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-slate-600 font-medium leading-tight italic line-clamp-2">
                            {c.lastComment ? `"${c.lastComment}"` : 'Brak aktualnych notatek'}
                          </p>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
                             {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg inline-block">{c.advisor}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-indigo-50/20 animate-in slide-in-from-top-2 duration-200">
                        <td colSpan={7} className="px-10 py-6 border-l-4 border-l-indigo-400">
                          <div className="grid grid-cols-2 gap-10">
                            <div>
                              <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Pełna treść ostatniego kroku</label>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm italic">
                                "{c.lastComment || 'Nie wprowadzono opisu'}"
                              </p>
                            </div>
                            <div className="space-y-4">
                              <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Szczegóły operacyjne</label>
                              <div className="grid grid-cols-2 gap-3">
                                <DetailBox label="ID Zlecenia" value={c.claimNumber} />
                                <DetailBox label="Status Decyzji" value={c.recommendationStatus || 'DO WYKONANIA'} />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusDot = ({ days, done }: { days: number, done?: boolean }) => {
  if (done) return <div className="w-3 h-3 bg-slate-200 rounded-full mx-auto" title="Zadanie wykonane"></div>;
  const level = getSLALevel(days);
  if (level === 'HIGH') return <div className="w-3 h-3 bg-rose-500 rounded-full mx-auto ring-4 ring-rose-50 shadow-sm" title="Krytyczny bezruch"></div>;
  if (level === 'MEDIUM') return <div className="w-3 h-3 bg-amber-400 rounded-full mx-auto ring-4 ring-amber-50 shadow-sm" title="Ostrzeżenie"></div>;
  return <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto ring-4 ring-emerald-50 shadow-sm" title="W toku"></div>;
};

const LegendItem = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="scale-75">{icon}</div>
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
  </div>
);

const DetailBox = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white/50 border border-indigo-50 p-2 rounded-xl">
    <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
    <p className="text-[10px] font-bold text-slate-800 uppercase truncate">{value}</p>
  </div>
);
