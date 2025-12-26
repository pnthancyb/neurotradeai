// DEPRECATED SERVICE
// The Nitter/Twitter bridge functionality has been replaced by the Dual-Search strategy in geminiService.ts
// This file is kept as a placeholder to prevent import errors during transition, but exports are empty.

import { TwitterIntel } from "../types";

export const fetchNitterTweets = async (symbol: string): Promise<TwitterIntel[]> => {
    console.warn("Nitter service is deprecated. Use Google Search strategy instead.");
    return [];
};