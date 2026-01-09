import React, { useEffect, useRef } from 'react';
import { HistoryPoint } from '../types';

interface Props {
  data: HistoryPoint[];
}

export const HistoricalTrend: React.FC<Props> = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // FIX: Use (window as any) to access global ApexCharts and avoid TypeScript errors
    if (chartRef.current && (window as any).ApexCharts) {
      const options = {
        series: [{
          name: 'Liczba szkód',
          data: data.map(d => d.count)
        }],
        chart: {
          type: 'area',
          height: 400,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        colors: ['#2D3192'],
        stroke: { curve: 'smooth', width: 4 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 }
        },
        xaxis: {
          categories: data.map(d => d.date),
          labels: { style: { colors: '#94a3b8', fontWeight: 700 } }
        },
        yaxis: {
          labels: { style: { colors: '#cbd5e1' } }
        },
        grid: { borderColor: '#f1f5f9' },
        dataLabels: { enabled: false }
      };

      // FIX: Use (window as any) to access global ApexCharts constructor
      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [data]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="mb-10">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">OBRAZ TRENDU HISTORYCZNEGO</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Łączna liczba aktywnych zleceń we wszystkich wgranych raportach</p>
        </div>
        <div ref={chartRef}></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2D3192] p-8 rounded-[32px] text-white">
           <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Maksymalne obciążenie</p>
           <h4 className="text-4xl font-black">{Math.max(...data.map(d => d.count), 0)}</h4>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col justify-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Punkty pomiarowe</p>
           <h4 className="text-4xl font-black text-slate-800">{data.length}</h4>
        </div>
      </div>
    </div>
  );
};
