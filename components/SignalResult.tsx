import React, { useState, useRef, useEffect } from 'react';
import { AIAnalysisResult, TradeAction, TechnicalData } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateDeepResearchReport } from '../services/geminiService';

interface SignalResultProps {
  result: AIAnalysisResult;
  techData: TechnicalData | null;
  ticker: string;
}

// Helper to parse highlighted text (**text**) with Visual Connection types
const HighlightedText = ({ text, onHover }: { text: string, onHover: (type: 'news' | 'tech' | null) => void }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.replace(/\*\*/g, '');
                    let className = "font-bold mx-1 border-b-2 transition-all cursor-crosshair ";
                    let type: 'news' | 'tech' | 'general' = "general";
                    let icon = "";
                    
                    if (content.includes('[NEWS]')) {
                        className += "text-yellow-400 border-yellow-400/50 bg-yellow-400/10 px-1.5 rounded hover:bg-yellow-400/20 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)]";
                        type = "news";
                        icon = "📰 ";
                    } else if (content.includes('[TECH]')) {
                        className += "text-neon-blue border-neon-blue/50 bg-neon-blue/10 px-1.5 rounded hover:bg-neon-blue/20 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]";
                        type = "tech";
                        icon = "📈 ";
                    } else {
                         className += "text-white border-slate-500";
                    }

                    const cleanContent = content.replace('[NEWS]', '').replace('[TECH]', '').trim();

                    return (
                        <span 
                            key={i} 
                            className={className} 
                            onMouseEnter={() => onHover(type === 'general' ? null : type)}
                            onMouseLeave={() => onHover(null)}
                        >
                            {icon}{cleanContent}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

// Markdown Parser for Report
const MarkdownRenderer = ({ content }: { content: string }) => {
    if (!content) return null;
    
    return (
        <div className="space-y-4 font-sans text-xs text-slate-900 leading-relaxed">
            {content.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2"></div>;
                
                if (trimmed.startsWith('# ')) {
                    return <h1 key={idx} className="text-xl font-bold text-black border-b-2 border-slate-800 pb-1 mt-6 mb-3 uppercase tracking-wider">{trimmed.replace('# ', '')}</h1>;
                }
                if (trimmed.startsWith('## ')) {
                    return <h2 key={idx} className="text-lg font-bold text-slate-800 mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('- ')) {
                    return <div key={idx} className="flex gap-2 ml-4 mb-1"><span className="text-slate-600">•</span> <span>{parseBold(trimmed.replace('- ', ''))}</span></div>;
                }
                
                return <p key={idx} className="mb-2 text-justify">{parseBold(trimmed)}</p>;
            })}
        </div>
    );
};

// Helper to parse **bold** inside string to JSX
const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-black">{part.replace(/\*\*/g, '')}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

export const SignalResult: React.FC<SignalResultProps> = ({ result, techData, ticker }) => {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [reportContent, setReportContent] = useState<string>("");
  const [activeHighlight, setActiveHighlight] = useState<'news' | 'tech' | null>(null);
  
  const shareCardRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const isBuy = result.action === TradeAction.BUY;
  const isSell = result.action === TradeAction.SELL;
  const themeColor = isBuy ? 'neon-green' : isSell ? 'neon-red' : 'slate-400';
  const borderColor = isBuy ? 'border-neon-green' : isSell ? 'border-neon-red' : 'border-slate-600';
  
  const currentPrice = techData?.price || 0;
  const tpPercent = ((result.takeProfit - currentPrice) / currentPrice) * 100;
  const slPercent = ((result.stopLoss - currentPrice) / currentPrice) * 100;

  // --- IMAGE SHARING LOGIC ---
  const handleShareImage = async (platform: 'whatsapp' | 'telegram') => {
    if (!shareCardRef.current) return;
    
    try {
        const canvas = await html2canvas(shareCardRef.current, {
            backgroundColor: '#0a0a0f',
            scale: 2,
            useCORS: true,
            allowTaint: true,
        });
        
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const text = `🚨 NEURO_TRADE Analizi: ${ticker}\nDetaylar görselde!`;
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'signal.png', { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'neuro_trade_signal.png', { type: 'image/png' })],
                        title: `NEURO_TRADE: ${ticker}`,
                        text: text
                    });
                } catch (err: any) { 
                    // Robust cancellation handling
                    if (err.name === 'AbortError' || err.message?.match(/cancel|abort/i)) {
                        console.log('Share canceled by user');
                        return;
                    }
                    console.error('Share failed', err);
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `neuro_trade_${ticker}.png`;
                a.click();
                const shareUrl = platform === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(text)}` : `https://t.me/share/url?url=https://neurotrade.ai&text=${encodeURIComponent(text)}`;
                window.open(shareUrl, '_blank');
            }
        });
    } catch (err) { console.error("Image gen failed", err); }
  };

  // --- PDF REPORT LOGIC (HTML TO CANVAS) ---
  const handleDownloadReport = async () => {
      if (!techData) return;
      setGeneratingPdf(true);
      
      try {
          // 1. Generate Content
          const content = await generateDeepResearchReport(ticker, techData, result);
          setReportContent(content);

          // 2. Wait for Render
          setTimeout(async () => {
              if (!reportContainerRef.current) return;
              
              // 3. Capture "Page"
              const canvas = await html2canvas(reportContainerRef.current, {
                  scale: 2, // High Quality
                  useCORS: true,
                  backgroundColor: '#ffffff'
              });

              // 4. Generate PDF
              const imgData = canvas.toDataURL('image/jpeg', 0.9);
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              
              // Scale image to fit A4 width
              const imgProps = pdf.getImageProperties(imgData);
              const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
              
              let heightLeft = imgHeight;
              let position = 0;

              // Multi-page logic if content is very long
              pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;

              while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
              }

              pdf.save(`NEURO_TRADE_REPORT_${ticker}.pdf`);
              setGeneratingPdf(false);
              setReportContent(""); // Clear to hide hidden div
          }, 1000); // Give DOM time to paint

      } catch (err) {
          console.error("PDF Failed", err);
          alert("Rapor oluşturulamadı.");
          setGeneratingPdf(false);
      }
  };

  return (
    <div className={`w-full bg-[#0a0a0f] border ${borderColor} rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500 relative`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${themeColor} opacity-50 shadow-[0_0_15px_${themeColor === 'neon-green' ? '#00ff9d' : '#ff0055'}]`}></div>
      
      {/* --- FULL SCREEN LOADING OVERLAY --- */}
      {generatingPdf && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
             <div className="w-20 h-20 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-6"></div>
             <h2 className="text-2xl font-black font-mono text-white animate-pulse">RAPOR HAZIRLANIYOR</h2>
             <p className="text-slate-400 font-mono mt-2 text-sm">Derin Araştırma Protokolü Çalışıyor (Google Sentezi)...</p>
        </div>
      )}

      {/* --- HIDDEN REPORT CONTAINER FOR PDF GENERATION (A4 Width approx 794px) --- */}
      <div className={`fixed top-0 -left-[9999px] w-[794px] bg-white text-black p-10 z-[100]`} ref={reportContainerRef}>
           {/* HEADER - BLACK CARD STYLE */}
           <div className="bg-[#0a0a0f] p-8 text-white rounded-xl mb-8 border-l-8" style={{ borderColor: isBuy ? '#00ff9d' : '#ff0055' }}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <h1 className="text-4xl font-black tracking-tighter">NEURO<span className="text-neon-blue">TRADE</span></h1>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">TARİH</div>
                        <div className="font-mono text-lg">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                     <div>
                        <div className="text-sm text-slate-500 mb-1">VARLIK</div>
                        <div className="text-5xl font-bold text-neon-blue">{ticker}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">SİNYAL</div>
                        <div className={`text-4xl font-black px-4 py-1 inline-block rounded ${isBuy ? 'bg-neon-green text-black' : isSell ? 'bg-neon-red text-white' : 'bg-slate-700'}`}>
                            {result.action}
                        </div>
                     </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
                     <div>
                        <div className="text-slate-500 text-xs">GİRİŞ</div>
                        <div className="text-2xl font-bold">${techData?.price?.toLocaleString()}</div>
                     </div>
                     <div>
                        <div className="text-slate-500 text-xs">HEDEF (TP)</div>
                        <div className="text-2xl font-bold text-green-400">${result.takeProfit?.toLocaleString()}</div>
                     </div>
                     <div>
                        <div className="text-slate-500 text-xs">STOP (SL)</div>
                        <div className="text-2xl font-bold text-red-400">${result.stopLoss?.toLocaleString()}</div>
                     </div>
                </div>
           </div>

           {/* REPORT BODY */}
           <div className="bg-white">
                <MarkdownRenderer content={reportContent} />
           </div>

           {/* FOOTER */}
           <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 font-mono">
               GENERATED BY NEURO_TRADE AI PROTOCOL • NOT FINANCIAL ADVICE
           </div>
      </div>


      {/* --- HIDDEN CARD FOR IMAGE GENERATION --- */}
      <div 
        ref={shareCardRef} 
        id="share-card-content"
        className="fixed -left-[9999px] top-0 w-[600px] h-[600px] bg-[#0a0a0f] p-8 text-white font-mono flex flex-col justify-between"
        style={{ 
            border: `10px solid ${isBuy ? '#00ff9d' : isSell ? '#ff0055' : '#64748b'}`,
            boxSizing: 'border-box'
        }}
      >
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-5xl font-black tracking-tighter">NEURO<span className="text-neon-blue">TRADE</span></h1>
                <div className={`text-3xl font-bold px-6 py-2 rounded-lg ${isBuy ? 'bg-neon-green text-black' : isSell ? 'bg-neon-red text-white' : 'bg-slate-700'}`}>
                    {result.action}
                </div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <div className="text-xl text-slate-500 mb-1">VARLIK</div>
                    <div className="text-4xl text-neon-blue font-bold">{ticker}</div>
                </div>
                <div className="text-right">
                    <div className="text-xl text-slate-500 mb-1">FİYAT</div>
                    <div className="text-4xl text-white font-bold">${techData?.price?.toLocaleString()}</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0f0f13] p-6 rounded-lg border-l-4 border-neon-green">
                    <div className="text-slate-400 text-lg mb-2">TAKE PROFIT</div>
                    <div className="text-4xl text-white font-bold">${result.takeProfit.toLocaleString()}</div>
                    <div className="text-green-500 mt-1">
                        Hedef: {(tpPercent > 0 ? '+' : '') + tpPercent.toFixed(2)}%
                    </div>
                </div>
                <div className="bg-[#0f0f13] p-6 rounded-lg border-l-4 border-neon-red">
                    <div className="text-slate-400 text-lg mb-2">STOP LOSS</div>
                    <div className="text-4xl text-white font-bold">${result.stopLoss.toLocaleString()}</div>
                    <div className="text-red-500 mt-1">
                        Risk: {(slPercent > 0 ? '+' : '') + slPercent.toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="bg-[#0f0f13] p-4 rounded text-slate-300 text-sm border-t border-slate-800">
                <span className="text-neon-blue font-bold">AI REASONING: </span>
                {result.reasoning.substring(0, 180)}...
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-4">
              <div className="text-xs text-slate-600">
                  CONFIDENCE: %{result.confidence} | R/R: {result.riskReward}
              </div>
              <div className="text-xs text-slate-600 font-bold">
                  GENERATED BY NEURO_TRADE AI
              </div>
          </div>
      </div>
      {/* -------------------------------------- */}

      <div className="p-6 md:p-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
                <h2 className="text-5xl font-black font-mono text-white tracking-tighter">{ticker}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${techData?.trend4h === 'UP' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 'bg-slate-800 text-slate-400'}`}>
                        {techData?.trend4h === 'UP' ? 'TREND: BULLISH' : 'TREND: WEAK'}
                    </span>
                    <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        AI ENGINE: V10.2 (VISUAL)
                    </span>
                    {techData && !techData.pivotPoints.isValid && (
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 font-mono animate-pulse">
                            ⚠️ PIVOT İSTİKRARSIZ (ATR YEDEK DEVREDE)
                        </span>
                    )}
                </div>
            </div>
            {techData && (
                <div className={`bg-slate-900/50 p-2 rounded border transition-all duration-300 ${activeHighlight === 'tech' ? 'border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.2)]' : 'border-slate-800'} text-right w-full md:w-auto`}>
                    <div className="text-[9px] text-slate-500 uppercase font-mono mb-1">LIVE SENTIMENT (COMPOSITE)</div>
                    <div className="flex items-center justify-end gap-2">
                        <div className={`text-lg font-bold font-mono ${techData.globalSentiment.value > 50 ? 'text-neon-green' : 'text-neon-red'}`}>{techData.globalSentiment.value}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">{techData.globalSentiment.classification}</div>
                    </div>
                </div>
            )}
        </div>

        {/* DECISION & TRADING TICKET */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className={`lg:col-span-1 border border-dashed ${borderColor} bg-${themeColor}/5 p-6 text-center rounded flex flex-col justify-center items-center`}>
                <div className="text-xs font-mono text-slate-500 uppercase mb-2">SİNYAL KARARI</div>
                <div className={`text-6xl font-black tracking-tighter ${isBuy ? 'text-neon-green' : isSell ? 'text-neon-red' : 'text-slate-400'}`}>
                    {result.action}
                </div>
                <div className={`text-xs font-bold font-mono mt-2 px-3 py-1 rounded bg-black/50 border ${borderColor}`}>
                     {isBuy ? '▲ LONG (YÜKSELİŞ)' : isSell ? '▼ SHORT (DÜŞÜŞ)' : 'BEKLEME'}
                </div>
                <div className="text-[10px] font-mono opacity-50 mt-2 tracking-widest">CONFIDENCE: {result.confidence}%</div>
            </div>

            <div className={`lg:col-span-2 bg-slate-900/40 border rounded p-6 relative overflow-hidden transition-all duration-300 ${activeHighlight === 'tech' ? 'border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.2)]' : 'border-slate-800'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-800/20 to-transparent pointer-events-none"></div>
                <div className="absolute top-2 right-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Smart Order Ticket</div>
                
                <div className="grid grid-cols-3 gap-6 mt-2 relative z-10">
                    <div className="col-span-3 flex justify-center mb-4 border-b border-slate-800 pb-4">
                         <div className="text-center">
                            <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">GÜNCEL FİYAT</div>
                            <div className="text-4xl font-black font-mono text-white tracking-tight text-shadow-glow">
                                ${techData?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </div>
                         </div>
                    </div>

                    <div className="flex flex-col justify-center border-r border-slate-800 pr-6">
                         <div className="text-[10px] text-neon-green font-mono uppercase mb-1">🎯 Take Profit</div>
                         <div className="text-2xl font-bold font-mono text-white tracking-tight">${result.takeProfit.toLocaleString()}</div>
                         <div className="text-[10px] font-mono text-green-400/70">
                             {tpPercent > 0 ? '+' : ''}{tpPercent.toFixed(2)}%
                         </div>
                    </div>
                    <div className="flex flex-col justify-center border-r border-slate-800 pr-6">
                         <div className="text-[10px] text-neon-red font-mono uppercase mb-1">🛑 Stop Loss</div>
                         <div className="text-2xl font-bold font-mono text-white tracking-tight">${result.stopLoss.toLocaleString()}</div>
                         <div className="text-[10px] font-mono text-red-400/70">
                             {slPercent > 0 ? '+' : ''}{slPercent.toFixed(2)}%
                         </div>
                    </div>
                    <div className="flex flex-col justify-center pl-2">
                        <div className="text-[10px] text-blue-400 font-mono uppercase mb-1">⚖️ Risk / Reward</div>
                        <div className="text-2xl font-black font-mono text-white tracking-tight">{result.riskReward}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- REASONING --- */}
        <div className="bg-slate-900/40 p-4 rounded border-l-2 border-slate-700 mb-6 relative overflow-hidden">
            <h3 className="text-xs font-mono text-neon-blue mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></span>
                AI ANALİZ & TEKNİK GÖRÜŞ (V10.2)
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[9px] px-2 py-0.5 rounded transition-all ${activeHighlight === 'news' ? 'bg-yellow-400 text-black font-bold' : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'}`}>
                    📰 HABER FAKTÖRÜ
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded transition-all ${activeHighlight === 'tech' ? 'bg-neon-blue text-black font-bold' : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30'}`}>
                    📈 TEKNİK FAKTÖR
                </span>
            </div>
            <p className="text-sm font-mono text-slate-300 leading-relaxed text-justify whitespace-pre-line">
                <HighlightedText text={result.reasoning} onHover={setActiveHighlight} />
            </p>
        </div>

        {/* --- NEWS SECTION (EXPANDED) --- */}
        <div className={`mb-6 bg-slate-900/20 p-5 rounded border relative transition-all duration-300 ${activeHighlight === 'news' ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-slate-800'}`}>
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <div>
                    <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">KAPSAMLI PİYASA GÜNDEMİ</h3>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">Google Search Protokolü (En az 10 Kaynak)</div>
                </div>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {result.newsHeadlines && result.newsHeadlines.length > 0 ? (
                    result.newsHeadlines.map((headline, idx) => (
                        <div key={idx} className="group bg-slate-900/50 p-3 rounded border border-slate-800 hover:border-slate-600 transition-colors flex items-start gap-3">
                            <span className="text-neon-blue mt-0.5 text-xs">●</span>
                            <span className="text-xs text-slate-300 font-mono leading-relaxed group-hover:text-white transition-colors">{headline}</span>
                        </div>
                    ))
                ) : (
                     <div className="text-xs text-slate-600 italic font-mono p-4 text-center">Önemli bir haber akışı tespit edilemedi.</div>
                )}
            </div>
        </div>

        {/* SOURCES & SHARE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
            <div className="space-y-3">
                 <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">KAYNAK DİZİNİ (Google Index)</h3>
                 <div className="flex flex-wrap gap-2">
                    {result.sources && result.sources.length > 0 ? (
                        result.sources.map((source, i) => (
                            <a key={i} href={source.url} target="_blank" rel="noreferrer" className="text-[9px] bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 px-2 py-1 rounded transition-colors truncate max-w-[200px]">
                                {source.title}
                            </a>
                        ))
                    ) : (
                        <div className="text-[9px] text-slate-600 italic">Doğrudan kaynak bağlantısı bulunamadı (Özet analiz).</div>
                    )}
                 </div>
            </div>
            
            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2 md:items-end">
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleDownloadReport} 
                        disabled={generatingPdf}
                        className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono text-[10px] px-4 py-3 rounded uppercase transition-all flex items-center justify-center gap-2"
                    >
                        {generatingPdf ? (
                            <span className="animate-pulse">HAZIRLANIYOR...</span>
                        ) : (
                            <>📄 RAPOR İNDİR (PDF)</>
                        )}
                    </button>
                    <button onClick={() => handleShareImage('whatsapp')} className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold font-mono text-[10px] px-4 py-3 rounded uppercase transition-all flex items-center justify-center gap-2">
                        📱 WhatsApp
                    </button>
                    <button onClick={() => handleShareImage('telegram')} className="flex-1 md:flex-none bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold font-mono text-[10px] px-4 py-3 rounded uppercase transition-all flex items-center justify-center gap-2">
                        ✈️ Telegram
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};