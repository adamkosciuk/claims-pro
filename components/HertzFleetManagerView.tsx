
import React, { useState, useMemo, useRef } from 'react';
import { Home, Upload, FileText, Mail, Trash2, Eye, Download, X, CheckCircle, Info, Loader2, Car } from 'lucide-react';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { HertzFleetRecord } from '../types.ts';

// --- KONFIGURACJA ---
const CC_MAPPING: Record<string, string[]> = {
    'bydgoszcz@hertz.pl': ['marta.gruszka@hertz.pl', 'sebastian.rogalski@hertz.pl'],
    'gdansk@hertz.pl': ['pawel.kijewski@hertz.pl', 'katarzyna.sokolowska@hertz.pl'],
    'katowice@hertz.pl': ['adam.heder@hertz.pl', 'mariusz.gajos@hertz.pl'],
    'krakow@hertz.pl': ['jolanta.szostak@hertz.pl', 'elzbieta.naturska@hertz.pl', 'jan.mucha@hertz.pl'],
    'lodz@hertz.pl': ['miroslaw.kulesza@hertz.pl', 'jedrzej.wiewiora@hertz.pl'],
    'poznan@hertz.pl': ['marta.gruszka@hertz.pl', 'bartosz.nowak@hertz.pl', 'jakub.ambrozy@hertz.pl'],
    'rzeszow@hertz.pl': ['adam.siwak@hertz.pl', 'pawel.malec@hertz.pl'],
    'szczecin@hertz.pl': ['szymon.zenel@hertz.pl', 'mateusz.kasprzyk@hertz.pl'],
    'warszawa@hertz.pl': ['erwina.stachowicz@hertz.pl', 'rafal.pydzinski@hertz.pl', 'koordynator@hertz.pl'],
    'wroclaw@hertz.pl': ['radoslaw.gruszka@hertz.pl', 'karol.teterycz@hertz.pl', 'krzysztof.gruszka@hertz.pl'],
    'wrocław@hertz.pl': ['radoslaw.gruszka@hertz.pl', 'karol.teterycz@hertz.pl', 'krzysztof.gruszka@hertz.pl'],
    'lublin@hertz.pl': ['anna.kister@hertz.pl']
};

const HEADER_KEYWORDS = {
    vehicle: ['vehicle', 'samochód', 'pojazd', 'auto', 'model', 'marka'],
    plate: ['plate', 'rejestracja', 'nr rej', 'nr. rej', 'nr.rej', 'nr_rej', 'tablica'],
    location: ['location', 'oddział', 'lokalizacja', 'miasto', 'branch'],
    locationCode: ['trip ticket punktu z', 'punktu z', 'kod punktu zwrotu', 'kod stacji', 'kod punktu'],
    action: ['action', 'akcja', 'działanie', 'status', 'typ'],
    manager: ['manager', 'kierownik', 'osoba', 'kontakt', 'contact', 'opiekun'],
    email: ['email zgłaszającego', 'email zglaszajacego', 'zgłaszający', 'zglaszajacy'],
    statusSzkody: ['status szkody', 'status naprawy'],
    hertzStatus: ['status samochodu hertz', 'status hertz', 'status auta'],
    daysFromContact: ['od kontaktu z uzytkownikiem', 'dni od kontaktu', 'kontakt z uzytkownikiem'],
    daysFromPlannedEnd: ['od planowanej daty zakończenia', 'dni od planowanej', 'planowana data zakonczenia'],
    actualRepairEnd: ['data zakończenia naprawy', 'data zakonczenia naprawy'],
    service: ['service', 'serwis', 'warsztat', 'blacharnia', 'body shop', 'dostawca'],
};

interface Props {
  onBack: () => void;
}

export const HertzFleetManagerView: React.FC<Props> = ({ onBack }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [records, setRecords] = useState<HertzFleetRecord[]>([]);
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<HertzFleetRecord[] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeString = (val: any) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  const findColumnIndex = (headerRow: any[], keywords: string[], excludeKeywords: string[] = []) => {
    if (!headerRow) return -1;
    return headerRow.findIndex(cell => {
      if (!cell) return false;
      const cellStr = String(cell).toLowerCase().trim();
      const cleanCellStr = cellStr.replace(/[.,]/g, '');
      const matchesKeyword = keywords.some(k => cleanCellStr.includes(k.replace(/[.,]/g, '')));
      const matchesExclude = excludeKeywords.length > 0 ? excludeKeywords.some(k => cellStr.includes(k)) : false;
      return matchesKeyword && !matchesExclude;
    });
  };

  const processFile = async (file: File) => {
    setStatus('PROCESSING');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      let sheetName = workbook.SheetNames.find(name => name.toUpperCase().includes('ALERT') || name.toUpperCase() === 'ALERTY');
      if (!sheetName) sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!rawData || rawData.length < 2) throw new Error("Plik jest pusty lub nie zawiera danych.");

      // Szukanie nagłówka
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rawData.length, 50); i++) {
        const rowString = rawData[i].join(' ').toLowerCase();
        if (HEADER_KEYWORDS.plate.some(k => rowString.includes(k))) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) headerIdx = 0;

      const headerRow = rawData[headerIdx];
      const idx = {
        vehicle: findColumnIndex(headerRow, HEADER_KEYWORDS.vehicle),
        plate: findColumnIndex(headerRow, HEADER_KEYWORDS.plate),
        location: findColumnIndex(headerRow, HEADER_KEYWORDS.location),
        locationCode: findColumnIndex(headerRow, HEADER_KEYWORDS.locationCode, ['nr', 'numer']),
        manager: findColumnIndex(headerRow, HEADER_KEYWORDS.manager),
        email: findColumnIndex(headerRow, HEADER_KEYWORDS.email),
        statusSzkody: findColumnIndex(headerRow, HEADER_KEYWORDS.statusSzkody),
        hertzStatus: findColumnIndex(headerRow, HEADER_KEYWORDS.hertzStatus),
        delayJ: findColumnIndex(headerRow, HEADER_KEYWORDS.daysFromContact),
        delayO: findColumnIndex(headerRow, HEADER_KEYWORDS.daysFromPlannedEnd),
        actualRepairEnd: findColumnIndex(headerRow, HEADER_KEYWORDS.actualRepairEnd, ['plan', 'dni']),
        action: findColumnIndex(headerRow, HEADER_KEYWORDS.action),
        service: findColumnIndex(headerRow, HEADER_KEYWORDS.service),
      };

      const results: HertzFleetRecord[] = [];
      for (let i = headerIdx + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // FILTRY
        if (idx.hertzStatus > -1 && safeString(row[idx.hertzStatus]).toLowerCase().includes('sprzedan')) continue;
        if (idx.statusSzkody > -1 && safeString(row[idx.statusSzkody]).toLowerCase().includes('zamknięt')) continue;
        if (idx.actualRepairEnd > -1 && row[idx.actualRepairEnd]) continue;

        const emailVal = idx.email > -1 ? safeString(row[idx.email]).toLowerCase() : '';
        const isHertz = emailVal.endsWith('@hertz.pl');
        const isMarcel = emailVal === 'marcel.marciniak@nfm.com.pl';
        if (!emailVal || (!isHertz && !isMarcel)) continue;

        let delay = 0;
        if (idx.delayJ > -1) delay = Math.max(delay, parseInt(row[idx.delayJ]) || 0);
        if (idx.delayO > -1) delay = Math.max(delay, parseInt(row[idx.delayO]) || 0);
        if (delay <= 0) continue;

        results.push({
          id: `hertz-${i}-${Math.random().toString(36).substr(2, 5)}`,
          location: idx.location > -1 ? safeString(row[idx.location]) || 'Oddział' : 'Oddział',
          locationCode: idx.locationCode > -1 ? safeString(row[idx.locationCode]) || 'N/A' : 'N/A',
          managerName: idx.manager > -1 ? safeString(row[idx.manager]) || 'Kierownik' : 'Kierownik',
          email: emailVal,
          vehicleModel: idx.vehicle > -1 ? safeString(row[idx.vehicle]) || 'Auto' : 'Auto',
          // Corrected from idx.licensePlate to idx.plate as defined in the idx object
          licensePlate: idx.plate > -1 ? safeString(row[idx.plate]) || 'BRAK' : 'BRAK',
          actionType: idx.action > -1 ? safeString(row[idx.action]) || 'Pilny kontakt' : 'Pilny kontakt',
          serviceCenterName: idx.service > -1 ? safeString(row[idx.service]) || 'Serwis' : 'Serwis',
          daysPending: delay,
          originalRow: row,
          originalHeader: headerRow
        });
      }

      if (results.length === 0) throw new Error("Nie znaleziono rekordów wymagających akcji.");
      setRecords(results);
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('ERROR');
    }
  };

  const groups = useMemo(() => {
    const map: Record<string, HertzFleetRecord[]> = {};
    records.forEach(r => {
      if (!map[r.email]) map[r.email] = [];
      map[r.email].push(r);
    });
    return Object.entries(map).map(([email, recs]) => ({
      email,
      manager: recs[0].managerName,
      location: recs[0].location,
      records: recs
    }));
  }, [records]);

  const handleDownloadEML = (recs: HertzFleetRecord[]) => {
    const main = recs[0];
    const subject = `Aktualizacja statusów napraw blacharskich ${recs.length} zgłoszeń - ${main.location}`;
    const defaultCC = 'malgorzata.opalka@hertz.pl';
    const additionalCC = CC_MAPPING[main.email.toLowerCase()] || [];
    const cc = [defaultCC, ...additionalCC].join('; ');

    const vehiclesList = recs.map(r => `- ${r.licensePlate} | ${r.actionType} | ${r.serviceCenterName}`).join('\n');
    const body = `Dzień dobry,\n\nPrzesyłam aktualne zestawienie pojazdów z Państwa oddziału, które wymagają pilnych działań logistystycznych (przekroczone terminy serwisu). Będę wdzięczny za sprawdzenie ich statusu.\n\nLista pojazdów:\n${vehiclesList}\n\nProszę o informację zwrotną na adres mailowy: szkody@nfm.com.pl\n\nPozdrawiam,\nDział Szkód NFM`;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([main.originalHeader, ...recs.map(r => r.originalRow)]);
    XLSX.utils.book_append_sheet(wb, ws, "Alerty");
    const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    const boundary = `----=_NextPart_${Date.now()}`;
    const attName = `Raport_Hertz_${main.location.replace(/\s+/g, '_')}.xlsx`;

    const eml = [
      `To: ${main.email}`, `Cc: ${cc}`, `Subject: ${subject}`, 'X-Unsent: 1',
      `Content-Type: multipart/mixed; boundary="${boundary}"`, '',
      `--${boundary}`, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', body, '',
      `--${boundary}`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="${attName}"`,
      'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${attName}"`, '', excelBase64, '',
      `--${boundary}--`
    ].join('\r\n');

    saveAs(new Blob([eml], { type: 'message/rfc822' }), `Raport_${main.location}.eml`);
    setSentEmails(prev => new Set(prev).add(main.email));
    setSelectedGroup(null);
  };

  const reset = () => {
    setRecords([]);
    setStatus('IDLE');
    setSentEmails(new Set());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] p-10">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-600 transition-all">
              <Home size={20} />
           </button>
           <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Hertz Fleet Action</h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Zarządzanie logistyką i alertami logistycznymi</p>
           </div>
        </div>
        {status === 'SUCCESS' && (
          <button onClick={reset} className="flex items-center gap-2 bg-rose-50 text-rose-500 px-5 py-3 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">
            <Trash2 size={16} /> Wyczyść sesję
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        {status === 'IDLE' && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-amber-200 relative group overflow-hidden shadow-sm">
             <input type="file" ref={fileInputRef} onChange={e => e.target.files && processFile(e.target.files[0])} accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
             <div className="bg-amber-50 w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Car className="text-amber-600" size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Wgraj raport alertów Hertz</h3>
             <p className="text-slate-400 text-sm font-medium">System przefiltruje oddziały i wygeneruje paczki .eml</p>
          </div>
        )}

        {status === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100">
            <Loader2 className="text-amber-600 animate-spin mb-6" size={48} />
            <h3 className="text-xl font-black text-slate-800 uppercase">Analizuję flotę...</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Stosuję filtry: Status, Sprzedaż, Opóźnienia</p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="bg-rose-50 border border-rose-100 p-10 rounded-[40px] text-center">
            <h3 className="text-xl font-black text-rose-600 uppercase mb-2">Błąd Przetwarzania</h3>
            <p className="text-rose-700/70 font-medium mb-6">{errorMsg}</p>
            <button onClick={reset} className="bg-white text-rose-600 px-8 py-4 rounded-2xl text-xs font-black uppercase border border-rose-200">Spróbuj ponownie</button>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#1e293b] p-8 rounded-[40px] text-white flex justify-between items-center shadow-xl">
               <div>
                 <h4 className="text-2xl font-black uppercase mb-1">Alertów do wysłania: {records.length}</h4>
                 <div className="flex gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                   <span>Oddziały: {groups.length}</span>
                   <span className="text-amber-400">Wysłano: {sentEmails.size}</span>
                 </div>
               </div>
               <div className="bg-amber-500 p-3 rounded-2xl text-slate-900 font-black text-xs uppercase shadow-lg shadow-amber-500/20">
                 Wymagana akcja .eml
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map(group => (
                <div key={group.email} className={`bg-white p-8 rounded-[32px] border transition-all ${sentEmails.has(group.email) ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}`}>
                   <div className="flex justify-between items-start mb-6">
                      <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400">
                        {sentEmails.has(group.email) ? <CheckCircle className="text-emerald-500" /> : <Mail />}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{group.records.length} spraw</span>
                   </div>
                   <h3 className="text-lg font-black text-slate-800 uppercase mb-1 truncate">{group.manager}</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-tighter">{group.location}</p>
                   <p className="text-[11px] font-medium text-slate-500 mb-8 truncate">{group.email}</p>
                   
                   <button 
                    onClick={() => setSelectedGroup(group.records)}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${sentEmails.has(group.email) ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-amber-600'}`}
                   >
                     {sentEmails.has(group.email) ? 'Generuj ponownie' : 'Generuj .eml'}
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL PODGLĄDU HERTZ */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedGroup(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase">Podgląd Hertz E-mail</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Draft wiadomości do oddziału {selectedGroup[0].location}</p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-2 text-slate-300 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100 flex gap-4 text-amber-800">
                <Info size={24} className="shrink-0" />
                <p className="text-[11px] font-medium leading-relaxed">
                  Zostanie wygenerowany plik <strong>.eml</strong> gotowy do otwarcia w Outlooku. Do wiadomości automatycznie dołączymy odfiltrowany arkusz Excel z listą <strong>{selectedGroup.length}</strong> aut.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Do:</span>
                  <span className="col-span-3 text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl">{selectedGroup[0].email}</span>
                </div>
                <div className="grid grid-cols-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Pojazdy:</span>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {selectedGroup.slice(0, 5).map(r => (
                      <span key={r.id} className="bg-slate-100 text-[9px] font-black px-2 py-1 rounded-md text-slate-600">{r.licensePlate}</span>
                    ))}
                    {selectedGroup.length > 5 && <span className="text-[9px] font-black text-slate-400">+{selectedGroup.length-5} więcej</span>}
                  </div>
                </div>
                <div className="border-t pt-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Załącznik:</p>
                   <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                     <FileText className="text-emerald-600" />
                     <span className="text-xs font-bold text-emerald-800">Raport_Hertz_{selectedGroup[0].location}.xlsx</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-10 pt-0 flex gap-4">
              <button onClick={() => setSelectedGroup(null)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Anuluj</button>
              <button 
                onClick={() => handleDownloadEML(selectedGroup)}
                className="flex-[2] bg-amber-500 text-slate-900 py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} /> Pobierz .eml i wyślij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
