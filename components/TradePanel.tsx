import React from 'react';
import { TradeAction, Portfolio } from '../types';

interface TradePanelProps {
  portfolio: Portfolio;
  currentPrice: number;
  lastAction: TradeAction;
  isAutoTrading: boolean;
  toggleAuto: () => void;
  resetPortfolio: () => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ 
  portfolio, 
  currentPrice, 
  lastAction, 
  isAutoTrading, 
  toggleAuto,
  resetPortfolio
}) => {
  const portfolioValue = portfolio.cash + (portfolio.shares * currentPrice);
  const pnl = portfolioValue - portfolio.history[0]; // Assuming history[0] is initial
  const pnlPercent = (pnl / portfolio.history[0]) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Balance Card */}
      <div className="bg-panel-bg p-6 rounded-lg border border-slate-800 flex flex-col justify-between">
        <div>
          <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">Toplam Varlık</h3>
          <div className="text-4xl font-mono font-bold text-white tracking-tighter">
            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm font-mono mt-2 ${pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
          </div>
        </div>
        <div className="mt-6 flex gap-4 text-xs font-mono text-slate-500">
           <div>
             <span className="block text-slate-600">Nakit</span>
             <span className="text-slate-300">${portfolio.cash.toFixed(2)}</span>
           </div>
           <div>
             <span className="block text-slate-600">Varlıklar</span>
             <span className="text-slate-300">{portfolio.shares.toFixed(4)} Adet</span>
           </div>
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-panel-bg p-6 rounded-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
        
        {isAutoTrading && (
            <div className="absolute top-0 right-0 p-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-blue"></span>
                </span>
            </div>
        )}

        <div>
            <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">Nöral Çekirdek Kontrolü</h3>
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleAuto}
                    className={`flex-1 py-3 px-4 rounded font-bold font-mono text-sm tracking-wider transition-all duration-200 ${
                        isAutoTrading 
                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                >
                    {isAutoTrading ? 'SİSTEM AKTİF' : 'SİSTEMİ BAŞLAT'}
                </button>
                <button 
                    onClick={resetPortfolio}
                    className="px-4 py-3 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-colors"
                    title="Simülasyonu Sıfırla"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/></svg>
                </button>
            </div>
        </div>

        <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-slate-500 uppercase">Son Sinyal</span>
                <span className="text-xs font-mono text-slate-600">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className={`w-full py-2 text-center font-bold font-mono tracking-widest rounded ${
                lastAction === TradeAction.BUY ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' :
                lastAction === TradeAction.SELL ? 'bg-neon-red/20 text-neon-red border border-neon-red/50' :
                'bg-slate-800 text-slate-400'
            }`}>
                {lastAction === 'BUY' ? 'AL' : lastAction === 'SELL' ? 'SAT' : 'BEKLE'}
            </div>
        </div>
      </div>
    </div>
  );
};