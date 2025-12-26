
export enum TradeAction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD'
}

export interface TechnicalData {
  rsi: number;
  stochRsi: number;
  sma20: number;
  sma50: number;
  sma200: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  price?: number;
  isSimulation?: boolean;
  atr: number;
  adx: number;
  
  // Extended Oscillators
  cci: number;
  williamsR: number;
  momentum: number;
  
  // Market Sentiment (External API)
  globalSentiment: {
    value: number;
    classification: string;
  };

  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    lower: number;
    middle: number;
  };
  // Calculated Levels
  pivotPoints: {
    r3: number;
    r2: number;
    r1: number;
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    isValid: boolean;
  };
  trend4h: 'UP' | 'DOWN' | 'FLAT';
}

export interface TwitterIntel {
    author: string;
    content: string;
    date: string;
    link: string;
}

export interface AIAnalysisResult {
  action: TradeAction;
  confidence: number;
  reasoning: string;
  sentimentScore: number;
  newsHeadlines: string[];
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  technicalLevels?: {
      support: string;
      resistance: string;
  };
  sources?: { title: string; url: string }[];
  xRayAnalysis?: {
      triggered: boolean;
      dataCount: number;
      topBuzzWords: string[];
  };
}

export interface ProcessLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  progress?: number;
}

export interface TickerConfig {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
}

export interface MarketData {
  timestamp: string;
  price: number;
}

export interface Portfolio {
  cash: number;
  shares: number;
  history: number[];
}

export interface ScannerCoin {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  score: number;
  tags: string[];
  // AI Supervisor Fields
  aiPick?: boolean;
  aiNote?: string;
}