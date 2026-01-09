
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Claim, AdvisorKPI } from '../types';
import { Copy, Check, TrendingUp, TrendingDown, Activity, Target, FileText, Info } from 'lucide-react';

interface Props {
  claims: Claim[];
  fullComparison: Claim[];
  prevClaims: Claim[];
  advisorKPIs: AdvisorKPI[];
}

export const ManagementReport: React.FC<Props> = ({ claims, fullComparison, prevClaims, advisorKPIs }) => {
  const [copied, setCopied] = useState(false);
  const chartRef = useRef(null);

  const metrics = useMemo(() => {
    const currentActiveCount = claims.length;
    const prevActiveCount = prevClaims.length;
    const changePct = prevActiveCount > 0 ? Math.round(((currentActiveCount - prevActiveCount) / prevActiveCount) * 100) : 0;
    const news = fullComparison.filter(c => c.comparisonStatus === 'NOWA').length;
    const closed = fullComparison.filter(c => c.comparisonStatus === 'ZAMKNIĘTA').length;
    const throughput = news > 0 ? (closed / news).toFixed(2) : closed > 0 ? closed.toFixed(2) : "0.00";
    const stagnantCount = fullComparison.filter(c => c.comparisonStatus === 'STAGNACJA').length;
    const stagnantPct = currentActiveCount > 0 ? Math.round((stagnantCount / currentActiveCount) * 100) : 0;
    const topCloser = advisorKPIs[0]?.name || "Brak danych";

    return { currentActiveCount, changePct, news, closed, throughput, stagnantPct, topCloser, hasPrev: prevClaims.length > 0 };
  }, [claims, fullComparison, prevClaims, advisorKPIs]);

  useEffect(() => {
    if (chartRef.current && (window as any).ApexCharts && advisorKPIs.length > 0) {
      const options = {
        series: [
          { name: 'Nowe', data: advisorKPIs.map(a => a.newCount) },
          { name: 'Zamknięte', data: advisorKPIs.map(a => a.closedCount) }
        ],
        chart: { type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6 } },
        colors: ['#818cf8', '#10b981'],
        dataLabels: { enabled: false },
        xaxis: { categories: advisorKPIs.map(a => a.name), labels: { style: { colors: '#94a3b8', fontWeight: 700 } } },
        yaxis: { labels: { style: { colors: '#cbd5e1' } } },
        grid: { borderColor: '#f1f5f9' },
        legend: { position: 'top', horizontalAlign: 'right', fontWeight: 800, markers: { radius: 12 } }
      };
      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [advisorKPIs]);

  const reportText = `Raport operacyjny zespołu - ${new Date().toLocaleDateString('pl-PL')}
1. Wolumen: ${metrics.currentActiveCount} (zmiana ${metrics.changePct}%).
2. Flow: Nowe: ${metrics.news} | Zamknięte: ${metrics.closed} | Throughput: ${metrics.throughput}.
3. Jakość: Stagnacja stanowi ${metrics.stagnantPct}% portfela.
4. Lider: ${metrics.topCloser}.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!metrics.hasPrev) return (
    <div className="bg-amber-50 border border-amber-100 p-12 rounded-[40px] text-center max-w-2xl mx-auto mt-10">
      <Info className="mx-auto text-amber-400 mb-4" size={48} />
      <h3 className="text-xl font-black text-amber-900 mb-2 uppercase tracking-tight">Czekam na dane trendu</h3>
      <p className="text-amber-700 font-medium">Wgraj raport z zeszłego tygodnia, aby aktywować analitykę porównawczą.</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportMetric label="Zmiana Portfela" val={`${metrics.changePct}%`} sub={metrics.changePct <= 0 ? 'Spadek obciążenia' : 'Wzrost obciążenia'} icon={<Activity />} />
        <ReportMetric label="Przepustowość" val={metrics.throughput} sub="Wskaźnik Throughput" icon={<Target />} />
        <ReportMetric label="Stagnacja" val={`${metrics.stagnantPct}%`} sub="Udział w portfelu" icon={<TrendingUp />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-[#2D3192] rounded-[40px] p-10 text-white flex flex-col shadow-xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-200">Generator Raportu</h3>
              <button onClick={handleCopy} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Skopiowano' : 'Kopiuj'}
              </button>
           </div>
           <pre className="text-xs font-mono bg-black/20 p-6 rounded-2xl whitespace-pre-wrap flex-1 text-indigo-50 leading-relaxed">
             {reportText}
           </pre>
           <div className="mt-8 flex items-center gap-3 opacity-40">
              <FileText size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Dział Operacyjny NFM</span>
           </div>
        </div>

        <div className="lg:col-span-7 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
           <div className="mb-8">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sprawność Procesowa</h3>
             <p className="text-xs text-slate-400 font-medium mt-1">Zestawienie nowych vs zamkniętych spraw</p>
           </div>
           <div ref={chartRef}></div>
        </div>
      </div>
    </div>
  );
};

const ReportMetric = ({ label, val, sub, icon }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="text-indigo-600 mb-4">{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-800">{val}</h4>
    <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{sub}</p>
  </div>
);
