
import React, { useMemo, useEffect, useRef } from 'react';
import { Claim } from '../types';
import { Package, Clock, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  history: Claim[];
}

export const MonthlyComparison: React.FC<Props> = ({ history }) => {
  const chartRef = useRef(null);

  const monthlyData = useMemo(() => {
    if (history.length === 0) return [];
    const dates = Array.from(new Set<string>(history.map(c => c.importDate))).sort();
    const monthsMap = new Map<string, string>();
    dates.forEach(date => {
      const monthKey = date.substring(0, 7);
      monthsMap.set(monthKey, date);
    });

    return Array.from(monthsMap.entries()).map(([monthKey, lastDate]) => {
      const claimsInMonth = history.filter(c => c.importDate === lastDate);
      const total = claimsInMonth.length;
      const stagnantCount = claimsInMonth.filter(c => c.inactivityDays > 7).length;
      const avgInactivity = total > 0 ? Math.round(claimsInMonth.reduce((acc, c) => acc + c.inactivityDays, 0) / total) : 0;
      
      return {
        month: monthKey,
        volume: total,
        avgInactivity,
        efficiency: total > 0 ? Math.round(100 - (stagnantCount / total * 100)) : 0
      };
    });
  }, [history]);

  useEffect(() => {
    if (chartRef.current && (window as any).ApexCharts && monthlyData.length > 0) {
      const options = {
        series: [
          { name: 'Wolumen', type: 'column', data: monthlyData.map(m => m.volume) },
          { name: 'Śr. Bezruch', type: 'line', data: monthlyData.map(m => m.avgInactivity) }
        ],
        chart: { height: 400, type: 'line', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        stroke: { width: [0, 4], curve: 'smooth' },
        colors: ['#e2e8f0', '#2D3192'],
        dataLabels: { enabled: false },
        labels: monthlyData.map(m => m.month),
        yaxis: [
          { title: { text: 'Wolumen', style: { color: '#94a3b8', fontWeight: 900 } } },
          { opposite: true, title: { text: 'Dni Bezruchu', style: { color: '#2D3192', fontWeight: 900 } } }
        ],
        grid: { borderColor: '#f1f5f9' },
        legend: { position: 'top', fontWeight: 800 }
      };
      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [monthlyData]);

  if (monthlyData.length < 1) return null;

  const current = monthlyData[monthlyData.length - 1];
  const previous = monthlyData[monthlyData.length - 2] || current;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MoMCard title="Wolumen" val={current.volume} diff={current.volume - previous.volume} icon={<Package />} suffix="szkód" />
        <MoMCard title="Bezruch" val={current.avgInactivity} diff={current.avgInactivity - previous.avgInactivity} icon={<Clock />} suffix="dni" inverse />
        <MoMCard title="Efficiency" val={current.efficiency} diff={current.efficiency - previous.efficiency} icon={<ShieldCheck />} suffix="%" />
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="mb-10">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Analiza Długofalowa</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Ewolucja portfela i wskaźników SLA na osi czasu</p>
        </div>
        <div ref={chartRef}></div>
      </div>
    </div>
  );
};

const MoMCard = ({ title, val, diff, icon, suffix, inverse = false }: any) => {
  const isPositive = diff > 0;
  const isGood = inverse ? !isPositive : isPositive;
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">{icon}</div>
        {diff !== 0 && (
          <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(diff)}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-3xl font-black text-slate-800">{val}</h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">{suffix}</span>
      </div>
    </div>
  );
};
