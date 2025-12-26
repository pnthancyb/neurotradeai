import React, { useState, useEffect, useRef } from 'react';
import { AIAnalysisResult, ProcessLog, TechnicalData, ScannerCoin } from './types';
import { analyzeMarket } from './services/geminiService';
import { getTechnicalAnalysis, getTopOpportunities, enrichScannerWithAI } from './services/marketService';
import { SignalResult } from './components/SignalResult';
import { TerminalLog } from './components/TerminalLog';
import { MarketScanner } from './components/MarketScanner';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'scanner'>('home');
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [techData, setTechData] = useState<TechnicalData | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Scanner State
  const [scannerCoins, setScannerCoins] = useState<ScannerCoin[]>([]);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [aiSupervisorActive, setAiSupervisorActive] = useState(false);

  const addLog = (message: string, type: ProcessLog['type'] = 'info', progress?: number) => {
    const id = Date.now().toString() + Math.random();
    setLogs(prev => [...prev, {
      id,
      message,
      type,
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      progress
    }]);
    return id;
  };

  const updateLog = (id: string, updates: Partial<ProcessLog>) => {
      setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  };

  // Run Scanner
  useEffect(() => {
    if (activeTab === 'scanner' && scannerCoins.length === 0) {
        setScannerLoading(true);
        setAiSupervisorActive(false);
        
        getTopOpportunities()
            .then(data => {
                setScannerCoins(data);
                // Trigger AI Supervisor immediately after math scan
                setAiSupervisorActive(true);
                return enrichScannerWithAI(data);
            })
            .then(enrichedData => {
                setScannerCoins(enrichedData);
            })
            .catch(err => console.error(err))
            .finally(() => {
                setScannerLoading(false);
                setAiSupervisorActive(false);
            });
    }
  }, [activeTab]);

  const runAnalysis = async (symbol: string) => {
    setLoading(true);
    setResult(null);
    setTechData(null);
    setError(null);
    setLogs([]); 
    
    addLog(`Sistem başlatılıyor: Hedef ${symbol.toUpperCase()}`, 'info');
    
    try {
        // Step 1: Get Hard Data
        const fetchLogId = addLog('Binance Multi-Timeframe Verisi Çekiliyor...', 'info', 0);
        
        updateLog(fetchLogId, { progress: 30 });
        await new Promise(r => setTimeout(r, 600));
        updateLog(fetchLogId, { progress: 80 });

        const data = await getTechnicalAnalysis(symbol);
        updateLog(fetchLogId, { progress: 100, type: 'success', message: 'Veri Çekme Tamamlandı' });
        
        setTechData(data);

        if (data.isSimulation) {
            addLog('⚠️ API Limit: Simülasyon Verisi Aktif', 'warning');
        } else {
            addLog(`✅ Fiyat: $${data.price?.toFixed(2)} | RSI: ${data.rsi}`, 'success');
        }
        
        // Step 2: Google Search Grounding (Haberler)
        const newsLogId = addLog('Google Haber Protokolü: Global Veri Taranıyor...', 'info', 0);
        await new Promise(r => setTimeout(r, 800));
        updateLog(newsLogId, { progress: 100, type: 'success', message: 'Haber İndeksi Oluşturuldu' });

        // Step 3: Google Search Social Grounding (Eski Nitter yerine)
        const socialLogId = addLog('Google Sosyal İstihbarat: Reddit & Twitter İndeksi...', 'warning', 0);
        await new Promise(r => setTimeout(r, 600));
        updateLog(socialLogId, { progress: 100, type: 'success', message: 'Topluluk Duyarlılığı Analiz Edildi' });

        // Step 4: Gemini Analysis
        const geminiLogId = addLog('Nöral Ağ Başlatıldı: Karar Veriliyor...', 'info', 0);
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1; 
            if (progress > 95) progress = 95; 
            updateLog(geminiLogId, { progress });
        }, 300);
        
        const analysis = await analyzeMarket(symbol.toUpperCase(), data);
        
        clearInterval(progressInterval);
        
        updateLog(geminiLogId, { progress: 100, type: 'success', message: 'Analiz Tamamlandı' });

        addLog(`Sinyal Kararı: ${analysis.action}`, 'success');
        setResult(analysis);

    } catch (err: any) {
        const errMsg = err.message || "Bilinmeyen Hata";
        setError(errMsg);
        addLog(`KRİTİK HATA: ${errMsg}`, 'error');
        clearInterval((window as any).progressInterval); 
    } finally {
        setLoading(false);
    }
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    runAnalysis(ticker);
  };

  const handleScannerSelect = (symbol: string) => {
      setTicker(symbol);
      setActiveTab('home');
      runAnalysis(symbol);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 font-sans flex flex-col items-center p-4 relative overflow-y-auto overflow-x-hidden">
      
      <div className="absolute inset-0 cyber-grid z-0 pointer-events-none opacity-40 fixed"></div>
      <div className="absolute inset-0 scanline animate-scan z-50 pointer-events-none fixed"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8 my-8">
        
        {/* Header */}
        <div className="text-center group cursor-default">
            <h1 className="text-6xl font-black font-mono tracking-tighter text-white mb-2 glitch-effect">
                NEURO<span className="text-neon-blue">TRADE</span>
            </h1>
            <p className="text-slate-500 font-mono text-xs tracking-[0.4em] uppercase">
                OTONOM TEKNİK ANALİZ PROTOKOLÜ V9.0
            </p>
        </div>

        {/* TABS */}
        <div className="flex gap-4 p-1 bg-slate-900/80 rounded-lg border border-slate-800">
            <button 
                onClick={() => setActiveTab('home')}
                className={`px-6 py-2 rounded font-mono text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-slate-400 hover:text-white'}`}
            >
                SİNYAL ÜRETİCİ
            </button>
            <button 
                onClick={() => setActiveTab('scanner')}
                className={`px-6 py-2 rounded font-mono text-sm font-bold transition-all ${activeTab === 'scanner' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-slate-400 hover:text-white'}`}
            >
                MARKET TARAYICI
            </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'home' ? (
             <>
                {/* Input Area */}
                <form onSubmit={handleAnalyzeSubmit} className="w-full max-w-2xl relative">
                    <div className="flex items-stretch shadow-[0_0_50px_rgba(0,243,255,0.15)] transition-shadow hover:shadow-[0_0_50px_rgba(0,243,255,0.3)]">
                        <div className="bg-panel-bg border-y border-l border-slate-700 rounded-l-lg px-6 flex items-center justify-center">
                            <span className="text-neon-blue font-bold font-mono text-xl">PROMPT_</span>
                        </div>
                        <input 
                            type="text" 
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="VARLIK GİRİN (ÖRN: PEPE)"
                            className="flex-1 bg-panel-bg text-white font-mono text-xl py-6 px-4 border-y border-slate-700 focus:outline-none focus:border-neon-blue focus:text-neon-blue placeholder-slate-700 uppercase transition-colors"
                            disabled={loading}
                        />
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-neon-blue hover:bg-white text-black font-bold font-mono text-lg px-8 border-y border-r border-neon-blue rounded-r-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(0,243,255,0.8)]"
                        >
                            {loading ? '...' : 'ÇALIŞTIR'}
                        </button>
                    </div>
                </form>

                {/* LOG TERMINAL */}
                {logs.length > 0 && (
                    <div className="w-full max-w-2xl">
                        <TerminalLog logs={logs} />
                    </div>
                )}

                {/* RESULT CARD */}
                {result && techData && (
                    <div className="w-full max-w-3xl">
                        <SignalResult result={result} techData={techData} ticker={ticker.toUpperCase()} />
                    </div>
                )}
             </>
        ) : (
            <MarketScanner 
                coins={scannerCoins} 
                onSelectCoin={handleScannerSelect} 
                isLoading={scannerLoading} 
                isAiThinking={aiSupervisorActive}
            />
        )}

      </div>
      
      {/* Footer */}
      <div className="fixed bottom-4 text-[9px] text-slate-700 font-mono text-center w-full pointer-events-none">
         SYS.STATUS: ONLINE • GEMINI 3 PRO SUPERVISOR • V9.1
      </div>
    </div>
  );
};

export default App;