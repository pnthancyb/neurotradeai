import React, { useState } from 'react';
import { AIAnalysisResult, TradeAction } from '../types';

interface AnalysisLogProps {
  analysis: AIAnalysisResult | null;
  isThinking: boolean;
  ticker: string;
}

export const AnalysisLog: React.FC<AnalysisLogProps> = ({ analysis, isThinking, ticker }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!analysis) return;
    const text = `🚨 NEURO_TRADE SİNYALİ 🚨\n\nVarlık: ${ticker}\nİşlem: ${analysis.action === 'BUY' ? 'AL' : analysis.action === 'SELL' ? 'SAT' : 'BEKLE'}\nGüven: %${analysis.confidence}\nAnaliz: ${analysis.reasoning}\n\n#Kripto #YapayZeka #Trade`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isThinking) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 bg-panel-bg rounded-lg border border-slate-800 opacity-80">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-neon-blue text-sm animate-pulse text-center">
            Yahoo Finance Protokolü Çalışıyor...<br/>
            Haber Duyarlılığı Taranıyor...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-panel-bg rounded-lg border border-slate-800 text-slate-600 font-mono text-sm text-center">
        Sistem Boşta.<br/>Başlamak için bir Coin girin veya Sistemi Başlatın.
      </div>
    );
  }

  const sentimentColor = analysis.sentimentScore > 0.3 ? 'text-neon-green' : analysis.sentimentScore < -0.3 ? 'text-neon-red' : 'text-slate-400';

  return (
    <div className="h-full bg-panel-bg rounded-lg border border-slate-800 p-4 font-mono text-sm overflow-y-auto max-h-[400px]">
      <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-2">
        <div>
           <h3 className="text-slate-400 text-xs uppercase tracking-widest">Mantık Çekirdeği Çıktısı</h3>
           <div className="text-neon-blue text-xs mt-1 font-bold">{ticker}</div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Güven</span>
                <span className="text-neon-blue font-bold text-lg">%{analysis.confidence}</span>
            </div>
            <button 
                onClick={handleShare}
                className="text-[10px] uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
                {copied ? 'KOPYALANDI!' : 'SİNYALİ PAYLAŞ'}
            </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
            <span className="text-xs text-slate-500 uppercase block mb-1">Teknik Analiz (Simülasyon)</span>
            <p className="text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-3">
                {analysis.reasoning}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <span className="text-xs text-slate-500 uppercase block mb-1">Duyarlılık</span>
                <span className={`font-bold ${sentimentColor}`}>
                    {analysis.sentimentScore > 0 ? "BOĞA" : analysis.sentimentScore < 0 ? "AYI" : "NÖTR"} 
                    <span className="text-xs ml-1 opacity-70">({analysis.sentimentScore})</span>
                </span>
            </div>
             <div>
                <span className="text-xs text-slate-500 uppercase block mb-1">İşlem</span>
                <span className={`font-bold ${
                    analysis.action === TradeAction.BUY ? 'text-neon-green' : 
                    analysis.action === TradeAction.SELL ? 'text-neon-red' : 'text-slate-400'
                }`}>
                    {analysis.action === 'BUY' ? 'AL' : analysis.action === 'SELL' ? 'SAT' : 'BEKLE'}
                </span>
            </div>
        </div>

        <div>
            <span className="text-xs text-slate-500 uppercase block mb-2">Önemli Başlıklar</span>
            <ul className="space-y-2">
                {analysis.newsHeadlines && analysis.newsHeadlines.length > 0 ? (
                    analysis.newsHeadlines.map((headline, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                            <span className="text-neon-blue">›</span>
                            {headline}
                        </li>
                    ))
                ) : (
                    <li className="text-xs text-slate-600 italic">Haber başlığı bulunamadı.</li>
                )}
            </ul>
        </div>

        {analysis.sources && analysis.sources.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
                 <span className="text-xs text-slate-500 uppercase block mb-2">Kaynaklar</span>
                 <ul className="space-y-1">
                    {analysis.sources.map((source, idx) => (
                        <li key={idx}>
                             <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-neon-blue hover:underline flex items-center gap-2"
                             >
                                <span className="opacity-70">🔗</span> {source.title}
                             </a>
                        </li>
                    ))}
                 </ul>
            </div>
        )}
      </div>
    </div>
  );
};