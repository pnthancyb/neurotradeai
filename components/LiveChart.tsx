import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketData } from '../types';

interface LiveChartProps {
  data: MarketData[];
  color: string;
}

export const LiveChart: React.FC<LiveChartProps> = ({ data, color }) => {
  return (
    <div className="w-full h-64 bg-panel-bg rounded-lg border border-slate-800 p-4 relative overflow-hidden">
        <div className="absolute top-2 left-4 z-10">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Canlı Piyasa Akışı</h3>
        </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            tick={false} 
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            tick={{fontSize: 10, fill: '#64748b', fontFamily: 'monospace'}}
            tickFormatter={(val) => `$${val.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: color }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Fiyat']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};