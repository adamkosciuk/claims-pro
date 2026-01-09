
import React, { useEffect, useRef } from 'react';
import { AdvisorKPI } from '../types';

interface Props {
  data: AdvisorKPI[];
}

export const AdvisorAnalysis: React.FC<Props> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-black text-slate-800 uppercase leading-none">Ranking Wydajności Zespołu</h3>
             <p className="text-xs text-slate-400 font-medium mt-1">Doradcy posortowani według liczby zamkniętych spraw</p>
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Doradca</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Aktywne</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Stojące</th>
              <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase text-center">ZAMKNIĘTE 🎉</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Efektywność</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((kpi) => (
              <tr key={kpi.name} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-700">{kpi.name}</td>
                <td className="px-8 py-5 text-center font-bold text-indigo-600">{kpi.openCount}</td>
                <td className="px-8 py-5 text-center">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${kpi.stagnantCount > 5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                    {kpi.stagnantCount}
                   </span>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className="text-lg font-black text-emerald-600">{kpi.closedCount}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-[10px] font-black text-slate-400">{100 - kpi.overduePercent}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: `${100 - kpi.overduePercent}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {data.slice(0, 3).map(advisor => (
           <AdvisorPieCard key={advisor.name} advisor={advisor} />
         ))}
      </div>
    </div>
  );
};

const AdvisorPieCard = ({ advisor }: { advisor: AdvisorKPI }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (chartRef.current && (window as any).ApexCharts) {
      const options = {
        series: [advisor.openCount - advisor.stagnantCount, advisor.stagnantCount],
        chart: { type: 'donut', height: 180 },
        labels: ['W toku', 'Stagnacja'],
        colors: ['#10b981', '#f43f5e'],
        dataLabels: { enabled: false },
        legend: { show: false },
        plotOptions: {
          pie: {
            donut: {
              size: '75%',
              labels: {
                show: true,
                name: { show: false },
                value: { fontSize: '14px', fontWeight: '900', color: '#1e293b' },
                total: { show: true, label: 'Suma', formatter: () => advisor.openCount }
              }
            }
          }
        }
      };
      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [advisor]);

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 flex flex-col items-center text-center shadow-sm">
       <h4 className="font-black text-slate-800 uppercase mb-4 text-xs tracking-widest">{advisor.name}</h4>
       <div ref={chartRef} className="w-full"></div>
       <div className="mt-4">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Zdrowie Portfela</p>
         <p className="text-xl font-black text-emerald-500">{100 - advisor.overduePercent}% OK</p>
       </div>
    </div>
  );
};
