import { TechnicalData, ScannerCoin } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const BINANCE_API_MAIN = 'https://api.binance.com/api/v3';
const BINANCE_API_BACKUP = 'https://data-api.binance.vision/api/v3';
const SENTIMENT_API = 'https://api.alternative.me/fng/';
const PROXY_URL = 'https://corsproxy.io/?'; 

async function fetchWithFallback(endpoint: string, params: string = '') {
    const queryString = params ? `?${params}` : '';
    const urls = [
        `${BINANCE_API_BACKUP}${endpoint}${queryString}`,
        `${BINANCE_API_MAIN}${endpoint}${queryString}`,
        `${PROXY_URL}${encodeURIComponent(`${BINANCE_API_MAIN}${endpoint}${queryString}`)}`
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); 
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) return await res.json();
        } catch (e) {
            continue;
        }
    }
    throw new Error("All connection methods failed");
}

const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(data.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const calculateEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  let emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
};

const calculateStandardDeviation = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const sma = calculateSMA(data, period);
  const slice = data.slice(data.length - period);
  const squaredDiffs = slice.map(val => Math.pow(val - sma, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  return Math.sqrt(avgSquaredDiff);
};

export const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14): number => {
    if(highs.length < period) return 0;
    let trs = [];
    for(let i = 1; i < highs.length; i++) {
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i-1]);
        const lc = Math.abs(lows[i] - closes[i-1]);
        trs.push(Math.max(hl, hc, lc));
    }
    const slice = trs.slice(trs.length - period);
    return slice.reduce((a,b) => a+b, 0) / period;
};

const calculateADX = (highs: number[], lows: number[], closes: number[], period: number = 14): number => {
    if (highs.length < period * 2) return 25;
    const smooth = (prev: number, curr: number) => (prev * (period - 1) + curr) / period;
    let trs = [], plusDMs = [], minusDMs = [];

    for(let i = 1; i < highs.length; i++) {
        const upMove = highs[i] - highs[i-1];
        const downMove = lows[i-1] - lows[i];
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i-1]);
        const lc = Math.abs(lows[i] - closes[i-1]);
        trs.push(Math.max(hl, hc, lc));
        plusDMs.push((upMove > downMove && upMove > 0) ? upMove : 0);
        minusDMs.push((downMove > upMove && downMove > 0) ? downMove : 0);
    }

    let trSmoothed = trs.slice(0, period).reduce((a,b)=>a+b,0);
    let plusDMSmoothed = plusDMs.slice(0, period).reduce((a,b)=>a+b,0);
    let minusDMSmoothed = minusDMs.slice(0, period).reduce((a,b)=>a+b,0);
    let adxValues = [];

    for(let i = period; i < trs.length; i++) {
        trSmoothed = smooth(trSmoothed, trs[i]);
        plusDMSmoothed = smooth(plusDMSmoothed, plusDMs[i]);
        minusDMSmoothed = smooth(minusDMSmoothed, minusDMs[i]);
        const plusDI = 100 * plusDMSmoothed / trSmoothed;
        const minusDI = 100 * minusDMSmoothed / trSmoothed;
        const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI);
        adxValues.push(dx);
    }
    return adxValues.length === 0 ? 25 : adxValues.reduce((a,b)=>a+b,0) / adxValues.length;
}

const calculateStochRSI = (prices: number[], period: number = 14): number => {
    let rsiSeries = [];
    for(let i=0; i<period; i++) {
        const slice = prices.slice(0, prices.length - i);
        rsiSeries.push(calculateRSI(slice, 14));
    }
    const currentRSI = rsiSeries[0];
    const minRSI = Math.min(...rsiSeries);
    const maxRSI = Math.max(...rsiSeries);
    if (maxRSI === minRSI) return 0.5;
    return (currentRSI - minRSI) / (maxRSI - minRSI);
}

const calculateMomentum = (closes: number[], period: number = 10): number => {
    if (closes.length < period) return 0;
    return closes[closes.length - 1] - closes[closes.length - 1 - period];
};

const calculateWilliamsR = (highs: number[], lows: number[], closes: number[], period: number = 14): number => {
    if (highs.length < period) return -50;
    const currentClose = closes[closes.length - 1];
    const sliceHighs = highs.slice(highs.length - period);
    const sliceLows = lows.slice(lows.length - period);
    const highestHigh = Math.max(...sliceHighs);
    const lowestLow = Math.min(...sliceLows);
    
    if (highestHigh === lowestLow) return -50;
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
};

const calculateCCI = (highs: number[], lows: number[], closes: number[], period: number = 20): number => {
    if (highs.length < period) return 0;
    let tps = [];
    // Calculate Typical Prices
    for(let i=0; i<closes.length; i++) {
        tps.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const currentTP = tps[tps.length - 1];
    const smaTP = calculateSMA(tps, period);
    
    // Mean Deviation
    const sliceTP = tps.slice(tps.length - period);
    const meanDev = sliceTP.reduce((acc, val) => acc + Math.abs(val - smaTP), 0) / period;
    
    if (meanDev === 0) return 0;
    return (currentTP - smaTP) / (0.015 * meanDev);
};

const calculateFibPivotPoints = (high: number, low: number, close: number, currentPrice: number) => {
    if (low > high) { const temp = low; low = high; high = temp; }
    
    const pivot = (high + low + close) / 3;
    const range = high - low;
    
    const r1 = pivot + (0.382 * range);
    const r2 = pivot + (0.618 * range);
    const r3 = pivot + (1.000 * range);
    const s1 = Math.max(0, pivot - (0.382 * range));
    const s2 = Math.max(0, pivot - (0.618 * range));
    const s3 = Math.max(0, pivot - (1.000 * range));

    // Validation Logic
    let isValid = true;
    if (range === 0 || isNaN(range)) isValid = false;
    // If current price is abnormally far from pivot (e.g. > 50% deviation implies data error or massive crash)
    if (currentPrice > r3 * 1.5 || currentPrice < s3 * 0.5) isValid = false;

    return { pivot, r1, r2, r3, s1, s2, s3, isValid };
}

const calculateCompositeSentiment = (fngValue: number, btcChangePercent: number) => {
    let btcScore = 50 + (btcChangePercent * 10);
    btcScore = Math.max(0, Math.min(100, btcScore));
    const compositeScore = (fngValue * 0.5) + (btcScore * 0.5);
    
    let classification = "Neutral";
    if (compositeScore >= 75) classification = "Extreme Greed";
    else if (compositeScore >= 60) classification = "Greed";
    else if (compositeScore <= 25) classification = "Extreme Fear";
    else if (compositeScore <= 40) classification = "Fear";

    return { value: Math.round(compositeScore), classification };
};

// --- GEMINI SUPERVISOR INTEGRATION (FLASH + SEARCH) ---
export const enrichScannerWithAI = async (coins: ScannerCoin[]): Promise<ScannerCoin[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return coins;
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Reduce to top 10 to leave token budget for search results
    const topCandidates = coins.slice(0, 10); 
    
    const prompt = `
        Sen NEURO_TRADE sisteminin "Yatırım Komitesi Başkanı"sın (Model: Gemini 3 Flash).
        
        Sana matematiksel olarak "NEURO_QUANT V6" algoritması tarafından seçilmiş EN İYİ fırsatlar veriliyor.
        
        GÖREVİN (ADIM ADIM):
        1. ARAÇ KULLAN: 'googleSearch' aracını kullanarak bu listedeki ilk 5 coin için SON 24 SAATTEKİ önemli haberleri ve sosyal medya (Reddit/Twitter) trendlerini (X-Ray) tara.
        2. TEYİT ET: Matematiksel skor yüksek olsa bile, hakkında "Hack", "Delist", "Unlock" veya "Dolandırıcılık" haberi olanları ACIMASIZCA ELE.
        3. SEÇ: Hem Matematiği (Score) hem de Temel Analizi (Search/X-Ray) pozitif olan EN İYİ 3 coini "AI Pick" olarak işaretle.
        
        NOT FORMATI:
        - "Google aramasına göre..." diye başlama. Doğrudan sonucu yaz. Örn: "Listing haberiyle hacim patladı, X-Ray pozitif."
        - Agresif, kısa ve net ol.

        ADAYLAR (MATH DATA):
        ${JSON.stringify(topCandidates.map(c => ({ 
            s: c.symbol, 
            score: c.score,
            vol: (c.volume / 1000000).toFixed(1) + 'M',
            chg: c.change24h + '%',
            tags: c.tags.join(', ')
        })))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: prompt,
            config: {
                // ENABLE GOOGLE SEARCH FOR THE SUPERVISOR
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            symbol: { type: Type.STRING },
                            aiPick: { type: Type.BOOLEAN },
                            aiNote: { type: Type.STRING }
                        },
                        required: ["symbol", "aiPick", "aiNote"]
                    }
                }
            }
        });

        const aiResults = JSON.parse(response.text || "[]");
        
        return coins.map(coin => {
            const match = aiResults.find((r: any) => r.symbol === coin.symbol);
            if (match) {
                return { ...coin, aiPick: match.aiPick, aiNote: match.aiNote };
            }
            return coin;
        });

    } catch (e) {
        console.error("AI Supervisor Error:", e);
        // If AI fails, fallback to math-only
        return coins;
    }
}

export const getTopOpportunities = async (): Promise<ScannerCoin[]> => {
  try {
    const rawData = await fetchWithFallback('/ticker/24hr');
    
    // Advanced filtering
    const validPairs = rawData.filter((item: any) => 
      item.symbol.endsWith('USDT') && 
      !['BUSDUSDT', 'USDCUSDT', 'TUSDUSDT', 'USDPUSDT', 'FDUSDUSDT', 'EURUSDT'].includes(item.symbol) &&
      !item.symbol.includes('DOWN') && 
      !item.symbol.includes('UP') &&
      parseFloat(item.quoteVolume) > 10000000 // Min $10M Volume
    );

    const mapped: ScannerCoin[] = validPairs.map((item: any) => {
      const price = parseFloat(item.lastPrice);
      const open = parseFloat(item.openPrice);
      const high = parseFloat(item.highPrice);
      const low = parseFloat(item.lowPrice);
      const vwap = parseFloat(item.weightedAvgPrice);
      const change = parseFloat(item.priceChangePercent);
      const volume = parseFloat(item.quoteVolume); // USDT Volume
      const count = item.count ? parseInt(item.count) : 1; // Trade Count
      
      const bidPrice = parseFloat(item.bidPrice);
      const askPrice = parseFloat(item.askPrice);

      // --- NEURO QUANT V6: HYPER-DIMENSIONAL MODEL ---

      // 1. VWAP Trend Check
      const vwapDeviation = ((price - vwap) / vwap) * 100;
      const trendScore = vwapDeviation > 0 ? Math.min(25, vwapDeviation * 4) : Math.max(-25, vwapDeviation * 4);
      
      // 2. Whale Intensity (Liquidity Quality)
      // Avg Trade Size calculation
      const avgTradeSize = volume / count;
      const whaleScore = Math.min(20, Math.log10(avgTradeSize) * 6);

      // 3. Close Location (Structure)
      const range = high - low;
      const clv = range === 0 ? 0.5 : (price - low) / range;
      const structureScore = clv * 20;

      // 4. Momentum Efficiency
      const efficiency = Math.abs(open - price) / (high - low || 1);
      const momentumScore = efficiency * 15;

      // 5. Order Book Imbalance (Simulated via Spread)
      const spread = (askPrice - bidPrice) / price;
      // Ultra tight spread often implies high algorithmic interest
      const spreadScore = spread < 0.0005 ? 10 : spread < 0.001 ? 5 : 0;

      // 6. Bollinger Squeeze Logic (Volatility Contraction)
      // We don't have historical data here, but we can approximate volatility via High-Low/Price
      const dailyVolatility = range / price;
      // If volatility is abnormally low for a crypto (e.g. < 1.5%) and volume is decent, it's a squeeze.
      let squeezeScore = 0;
      if (dailyVolatility < 0.02 && change > 0.5 && change < 3) {
          squeezeScore = 15; // Potential breakout
      }

      // TOTAL QUANTUM SCORE V6
      let score = trendScore + whaleScore + structureScore + momentumScore + spreadScore + squeezeScore;
      
      // Penalties
      if (clv < 0.5 && change > 10) score -= 20; // Rejection from high

      // Normalization (0-99)
      score = Math.min(99, Math.max(1, Math.round(score + 15)));

      const tags = [];
      if (whaleScore > 15) tags.push('🐋 BALİNA');
      if (squeezeScore > 10) tags.push('🏹 SQUEEZE');
      if (vwapDeviation > 4) tags.push('🚀 RALLY');
      if (spreadScore === 10) tags.push('🤖 HFT AKTİF');
      if (score > 85) tags.push('💎 QUANT V6');

      return {
        symbol: item.symbol,
        price,
        change24h: change,
        volume,
        score,
        tags
      };
    });

    const activeCoins = mapped.filter(c => Math.abs(c.change24h) > 1.0);

    // Sort by Quantum Score V6
    return activeCoins.sort((a, b) => b.score - a.score).slice(0, 15);
  } catch (error) {
    console.error("Scanner API Error", error);
    return [];
  }
};

export const getTechnicalAnalysis = async (ticker: string): Promise<TechnicalData> => {
  let symbol = ticker.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!symbol.endsWith('USDT') && !symbol.endsWith('BTC') && !symbol.endsWith('ETH')) symbol += 'USDT';

  try {
    // Add cache buster to sentiment API
    const sentimentUrl = `${SENTIMENT_API}?t=${new Date().getTime()}`;

    const [stats, klines1h, klines4h, klines1d, sentimentRes, btcStats] = await Promise.all([
      fetchWithFallback('/ticker/24hr', `symbol=${symbol}`),
      fetchWithFallback('/klines', `symbol=${symbol}&interval=1h&limit=300`),
      fetchWithFallback('/klines', `symbol=${symbol}&interval=4h&limit=50`),
      fetchWithFallback('/klines', `symbol=${symbol}&interval=1d&limit=5`),
      fetch(sentimentUrl).then(r => r.json()).catch(() => ({ data: [{ value: 50, value_classification: 'Neutral' }] })),
      fetchWithFallback('/ticker/24hr', `symbol=BTCUSDT`) // Fetch BTC data
    ]);

    const closes1h = klines1h.map((d: any[]) => parseFloat(d[4]));
    const highs1h = klines1h.map((d: any[]) => parseFloat(d[2]));
    const lows1h = klines1h.map((d: any[]) => parseFloat(d[3]));
    const closes4h = klines4h.map((d: any[]) => parseFloat(d[4]));
    const currentPrice = parseFloat(stats.lastPrice);
    
    const prevDayCandle = klines1d.length >= 2 ? klines1d[klines1d.length - 2] : klines1d[0]; 
    const prevHigh = parseFloat(prevDayCandle[2]);
    const prevLow = parseFloat(prevDayCandle[3]);
    const prevClose = parseFloat(prevDayCandle[4]);

    const rsi = calculateRSI(closes1h, 14);
    const stochRsi = calculateStochRSI(closes1h, 14);
    
    const sma20 = calculateSMA(closes1h, 20);
    const sma50 = calculateSMA(closes1h, 50);
    const sma200 = calculateSMA(closes1h, 200);

    const atr = calculateATR(highs1h, lows1h, closes1h, 14);
    const adx = calculateADX(highs1h, lows1h, closes1h, 14);
    
    const momentum = calculateMomentum(closes1h, 10);
    const williamsR = calculateWilliamsR(highs1h, lows1h, closes1h, 14);
    const cci = calculateCCI(highs1h, lows1h, closes1h, 20);

    const stdDev = calculateStandardDeviation(closes1h, 20);
    const bollinger = { middle: sma20, upper: sma20 + (stdDev * 2), lower: sma20 - (stdDev * 2) };
    const ema12 = calculateEMA(closes1h, 12);
    const ema26 = calculateEMA(closes1h, 26);
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    const trendSMA4h = calculateSMA(closes4h, 10);
    const lastClose4h = closes4h[closes4h.length - 1];
    const trend4h = lastClose4h > trendSMA4h ? 'UP' : lastClose4h < trendSMA4h ? 'DOWN' : 'FLAT';
    
    let pivotPoints = calculateFibPivotPoints(prevHigh, prevLow, prevClose, currentPrice);
    
    // VALIDATION & FALLBACK LAYER
    if (!pivotPoints.isValid || isNaN(pivotPoints.pivot)) {
        // Fallback to ATR-based levels (Approx daily range logic)
        // R1 = Close + 0.5*ATR, R2 = Close + 1.0*ATR, R3 = Close + 1.5*ATR
        const safeAtr = atr > 0 ? atr : currentPrice * 0.02;
        pivotPoints = {
            pivot: prevClose,
            r1: prevClose + (0.5 * safeAtr),
            r2: prevClose + (1.0 * safeAtr),
            r3: prevClose + (1.5 * safeAtr),
            s1: prevClose - (0.5 * safeAtr),
            s2: prevClose - (1.0 * safeAtr),
            s3: prevClose - (1.5 * safeAtr),
            isValid: false // Keep false to trigger warning UI but provide safer values
        };
    }

    // --- COMPOSITE SENTIMENT LOGIC ---
    let rawFng = 50;
    if (sentimentRes && sentimentRes.data && sentimentRes.data.length > 0) {
        rawFng = parseInt(sentimentRes.data[0].value);
    }
    
    const btcChange = parseFloat(btcStats.priceChangePercent);
    const compositeSentiment = calculateCompositeSentiment(rawFng, btcChange);

    return {
      rsi: parseFloat(rsi.toFixed(2)),
      stochRsi: parseFloat(stochRsi.toFixed(4)),
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
      sma200: parseFloat(sma200.toFixed(2)),
      priceChangePercent: parseFloat(stats.priceChangePercent),
      high24h: parseFloat(stats.highPrice),
      low24h: parseFloat(stats.lowPrice),
      volume: parseFloat(stats.quoteVolume),
      price: currentPrice,
      atr: parseFloat(atr.toFixed(4)),
      adx: parseFloat(adx.toFixed(2)),
      cci: parseFloat(cci.toFixed(2)),
      williamsR: parseFloat(williamsR.toFixed(2)),
      momentum: parseFloat(momentum.toFixed(4)),
      globalSentiment: compositeSentiment, 
      macd: { value: parseFloat(macdLine.toFixed(4)), signal: parseFloat(signalLine.toFixed(4)), histogram: parseFloat(histogram.toFixed(4)) },
      bollinger: { upper: parseFloat(bollinger.upper.toFixed(2)), lower: parseFloat(bollinger.lower.toFixed(2)), middle: parseFloat(bollinger.middle.toFixed(2)) },
      pivotPoints,
      trend4h,
      isSimulation: false
    };
  } catch (error) {
    console.warn("Simulation fallback triggered", error);
    const p = 100;
    return {
      rsi: 50, stochRsi: 0.5, sma20: p, sma50: p, sma200: p,
      priceChangePercent: 0, high24h: p*1.1, low24h: p*0.9, volume: 1000000, price: p, atr: 2, adx: 25,
      cci: 0, williamsR: -50, momentum: 0,
      globalSentiment: { value: 50, classification: 'Neutral' },
      macd: { value: 0, signal: 0, histogram: 0 },
      bollinger: { upper: 110, lower: 90, middle: 100 },
      pivotPoints: { r3:130, r2: 120, r1: 110, pivot: 100, s1: 90, s2: 80, s3: 70, isValid: true },
      trend4h: 'FLAT', isSimulation: true
    };
  }
};