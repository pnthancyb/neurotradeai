import React from 'react';
import { ScannerCoin } from '../types';

interface MarketScannerProps {
  coins: ScannerCoin[];
  onSelectCoin: (symbol: string) => void;
  isLoading: boolean;
  isAiThinking?: boolean;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ coins, onSelectCoin, isLoading, isAiThinking }) => {
  if (isLoading) {
    return (
        <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
             <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
             <div className="text-neon-blue font-mono animate-pulse">BINANCE AĞI TARANIYOR...</div>
             <div className="text-xs text-slate-500 font-mono">NEURO_QUANT V6 Algoritması Çalışıyor...</div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-3xl font-black font-mono text-white tracking-tighter">
                PİYASA <span className="text-neon-blue">TARAYICI</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
                    MATH: NEURO_QUANT V6 (HİPER-BOYUTLU)
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono border flex items-center gap-1 ${isAiThinking ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 animate-pulse' : 'bg-purple-900/20 text-purple-400 border-purple-500/30'}`}>
                   {isAiThinking ? (
                       <>⏳ AMİR (GEMINI 3 FLASH): GOOGLE & X-RAY TARANIYOR...</>
                   ) : (
                       <>⚡ AMİR: GOOGLE SEARCH & X-RAY AKTİF</>
                   )}
                </span>
            </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono text-right hidden md:block">
            KRİTERLER: BOLLINGER SQUEEZE & WHALE VOLUME<br/>
            SADECE USDT ÇİFTLERİ
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coins.map((coin, index) => (
            <div 
                key={coin.symbol}
                onClick={() => onSelectCoin(coin.symbol)}
                className={`group relative bg-[#0a0a0f] border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    coin.aiPick 
                    ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)]' 
                    : 'border-slate-800 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]'
                }`}
            >
                {/* AI Pick Glow & Badge */}
                {coin.aiPick && (
                    <>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/20 to-transparent pointer-events-none"></div>
                        <div className="absolute top-3 right-3 flex flex-col items-end">
                             <span className="text-[10px] font-black font-mono bg-yellow-500 text-black px-2 py-0.5 rounded shadow-lg animate-pulse">
                                 ★ AMİR ONAYLI
                             </span>
                        </div>
                    </>
                )}
                
                {/* Rank & Score */}
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold font-mono text-sm border ${
                        coin.score >= 90 ? 'bg-neon-green/20 text-neon-green border-neon-green' :
                        coin.score >= 70 ? 'bg-blue-500/20 text-blue-400 border-blue-500' :
                        'bg-slate-800 text-slate-400 border-slate-600'
                    }`}>
                        {coin.score}
                    </div>
                    <span className={`text-xl font-mono font-bold ${coin.aiPick ? 'text-yellow-400' : 'text-white'} group-hover:text-neon-blue transition-colors`}>
                        {coin.symbol.replace('USDT', '')}
                    </span>
                </div>

                {/* AI NOTE */}
                {coin.aiNote && (
                    <div className="mb-3 mt-2 text-[10px] font-mono text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded italic">
                        "{coin.aiNote}"
                    </div>
                )}

                <div className="space-y-1 mb-3 pt-2 border-t border-slate-800/50">
                    <div className="flex justify-between text-sm font-mono">
                        <span className="text-slate-500">Fiyat:</span>
                        <span className="text-slate-200">${coin.price < 1 ? coin.price.toFixed(6) : coin.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                        <span className="text-slate-500">24s Değ:</span>
                        <span className={`${coin.change24h >= 0 ? 'text-neon-green' : 'text-neon-red'} font-bold`}>
                            %{coin.change24h.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                        <span className="text-slate-500">Hacim:</span>
                        <span className="text-slate-400">${(coin.volume / 1000000).toFixed(1)}M</span>
                    </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                    {coin.tags.map(tag => (
                        <span key={tag} className="text-[9px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                            {tag}
                        </span>
                    ))}
                    <span className="ml-auto text-[9px] text-neon-blue border border-neon-blue/30 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        ANALİZ ET ›
                    </span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};