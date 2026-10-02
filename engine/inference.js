const axios = require('axios');

async function generateFinancialInsights(promptText) {
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
           model: 'llama3.2:1b',
            prompt: promptText,
            stream: false,
            format: 'json'
        });

        return JSON.parse(response.data.response);
    } catch (error) {
        console.error("Local Ollama Error:", error.message);
        throw new Error("Failed to process local AI insights.");
    }
}

module.exports = { generateFinancialInsights };