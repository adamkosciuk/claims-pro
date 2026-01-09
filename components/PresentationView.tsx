
import React from 'react';
import { Home, Play, Sparkles, LayoutDashboard, MonitorPlay, Video, Send, Car, CheckCircle2 } from 'lucide-react';

interface Props {
  onBack: () => void;
  onStartLiveShowcase: () => void;
}

export const PresentationView: React.FC<Props> = ({ onBack, onStartLiveShowcase }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] p-10">
      <header className="max-w-7xl mx-auto flex justify-between items-center p-10 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Home size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Slide Room</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Generator materiałów prezentacyjnych</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto text-center py-20">
        <div className="bg-white p-16 rounded-[60px] border border-slate-100 shadow-2xl shadow-indigo-100/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="bg-indigo-600 w-24 h-24 rounded-[32px] flex items-center justify-center mb-10 shadow-xl shadow-indigo-200">
                <Video className="text-white" size={40} />
              </div>
              
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-6">Nagraj Prawdziwe Demo</h1>
              <p className="text-slate-400 font-medium text-lg max-w-lg mx-auto mb-12 leading-relaxed">
                Uruchom tryb autopilota, który przejdzie przez wszystkie <strong>rzeczywiste moduły aplikacji</strong>. Wszystko, co zobaczysz na filmie, to żywe dane i autentyczny interfejs.
              </p>

              <button 
                onClick={onStartLiveShowcase}
                className="group relative flex items-center gap-4 bg-[#2D3192] text-white px-12 py-6 rounded-[32px] text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-indigo-200"
              >
                <MonitorPlay size={24} className="group-hover:scale-125 transition-transform" />
                Uruchom Live UI Showcase
              </button>

              <div className="mt-20 grid grid-cols-3 gap-8 w-full">
                <ShowcaseStep icon={<LayoutDashboard size={20}/>} label="Likwidacja" />
                <ShowcaseStep icon={<Send size={20}/>} label="Dispatcher" />
                <ShowcaseStep icon={<Car size={20}/>} label="Hertz Fleet" />
              </div>
           </div>
        </div>

        <div className="mt-12 bg-amber-50 p-8 rounded-[40px] border border-amber-100 flex items-center gap-6 text-left max-w-2xl mx-auto">
           <div className="bg-white p-4 rounded-3xl shadow-sm text-amber-500"><Sparkles size={32}/></div>
           <div>
             <p className="text-sm font-black text-amber-900 uppercase">Wskazówka Inżynierska</p>
             <p className="text-xs text-amber-700 font-medium">Upewnij się, że masz wgraną bazę danych (kilka raportów), aby wykresy w demo wyglądały okazale. Film nagrany na "żywym organizmie" buduje 10x większe zaufanie u Zarządu.</p>
           </div>
        </div>
      </main>
    </div>
  );
};

const ShowcaseStep = ({ icon, label }: any) => (
  <div className="flex flex-col items-center gap-3">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">{icon}</div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);
