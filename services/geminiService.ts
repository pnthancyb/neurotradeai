import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, TradeAction, TechnicalData } from "../types";

// Nitter/Twitter imports REMOVED completely.

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    newsHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
    stopLoss: { type: Type.NUMBER },
    takeProfit: { type: Type.NUMBER },
    riskReward: { type: Type.STRING },
    technicalLevels: {
        type: Type.OBJECT,
        properties: {
            support: { type: Type.STRING },
            resistance: { type: Type.STRING }
        }
    },
    xRayAnalysis: {
        type: Type.OBJECT,
        properties: {
            triggered: { type: Type.BOOLEAN },
            dataCount: { type: Type.NUMBER },
            topBuzzWords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    }
  },
  required: ["action", "confidence", "reasoning", "sentimentScore", "newsHeadlines", "stopLoss", "takeProfit", "riskReward", "technicalLevels"],
};

export const analyzeMarket = async (
  ticker: string,
  techData: TechnicalData
): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  // --- NEURO X-RAY V10.2: VISUAL REASONING ENGINE ---
  const systemInstruction = `
    Sen NEURO_TRADE v10.2 (Türkçe).
    GÖREV: ${ticker} için ($${techData.price}) piyasa analizi yap.

    [VERİ TOPLAMA PROTOKOLÜ]
    1. RESMİ HABERLER (ÖNCELİK #1): 
       - Google Search kullanarak ${ticker} hakkında son gelişmeleri tara.
       - HEDEF: 'newsHeadlines' alanına EN AZ 10-15 ADET somut, farklı ve güncel haber başlığı ekle.
    
    2. TEKNİK VERİLER (ÖNCELİK #2):
       - Gönderilen indikatörleri (RSI: ${techData.rsi}, Trend: ${techData.trend4h}) temel al.

    [GÖRSEL MANTIK EŞLEŞTİRME (ÖNEMLİ)]
    - Analiz metnini (reasoning) yazarken, kararı etkileyen ana faktörleri aşağıdaki etiketlerle işaretle:
      - Eğer bir HABER etkiliyse: **[NEWS] Haber Özeti**
      - Eğer bir TEKNİK gösterge etkiliyse: **[TECH] Gösterge Adı**
      - ÖRNEK: "Fiyatın **[TECH] RSI Aşırı Alım** bölgesinde olması ve **[NEWS] SEC Davası** belirsizliği nedeniyle düşüş beklenebilir."

    [ÇIKTI KURALLARI]
    - 'reasoning' alanı: Profesyonel finans dili kullan. Etiketleri cümlenin akışına doğal şekilde yedir.
    - Stop Loss/Take Profit: Volatiliteye (${techData.atr}) göre ayarla.
  `;

  const model = ai.models;

  const response = await model.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analizi başlat. ${ticker} için kapsamlı haber taraması yap. Teknik verileri yorumla ve görsel etiketleri (**[NEWS]...**, **[TECH]...**) kullanarak gerekçeni yaz.`,
    config: {
      systemInstruction: systemInstruction,
      tools: [
          { googleSearch: {} } 
      ],
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    },
  });

  const resultText = response.text;
  if (!resultText) throw new Error("AI Yanıt Vermedi");
  
  let analysis = JSON.parse(resultText);

  // --- MATH GUARD ---
  const currentPrice = techData.price || 0;
  const atr = techData.atr || (currentPrice * 0.05);

  if (analysis.action === "BUY") {
      if (analysis.stopLoss >= currentPrice) analysis.stopLoss = currentPrice - (atr * 1.5);
      const risk = currentPrice - analysis.stopLoss;
      if (analysis.takeProfit <= currentPrice + (risk * 2)) analysis.takeProfit = currentPrice + (risk * 2.5);
  } 
  else if (analysis.action === "SELL") {
      if (analysis.stopLoss <= currentPrice) analysis.stopLoss = currentPrice + (atr * 1.5);
      const risk = analysis.stopLoss - currentPrice;
      if (analysis.takeProfit >= currentPrice - (risk * 2)) analysis.takeProfit = currentPrice - (risk * 2.5);
  }

  const risk = Math.abs(currentPrice - analysis.stopLoss);
  const reward = Math.abs(currentPrice - analysis.takeProfit);
  analysis.riskReward = risk > 0 ? `1:${(reward / risk).toFixed(2)}` : "N/A";

  // --- X-RAY LOGIC (Background Only) ---
  if (!analysis.xRayAnalysis) {
      analysis.xRayAnalysis = { triggered: true, dataCount: 0, topBuzzWords: [] };
  }
  
  // Source Extraction
  const sources: { title: string; url: string }[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
      if (chunk.web?.uri) {
        let title = chunk.web.title || "Web Source";
        if (!sources.find(s => s.url === chunk.web?.uri)) {
             sources.push({ title: title, url: chunk.web.uri });
        }
      }
    });
  }

  let action = TradeAction.HOLD;
  if (analysis.action === "BUY") action = TradeAction.BUY;
  if (analysis.action === "SELL") action = TradeAction.SELL;

  return { ...analysis, action, sources };
};

export const generateDeepResearchReport = async (
    ticker: string,
    techData: TechnicalData,
    initialAnalysis: AIAnalysisResult
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        Sen NEURO_TRADE Baş Analistisin.
        VARLIK: ${ticker}
        
        GÖREV: Yatırımcılar için KURUMSAL SEVİYEDE, CİDDİ ve TÜRKÇE bir PDF raporu metni hazırla.
        
        [DERİN ARAŞTIRMA PROTOKOLÜ]
        - Google Search aracını kullanarak varlık hakkında YENİDEN ve DERİNLEMESİNE bir tarama yap.
        - İlk analizdeki sonuçlarla yetinme. Sadece manşetleri değil, detayları sentezle.
        - Tüm haber kaynaklarını, sosyal medya söylentilerini ve teknik verileri birleştirerek bütüncül bir hikaye oluştur.
        - Rapor uzunluğu en az 600 kelime olmalı ve profesyonel finans terminolojisi içermelidir.
        
        [RAPOR FORMATI]
        # 1. YÖNETİCİ ÖZETİ
        - Sinyal Kararı (${initialAnalysis.action}) ve kısa gerekçesi.
        
        # 2. TEMEL ANALİZ VE GÜNCEL GELİŞMELER (DETAYLI)
        - Google Search sonuçlarına dayanarak en güncel haberleri, ortaklıkları, yasal süreçleri ve proje güncellemelerini detaylıca anlat.
        - "Haberlere göre..." demek yerine, olayı doğrudan anlat (Örn: "BlackRock'ın son başvurusu...").
        
        # 3. TEKNİK GÖRÜNÜM VE PİVOT ANALİZİ
        - Fiyat: $${techData.price}
        - RSI: ${techData.rsi} | Trend: ${techData.trend4h}
        - Destek/Direnç seviyeleri ve Pivot noktalarının güvenilirliği.
        
        # 4. PİYASA DUYARLILIĞI VE RİSK ANALİZİ
        - Yatırımcı psikolojisi, korku/açgözlülük durumu ve potansiyel risk faktörleri.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            temperature: 0.3,
            tools: [{ googleSearch: {} }],
        },
    });

    return response.text || "Rapor oluşturulamadı.";
};