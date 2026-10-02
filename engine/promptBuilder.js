// engine/promptBuilder.js

function buildFinancialPrompt(financialData) {
    return `You are the core intelligence of FinTrack Pro. Analyze the following aggregated financial data and provide predictive behavioral insights.

DATA:
${JSON.stringify(financialData, null, 2)}

TASK:
1. Analyze the spending velocity and compare it to the current balance and days left in the month.
2. Predict the end-of-month cash flow balance based on current trends.
3. Generate 1-2 actionable, dynamic budget alerts.

CONSTRAINTS:
- Do not output any markdown formatting (like \`\`\`json).
- Your entire response MUST be a valid, parseable JSON object matching the exact structure below.

REQUIRED JSON STRUCTURE:
{
  "alerts": [
    {
      "type": "warning|success|info", 
      "message": "Dynamic context-aware message", 
      "action": "Suggested user action"
    }
  ],
  "cash_flow_prediction": {
    "end_of_month_estimate": 1500,
    "status": "tight|comfortable|surplus"
  }
}`;
}

module.exports = { buildFinancialPrompt };