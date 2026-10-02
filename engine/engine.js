const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const compromise = require('compromise');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

// Helper to query Gemini via SDK or Direct REST Fallback (supports AQ. and AIzaSy keys)
const callGeminiApi = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (!apiKey) return null;

  // Attempt 1: Standard SDK
  try {
    const aiClient = new GoogleGenAI({ apiKey });
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    if (response && response.text) return response.text;
  } catch (sdkError) {
    console.warn('⚠️ SDK call failed, trying direct REST bearer fallback:', sdkError.message);
  }

  // Attempt 2: Direct REST endpoint with Bearer Auth Token (for AQ. / OAuth keys)
  try {
    const restRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-goog-api-key': apiKey
        }
      }
    );

    if (restRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return restRes.data.candidates[0].content.parts[0].text;
    }
  } catch (restErr) {
    console.warn('⚠️ REST Fallback Error:', restErr.response?.data?.error?.message || restErr.message);
  }

  return null;
};

// Live FX Rates Cache
let cachedRates = { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79 };
let lastFxFetch = 0;

const fetchLiveFxRates = async () => {
  const now = Date.now();
  if (now - lastFxFetch < 3600000) return cachedRates;
  try {
    const res = await axios.get('https://open.er-api.com/v6/latest/USD');
    if (res.data && res.data.rates) {
      cachedRates = {
        USD: 1,
        INR: res.data.rates.INR || 83.5,
        EUR: res.data.rates.EUR || 0.92,
        GBP: res.data.rates.GBP || 0.79
      };
      lastFxFetch = now;
    }
  } catch (err) {
    console.warn('⚠️ Using cached FX rates.');
  }
  return cachedRates;
};

// Smart Expense Parser
const parseAndCategorizeExpense = async (rawInput, historicalAmounts = [], customCategory = 'Auto') => {
  let description = rawInput;
  let amount = 0;
  let category = customCategory !== 'Auto' ? customCategory : 'General Expense';
  let confidence = 0.95;

  const prompt = `You are an executive financial transaction parser. Parse this input into clean JSON: "${rawInput}".
Return ONLY a valid raw JSON object (no markdown, no backticks) with keys:
"description": string (short clean name of item/merchant),
"amount": number (extracted exact numerical value),
"category": string (Food & Dining, Tech & Electronics, Subscriptions, Transport, Utilities, Lifestyle, or Miscellaneous),
"confidence": number (between 0.85 and 1.00)`;

  const aiText = await callGeminiApi(prompt);
  if (aiText) {
    try {
      const cleanJson = aiText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      description = parsed.description || rawInput;
      amount = Number(parsed.amount) || 0;
      if (customCategory === 'Auto') category = parsed.category || 'General Expense';
      confidence = Number(parsed.confidence) || 0.95;
    } catch (e) {
      console.warn('⚠️ JSON parse error on Gemini output:', e.message);
    }
  }

  // Local fallback extraction
  if (amount === 0) {
    const doc = compromise(rawInput);
    const numbers = doc.numbers().get();
    if (numbers.length > 0) amount = parseFloat(numbers[0]);

    if (customCategory === 'Auto') {
      const lower = rawInput.toLowerCase();
      if (lower.includes('uber') || lower.includes('cab') || lower.includes('flight')) category = 'Transport';
      else if (lower.includes('eats') || lower.includes('dinner') || lower.includes('coffee') || lower.includes('swiggy')) category = 'Food & Dining';
      else if (lower.includes('netflix') || lower.includes('spotify')) category = 'Subscriptions';
      else if (lower.includes('macbook') || lower.includes('phone') || lower.includes('laptop')) category = 'Tech & Electronics';
    }
  }

  // Anomaly calculation
  let isAnomaly = false;
  let anomalyReason = null;
  if (historicalAmounts.length >= 2 && amount > 0) {
    const avg = historicalAmounts.reduce((a, b) => a + b, 0) / historicalAmounts.length;
    const variance = historicalAmounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / historicalAmounts.length;
    const stdDev = Math.sqrt(variance) || 1;
    const zScore = (amount - avg) / stdDev;

    if (zScore > 1.8 || amount > 500) {
      isAnomaly = true;
      anomalyReason = `High Value Spike: $${amount} is ${zScore.toFixed(1)}x std-devs above baseline average ($${avg.toFixed(2)}).`;
    }
  }

  return { description, amount, category, confidence, isAnomaly, anomalyReason };
};

// Financial Run-Rate Calculation
const calculateRunRate = (liquidBalanceUSD, expenses = []) => {
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgDailyBurn = expenses.length > 0 ? (totalSpent / Math.max(expenses.length, 1)) : 45.00;
  const daysOfLiquidity = avgDailyBurn > 0 ? Math.floor(liquidBalanceUSD / avgDailyBurn) : 999;
  const projectedEomBalance = Math.max(0, liquidBalanceUSD - (avgDailyBurn * 30));

  return { avgDailyBurn: Math.round(avgDailyBurn), daysOfLiquidity, projectedEomBalance };
};

// Conversational Wealth Co-Pilot
const queryCoPilot = async (userMessage, fullFinancialContext = {}) => {
  const { liquidBalanceUSD = 2130, metrics = {}, recentExpenses = [] } = fullFinancialContext;

  const ledgerSummary = recentExpenses.length > 0
    ? recentExpenses.map(e => `- ${e.description}: $${e.amount} (${e.category})`).join('\n')
    : 'No recent transactions recorded.';

  const prompt = `You are AURA, an unrestricted, highly intelligent AI Financial Strategist and Wealth Advisor inside fintrack_db.
Real-Time Database State:
• Liquid Cash Balance: $${liquidBalanceUSD} USD
• Average Daily Burn Rate: $${metrics.avgDailyBurn || 45}/day
• Cash Runway Remaining: ${metrics.daysOfLiquidity || 47} days
• Projected EOM Balance: $${metrics.projectedEomBalance || 0} USD
• Recent Transactions:
${ledgerSummary}

User Query: "${userMessage}"
Provide an executive, structured response using clean Markdown formatting.`;

  const aiResult = await callGeminiApi(prompt);
  if (aiResult) {
    return aiResult;
  }

  // Pure Local Ledger Calculation Fallback
  const lowerMsg = userMessage.toLowerCase();
  if (lowerMsg.includes('balance') || lowerMsg.includes('money') || lowerMsg.includes('reserve')) {
    return `💰 **Current Liquid Reserves**: You have **$${liquidBalanceUSD.toFixed(2)} USD** in liquid capital (**${metrics.daysOfLiquidity || 47} days** of runway at **$${metrics.avgDailyBurn || 45}/day** burn rate).`;
  }

  const buyMatch = userMessage.match(/(?:can i afford|buy|purchase|spend)\s*(?:a|an)?\s*\$?(\d+(\.\d{1,2})?)/i);
  if (buyMatch) {
    const cost = parseFloat(buyMatch[1]);
    const rem = (liquidBalanceUSD - cost).toFixed(2);
    const remDays = Math.floor(rem / (metrics.avgDailyBurn || 45));
    if (cost > liquidBalanceUSD) {
      return `❌ **Affordability Analysis**: Spending **$${cost}** exceeds your available liquid balance ($${liquidBalanceUSD}).`;
    } else {
      return `✅ **Affordability Analysis**: Purchasing this ($${cost}) leaves you with **$${rem} USD** in reserves (**${remDays} days** of runway remaining).`;
    }
  }

  return `🤖 **AURA Engine**: Current liquid balance is **$${liquidBalanceUSD} USD** (${metrics.daysOfLiquidity || 47} days runway).`;
};

module.exports = {
  fetchLiveFxRates,
  parseAndCategorizeExpense,
  calculateRunRate,
  queryCoPilot
};