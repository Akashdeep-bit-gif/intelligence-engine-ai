## 💻 Tech Stack & Dependencies

* **Backend**: Node.js, Express.js, `mysql2/promise`, `@google/genai` SDK, Axios, Compromise NLP
* **Frontend**: React (Vite), Recharts, Lucide React Icons, Custom Glassmorphism CSS
* **Database**: MySQL 8.4 (`fintrack_db`)

---

## ⚡ Quick Start & Installation

### 1. Database Setup
Ensure MySQL is active locally and configure your `.env` file in the root folder:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fintrack_db
GEMINI_API_KEY=your_gemini_api_key_here
DEFAULT_CURRENCY=USD
