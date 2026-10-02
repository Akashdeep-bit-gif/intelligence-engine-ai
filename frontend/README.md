<div align="center">

# ⚡ AURA Intelligence Engine (`intelligence-engine-ai`)
### *Autonomous Capital Intelligence & Predictive Wealth Terminal*

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E7CC3?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://recharts.org/)

An executive-grade financial terminal pairing real-time MySQL 8.4 telemetry with Google Gemini AI reasoning for predictive burn-rate modeling, statistical anomaly detection, and automated cash runway forecasting.

</div>

---

## 🏛️ System Architecture & Data Pipeline

```text
                                 +-----------------------------------+
                                 |    React Glassmorphism Dashboard  |
                                 |   (Recharts, Currency FX, UI)     |
                                 +-----------------+-----------------+
                                                   |
                                                   v  REST API
                                 +-----------------+-----------------+
                                 |  Express.js Autonomous Controller |
                                 +--------+----------------+--------+
                                          |                |
                     +--------------------+                +--------------------+
                     |                                                          |
                     v                                                          v
  +------------------+------------------+                    +------------------+------------------+
  |    Google Gemini 2.5 Flash Engine   |                    |        MySQL 8.4 Engine          |
  |  - Unstructured Expense Parsing     |                    |  - Transaction Persistence      |
  |  - Statistical Anomaly Ingestion    |                    |  - Z-Score Historical Telemetry  |
  |  - Wealth Co-Pilot Strategy         |                    |  - Liquidity Snapshots           |
  +-------------------------------------+                    +-------------------------------------+