# ⚡ AURA Intelligence Engine (`aura-intelligence-engine`)

> **Autonomous Capital Intelligence & Behavioral FX Terminal**  
> An executive-grade financial decision-making platform that pairs real-time SQL transaction telemetry with Google Gemini AI reasoning for predictive burn-rate modeling, statistical anomaly detection, and automated cash runway forecasting.

---

### 🚀 Key Features

* **🧠 Gemini AI Transaction Ingestion**: Natural language expense processing using `gemini-2.5-flash` with fallback local NLP categorization.
* **📊 Statistical Anomaly Engine**: Automatic detection of spending spikes using Z-Score variance calculations against historical user telemetry.
* **🔮 "What-If" Scenario Simulator**: Dynamic burn-rate multipliers and purchase impact modeling against liquid cash reserves.
* **📈 Interactive Visual Analytics**: Real-time cash flow trendlines and category distribution rendering via Recharts.
* **🌐 Live FX Synchronization**: Integrated real-time FX rate conversion across USD ($), INR (₹), EUR (€), and GBP (£).
* **💬 Conversational Wealth Co-Pilot**: Context-aware AI financial strategist with direct access to live `fintrack_db` database metrics.
* **📥 Enterprise Reporting**: One-click accounting export for historical transaction ledgers in CSV format.

---

### 🛠️ Tech Stack

* **Backend**: Node.js, Express.js, MySQL 8.4 (`mysql2/promise`), `@google/genai` SDK, Axios, Compromise NLP
* **Frontend**: React (Vite), Recharts, Lucide Icons, Glassmorphism CSS Architecture
* **Database**: MySQL 8.4 (`fintrack_db` with `ai_expenses` and `daily_liquidity_snapshots`)