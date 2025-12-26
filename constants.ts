import { TickerConfig } from './types';

export const INITIAL_CAPITAL = 10000;

export const SUPPORTED_TICKERS: TickerConfig[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', basePrice: 125.00, volatility: 0.02 },
  { symbol: 'BTC-USD', name: 'Bitcoin', basePrice: 65000.00, volatility: 0.035 },
  { symbol: 'TSLA', name: 'Tesla Inc', basePrice: 175.00, volatility: 0.025 },
  { symbol: 'AAPL', name: 'Apple Inc', basePrice: 180.00, volatility: 0.012 },
];

export const MOCK_NEWS_QUERIES = {
  'NVDA': 'NVIDIA stock news AI chip demand',
  'BTC-USD': 'Bitcoin price crypto regulation news',
  'TSLA': 'Tesla stock EV market news',
  'AAPL': 'Apple stock iPhone sales news',
};

// Technical Analysis Constants
export const RSI_PERIOD = 14;
export const MAX_HISTORY_POINTS = 50;