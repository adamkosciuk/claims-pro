
import React, { useState } from 'react';
import { Home, Upload, FileSpreadsheet, Mail, Trash2, Eye, Download, X, CheckCircle, Package, Info, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { NfmServiceReport } from '../types.ts';

interface Props {
  onBack: () => void;
}

export const NfmDispatcherView: React.FC<Props> = ({ onBack }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [items, setItems] = useState<NfmServiceReport[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<NfmServiceReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sanitizeFileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '_');

  const processFile = async (file: File) => {
    setStatus('PROCESSING');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames.includes('Alerty') ? 'Alerty' : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawData || rawData.length < 2) throw new Error("Plik jest pusty lub ma błędny format.");

      const headerRow = rawData[0];
      const dataRows = rawData.slice(1);
      
      const dateCols: number[] = [];
      headerRow.forEach((h, i) => {
        if (typeof h === 'string' && /data|date/i.test(h)) dateCols.push(i);
      });

      const serviceMap = new Map<string, any[][]>();
      const emailMap = new Map<string, string>();

      dataRows.forEach(row => {
        const name = row[0]; // Serwis w kolumnie A
        if (name) {
          const key = String(name);
          if (!serviceMap.has(key)) serviceMap.set(key, []);
          serviceMap.get(key)!.push(row);
          if (!emailMap.has(key) && row[1]) emailMap.set(key, String(row[1]));
        }
      });

      const results: NfmServiceReport[] = [];
      serviceMap.forEach((rows, name) => {
        const safeName = sanitizeFileName(name);
        const email = emailMap.get(name) || "brak-email@nfm.pl";
        
        const newWb = XLSX.utils.book_new();
        const newWs = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
        
        if(dateCols.length > 0) {
          const range = XLSX.utils.decode_range(newWs['!ref'] || 'A1');
          for(let R = range.s.r + 1; R <= range.e.r; ++R) {
            for(const C of dateCols) {
              const cell = newWs[XLSX.utils.encode_cell({r:R, c:C})];
              if(cell && cell.t === 'n') cell.z = 'dd"."mm"."yyyy';
            }
          }
        }
        
        XLSX.utils.book_append_sheet(newWb, newWs, "Alerty");
        const excelArray = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const excelBase64 = XLSX.write(newWb, { bookType: 'xlsx', type: 'base64' });

        const body = `Szanowni Państwo,\n\nw załączeniu przesyłamy cykliczny raport aktywnych zleceń, jakie zostały do Państwa wysłane z NFM.\n\nZgodnie z warunkami umowy, prosimy o uzupełnienie wszystkich posiadanych danych, informacji oraz dokumentacji do sprawy na platformie autoryzacyjnej pod adresem: https://serwis.infm.pl/, ewentualnie udzielenie odpowiedzi na komentarze, jakie są wpisane przez pracowników NFM a nie udzieliliście Państwo na nie odpowiedzi.\n\nProsimy pamiętać, że w przypadku wystawienia faktury za naprawę, jest ona dla nas niezbędna w celu rozliczenia się z Państwem za wykonaną usługę oraz Klientem.\n\nW przypadku pytań, prosimy o kontakt.\n\nPozdrawiamy,\nDział Likwidacji Szkód NFM`;

        results.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          count: rows.length,
          fileName: `${safeName}.xlsx`,
          excelBlob,
          excelBase64,
          subject: "Raport zaległych zleceń na platformie NFM",
          body
        });
      });

      setItems(results);
      setStatus('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus('ERROR');
    }
  };

  const generateEML = (item: NfmServiceReport) => {
    const boundary = `----=_NextPart_${Date.now()}`;
    const eml = [
      `To: ${item.email}`,
      `Subject: ${item.subject}`,
      `X-Unsent: 1`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      "",
      item.body.replace(/\n/g, "\r\n"),
      "",
      `--${boundary}`,
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="${item.fileName}"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="${item.fileName}"`,
      "",
      item.excelBase64,
      "",
      `--${boundary}--`
    ].join("\r\n");
    return new Blob([eml], { type: 'message/rfc822' });
  };

  const handleQuickSend = (item: NfmServiceReport) => {
    saveAs(generateEML(item), `Raport_${sanitizeFileName(item.name)}.eml`);
    setSentIds(prev => new Set(prev).add(item.id));
  };

  const downloadAllZip = async () => {
    const zip = new JSZip();
    items.forEach(i => zip.file(i.fileName, i.excelBlob));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, "Raporty_NFM_Paczka.zip");
  };

  const reset = () => {
    setItems([]);
    setStatus('IDLE');
    setSentIds(new Set());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] p-10">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
              <Home size={20} />
           </button>
           <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">NFM Dispatcher</h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Generator i dispatcher raportów serwisowych</p>
           </div>
        </div>
        {status === 'SUCCESS' && (
          <button onClick={reset} className="flex items-center gap-2 bg-rose-50 text-rose-500 px-5 py-3 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all group">
            <Trash2 size={16} /> Resetuj Sesję
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        {status === 'IDLE' && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 relative group overflow-hidden">
             <input type="file" onChange={e => e.target.files && processFile(e.target.files[0])} accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
             <div className="bg-indigo-50 w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Upload className="text-indigo-600" size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Wgraj główny plik Excel</h3>
             <p className="text-slate-400 text-sm font-medium">System automatycznie podzieli dane według kolumny Serwis</p>
             <div className="mt-10 flex gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
               <span className="flex items-center gap-1"><FileSpreadsheet size={14}/> .xlsx</span>
               <span className="flex items-center gap-1"><Mail size={14}/> .eml generation</span>
               <span className="flex items-center gap-1"><Package size={14}/> Auto-zip</span>
             </div>
          </div>
        )}

        {status === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
            <Loader2 className="text-indigo-600 animate-spin mb-6" size={48} />
            <h3 className="text-xl font-black text-slate-800 uppercase">Dzielenie arkuszy...</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Przygotowujemy raporty dla każdego serwisu</p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="bg-rose-50 border border-rose-100 p-10 rounded-[40px] text-center">
            <h3 className="text-xl font-black text-rose-600 uppercase mb-2">Błąd Przetwarzania</h3>
            <p className="text-rose-700/70 font-medium mb-6">{errorMsg}</p>
            <button onClick={reset} className="bg-white text-rose-600 px-8 py-4 rounded-2xl text-xs font-black uppercase border border-rose-200 hover:bg-rose-600 hover:text-white transition-all">Spróbuj ponownie</button>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#2D3192] p-8 rounded-[40px] text-white flex justify-between items-center shadow-xl shadow-indigo-100 overflow-hidden relative">
               <Package className="absolute -right-10 -top-10 text-white/5 w-64 h-64 rotate-12" />
               <div className="relative z-10">
                 <h4 className="text-2xl font-black uppercase mb-1">Gotowe do wysyłki</h4>
                 <div className="flex gap-6 text-indigo-200 text-[10px] font-black uppercase tracking-widest">
                   <span>Serwisy: {items.length}</span>
                   <span className="text-emerald-400">Wysłano: {sentIds.size}</span>
                 </div>
               </div>
               <button onClick={downloadAllZip} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl text-xs font-black uppercase hover:bg-indigo-50 transition-all flex items-center gap-2 relative z-10 shadow-lg">
                 <Download size={18} /> Pobierz wszystko (ZIP)
               </button>
            </div>

            <div className="grid gap-4">
              {items.map(item => (
                <div key={item.id} className={`bg-white p-6 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${sentIds.has(item.id) ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 hover:shadow-md'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-black text-slate-800 uppercase">{item.name}</h4>
                      {sentIds.has(item.id) ? (
                        <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle size={10} /> Wysłano
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                          {item.count} rekordów
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Mail size={12}/> {item.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => saveAs(item.excelBlob, item.fileName)}
                      className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
                      title="Pobierz Excel"
                    >
                      <FileSpreadsheet size={18} />
                    </button>
                    <button 
                      onClick={() => setSelectedItem(item)}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                      title="Podgląd maila"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleQuickSend(item)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${sentIds.has(item.id) ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-[#2D3192] text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                    >
                      <Download size={16} /> Generuj .eml
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL PODGLĄDU */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase">Podgląd Wiadomości</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tak będzie wyglądał mail w Outlooku</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3 text-indigo-700">
                <Info size={20} className="shrink-0" />
                <p className="text-[11px] font-medium leading-relaxed">
                  Pliki <strong>.eml</strong> otwierają się bezpośrednio w Twoim programie pocztowym (Outlook, Thunderbird) jako nowa wiadomość z załączonym raportem Excel.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Odbiorca:</span>
                  <span className="col-span-3 text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-lg">{selectedItem.email}</span>
                </div>
                <div className="grid grid-cols-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Temat:</span>
                  <span className="col-span-3 text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-lg">{selectedItem.subject}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Treść:</span>
                  <div className="text-xs font-medium text-slate-600 bg-slate-50 p-6 rounded-3xl h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedItem.body}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                  <FileSpreadsheet className="text-emerald-600" size={16} />
                  <span className="text-[10px] font-black text-emerald-800 uppercase">{selectedItem.fileName}</span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-3">
              <button onClick={() => setSelectedItem(null)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Zamknij</button>
              <button 
                onClick={() => handleQuickSend(selectedItem)}
                className="flex-[2] bg-[#2D3192] text-white py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} /> Pobierz plik .eml
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
