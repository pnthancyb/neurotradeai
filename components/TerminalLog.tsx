import React, { useEffect, useRef } from 'react';
import { ProcessLog } from '../types';

interface TerminalLogProps {
  logs: ProcessLog[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full bg-black/90 border border-slate-800 rounded-lg p-4 font-mono text-xs h-48 overflow-y-auto shadow-inner custom-scrollbar relative">
      <div className="absolute top-2 right-2 text-[10px] text-slate-600 animate-pulse">
         ● LIVE PROCESS STREAM
      </div>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex gap-3 items-center">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`
                ${log.type === 'info' ? 'text-blue-400' : ''}
                ${log.type === 'success' ? 'text-neon-green' : ''}
                ${log.type === 'warning' ? 'text-yellow-400' : ''}
                ${log.type === 'error' ? 'text-neon-red' : ''}
                flex-1 truncate
                `}>
                {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : '›'} {log.message}
                </span>
                
                {/* Percentage Text */}
                {log.progress !== undefined && (
                    <span className={`text-[10px] font-bold ${log.progress === 100 ? 'text-neon-green' : 'text-neon-blue'}`}>
                        {log.progress === 100 ? 'DONE' : `%${log.progress}`}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {log.progress !== undefined && log.progress < 100 && (
                <div className="ml-[5.5rem] mt-1 h-1 w-48 bg-slate-800 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-neon-blue shadow-[0_0_10px_#00f3ff]"
                        style={{ width: `${log.progress}%`, transition: 'width 0.2s ease-out' }}
                    ></div>
                </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};