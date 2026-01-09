
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Home, Scale, TrendingUp, AlertTriangle, DollarSign, BarChart3, Info } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const LegalAnalysisView: React.FC<Props> = ({ onBack }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState({
    claimValue: 50000,
    courtFee: 2500,
    legalCosts: 3600,
    evidenceStrength: 70, // 0-100
    precedentScore: 60,   // 0-100
    expertComplexity: 2,  // 1-5
  });

  const analysis = useMemo(() => {
    const baseWinProb = (params.evidenceStrength * 0.6) + (params.precedentScore * 0.4);
    const penalty = params.expertComplexity * 3;
    const finalWinProb = Math.max(5, Math.min(95, baseWinProb - penalty)) / 100;
    
    const totalCosts = params.courtFee + params.legalCosts + (params.expertComplexity * 1000);
    const ev = (params.claimValue * finalWinProb) - (totalCosts * (1 - finalWinProb));
    const roi = (ev / totalCosts) * 100;

    let recommendation: 'SETTLE' | 'LITIGATE' | 'ABANDON' = 'ABANDON';
    if (roi > 150 && finalWinProb > 0.6) recommendation = 'LITIGATE';
    else if (roi > 50) recommendation = 'SETTLE';

    return { winProb: finalWinProb, ev, roi, recommendation, totalCosts };
  }, [params]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 100; i += 5) {
      const x = (params.claimValue * (i/100)) - analysis.totalCosts;
      const dist = Math.exp(-Math.pow(i - analysis.winProb*100, 2) / 400);
      data.push({ x: Math.round(x), prob: parseFloat(dist.toFixed(4)) });
    }
    return data;
  }, [params, analysis]);

  useEffect(() => {
    if (chartRef.current && (window as any).ApexCharts && chartData.length > 0) {
      const options = {
        series: [{
          name: 'Prawdopodobieństwo',
          data: chartData.map(d => ({ x: d.x, y: d.prob }))
        }],
        chart: {
          type: 'area',
          height: 300,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#10b981'] },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [20, 100]
          }
        },
        xaxis: {
          type: 'numeric',
          title: { text: 'Wynik Finansowy (PLN)', style: { fontSize: '10px', fontWeight: 800, color: '#94a3b8' } },
          labels: { style: { colors: '#94a3b8', fontWeight: 700 } }
        },
        yaxis: {
          show: false
        },
        grid: { borderColor: '#f1f5f9' },
        tooltip: {
          theme: 'light',
          x: { formatter: (val: number) => `${val.toLocaleString()} PLN` }
        }
      };

      const chart = new (window as any).ApexCharts(chartRef.current, options);
      chart.render();
      return () => chart.destroy();
    }
  }, [chartData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] p-10">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
              <Home size={20} />
           </button>
           <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Analiza Regresów</h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Silnik predykcji rentowności prawnej</p>
           </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl flex items-center gap-3">
          <Scale size={20} />
          <span className="text-[11px] font-black uppercase tracking-widest">Model Predykcyjny v2.4</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 size={14} /> Parametry Sprawy
            </h3>
            
            <div className="space-y-6">
              <InputRange label="Wartość Roszczenia" value={params.claimValue} min={1000} max={200000} step={1000} 
                onChange={(v: number) => setParams({...params, claimValue: v})} suffix="PLN" />
              
              <InputRange label="Siła Materiału Dowodowego" value={params.evidenceStrength} min={0} max={100} 
                onChange={(v: number) => setParams({...params, evidenceStrength: v})} suffix="%" />
              
              <InputRange label="Lokalna Linia Orzecznicza" value={params.precedentScore} min={0} max={100} 
                onChange={(v: number) => setParams({...params, precedentScore: v})} suffix="%" />

              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block mb-3">Złożoność Opinii Biegłego</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button 
                      key={v}
                      onClick={() => setParams({...params, expertComplexity: v})}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${params.expertComplexity === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex gap-4 shadow-sm">
            <Info className="text-amber-500 shrink-0" size={20} />
            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
              Model uwzględnia statystyczne ryzyko zmiany sędziego oraz średni koszt instancyjny w sprawach o podobnej wartości przedmiotu sporu.
            </p>
          </div>
        </aside>

        <main className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResultCard label="Win Probability" value={`${Math.round(analysis.winProb * 100)}%`} 
              sub="Szansa na wygraną" color="text-emerald-600" />
            <ResultCard label="Expected Value (EV)" value={`${Math.round(analysis.ev)} PLN`} 
              sub="Wartość oczekiwana" color="text-indigo-600" />
            <ResultCard label="Legal ROI" value={`${Math.round(analysis.roi)}%`} 
              sub="Zwrot z kosztów" color={analysis.roi > 100 ? 'text-emerald-600' : 'text-amber-600'} />
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Symulacja Wyniku Finansowego</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Rozkład prawdopodobieństwa zysku/straty netto</p>
              </div>
              <RecommendationBadge recommendation={analysis.recommendation} />
            </div>

            <div ref={chartRef} className="w-full"></div>
          </div>

          <div className="bg-[#2D3192] p-10 rounded-[40px] text-white relative overflow-hidden shadow-xl shadow-indigo-100/20">
             <DollarSign className="absolute -top-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                   <h4 className="text-2xl font-black uppercase mb-2 leading-none">Próg Opłacalności</h4>
                   <p className="text-indigo-100/70 text-sm font-medium mt-2">Musisz wygrać minimum <span className="text-white font-black">{Math.round((analysis.totalCosts / params.claimValue) * 100)}%</span> spraw o tych parametrach, aby wyjść na zero.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/10 text-center">
                   <p className="text-[10px] font-black text-indigo-200 uppercase mb-1">Całkowite Koszty</p>
                   <p className="text-3xl font-black">{analysis.totalCosts} PLN</p>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const InputRange = ({ label, value, min, max, step = 1, onChange, suffix }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{label}</label>
      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{value}{suffix}</span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} value={value} 
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
    />
  </div>
);

const ResultCard = ({ label, value, sub, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className={`text-2xl font-black ${color} mb-1`}>{value}</h4>
    <p className="text-[10px] font-bold text-slate-300 uppercase leading-none">{sub}</p>
  </div>
);

const RecommendationBadge = ({ recommendation }: { recommendation: string }) => {
  const configs = {
    LITIGATE: { text: 'Idź do sądu', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    SETTLE: { text: 'Rekomendowana ugoda', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    ABANDON: { text: 'Wysokie ryzyko', color: 'bg-rose-50 text-rose-600 border-rose-100' }
  };
  const config = configs[recommendation as keyof typeof configs] || configs.ABANDON;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase ${config.color}`}>
      {config.text}
    </div>
  );
};
