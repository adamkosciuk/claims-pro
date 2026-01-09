import React, { useMemo, useEffect, useRef } from 'react';
import { Claim } from '../types';
import { PlusCircle, CheckCircle2, PauseCircle, Clock } from 'lucide-react';

interface DashboardProps {
  claims: Claim[];
  fullComparison: Claim[];
}

export const Dashboard: React.FC<DashboardProps> = ({ claims, fullComparison }) => {
  const chartRef = useRef(null);

  const stats = useMemo(() => {
    const closed = fullComparison.filter(c => c.comparisonStatus === 'ZAMKNIĘTA').length;
    const news = claims.filter(c => c.comparisonStatus === 'NOWA').length;
    const stagnant = claims.filter(c => c.comparisonStatus === 'STAGNACJA').length;
    const inProgress = claims.filter(c => c.comparisonStatus === 'W TOKU - ZMIANA').length;
    const avgInactivity = claims.length > 0 ? Math.round(claims.reduce((acc, c) => acc + c.inactivityDays, 0) / claims.length) : 0;
    const totalCount = fullComparison.length || 1;
    const closedPercent = Math.round((closed / totalCount) * 100);
    return { news, closed, stagnant, inProgress, avgInactivity, closedPercent };
  }, [claims, fullComparison]);

  const aging = useMemo(() => [
    { label: '0-7 dni', value: claims.filter(c => c.inactivityDays <= 7).length },
    { label: '8-14 dni', value: claims.filter(c => c.inactivityDays > 7 && c.inactivityDays <= 14).length },
    { label: '15-30 dni', value: claims.filter(c => c.inactivityDays > 14 && c.inactivityDays <= 30).length },
    { label: '30+ dni', value: claims.filter(c => c.inactivityDays > 30).length },
  ], [claims]);

  useEffect(() => {
    // FIX: Use (window as any) to access global ApexCharts and avoid TypeScript errors
    if (chartRef.current && (window as any).ApexCharts) {
      const options = {
        series: [{
          name: 'Liczba szkód',
          data: aging.map(a => a.value)
        }],
        chart: {
          type: 'bar',
          height: 300,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        plotOptions: {
          bar: {
            borderRadius: 10,
            distributed: true,
            horizontal: true,
          }
        },
        colors: ['#10b981', '#fbbf24', '#f87171', '#991b1b'],
        dataLabels: { enabled: false },
        xaxis: {
          categories: aging.map(a => a.label),
          labels: { style: { colors: '#94a3b8', fontWeight: 600 } }
        },
        grid: { borderColor: '#f1f5f9' },
        legend: { show: false }
      };

      // FIX: Use (window as any) to access global ApexCharts constructor
      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [aging]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<PlusCircle className="text-indigo-500" size={20} />} label="NOWE SZKODY" value={stats.news} subLabel="+ W TYM TYG" />
        <StatCard icon={<CheckCircle2 className="text-emerald-500" size={20} />} label="ZAMKNIĘTE" value={stats.closed} subLabel="SUKCES ZESPOŁU" />
        <StatCard icon={<PauseCircle className="text-amber-500" size={20} />} label="STAGNACJA" value={stats.stagnant} subLabel="WYMAGA UWAGI" />
        <StatCard icon={<Clock className="text-slate-500" size={20} />} label="W TOKU" value={stats.inProgress} subLabel="ODNOTOWANO RUCH" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">STRUKTURA AGING (BEZRUCHU)</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Podział portfela według dni braku aktywności</p>
          </div>
          <div ref={chartRef}></div>
        </div>

        <div className="lg:col-span-5 bg-[#2D3192] p-10 rounded-[32px] text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
          <Clock className="absolute -top-10 -right-10 text-white/5 w-64 h-64 rotate-12" />
          <div>
            <h2 className="text-3xl font-black mb-4 leading-tight uppercase">Kondycja Portfela</h2>
            <p className="text-indigo-100/80 text-sm font-medium leading-relaxed max-w-[280px]">
              W tym tygodniu zamknięto {stats.closed} spraw, co stanowi {stats.closedPercent}% całego analizowanego portfela.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-[24px]">
              <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest mb-1">ŚR. BEZRUCH</p>
              <p className="text-2xl font-black">{stats.avgInactivity} dni</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-[24px]">
              <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest mb-1">ZAKOŃCZONO</p>
              <p className="text-2xl font-black">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subLabel }: any) => (
  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
    <div className="flex justify-between items-start mb-6">
      <div className="bg-slate-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{subLabel}</span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-800">{value}</h4>
  </div>
);
