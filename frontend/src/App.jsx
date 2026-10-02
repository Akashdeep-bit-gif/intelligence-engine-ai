import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Cpu, DollarSign, Send, AlertTriangle, ShieldCheck, MessageSquare, 
  Sparkles, TrendingUp, Globe, ShoppingBag, Sliders, Download, PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import './App.css';

const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b',
  'Tech & Electronics': '#3b82f6',
  'Subscriptions': '#a78bfa',
  'Transport': '#06b6d4',
  'Lifestyle': '#ec4899',
  'General Expense': '#10b981'
};

const DEFAULT_BUDGETS = {
  'Food & Dining': 500,
  'Tech & Electronics': 1500,
  'Subscriptions': 100,
  'Transport': 300,
  'Lifestyle': 400
};

function App() {
  const [rawExpense, setRawExpense] = useState('');
  const [customCategory, setCustomCategory] = useState('Auto');
  const [parsedResult, setParsedResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [fxRates, setFxRates] = useState({ USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79 });
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: '⚡ AURA AI Wealth Advisor Online. Ask any custom question regarding cash flow, purchases, or runway modeling!' }
  ]);
  const [loading, setLoading] = useState(false);

  // Scenario Modeling State
  const [simPurchase, setSimPurchase] = useState('');
  const [simBurnMultiplier, setSimBurnMultiplier] = useState(1.0);

  const currencySymbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };

  const formatCurr = (valInUSD) => {
    if (valInUSD === undefined || valInUSD === null) return '0.00';
    const rate = fxRates[currency] || 1;
    const converted = valInUSD * rate;
    return `${currencySymbols[currency]} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchDashboardData = async () => {
    try {
      const [rrRes, fxRes] = await Promise.all([
        axios.get('/api/ai/runrate'),
        axios.get('/api/ai/fx-rates')
      ]);

      if (rrRes.data.success) {
        setMetrics(rrRes.data);
        if (rrRes.data.recentExpenses) setRecentExpenses(rrRes.data.recentExpenses);
      }
      if (fxRes.data.success && fxRes.data.rates) {
        setFxRates(fxRes.data.rates);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleParseExpense = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSubmit = customText || rawExpense;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/ai/parse-expense', {
        rawInput: textToSubmit,
        customCategory
      });
      if (res.data.success) {
        setParsedResult(res.data.expense);
        if (!customText) setRawExpense('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoPilotQuery = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || chatInput;
    if (!msgToSend.trim()) return;

    setChatHistory((prev) => [...prev, { role: 'user', text: msgToSend }]);
    if (!customMsg) setChatInput('');

    try {
      const res = await axios.post('/api/ai/copilot', { message: msgToSend });
      if (res.data.success) {
        setChatHistory((prev) => [...prev, { role: 'assistant', text: res.data.response }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'assistant', text: '❌ Error connecting to AI engine.' }]);
    }
  };

  const handleExportCSV = () => {
    if (!recentExpenses.length) return;
    const headers = 'Description,Amount (USD),Category,Date\n';
    const rows = recentExpenses.map(e => `"${e.description}",${e.amount},"${e.category}","${e.created_at || ''}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURA_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const pieData = Object.entries(
    recentExpenses.reduce((acc, exp) => {
      const cat = exp.category || 'General Expense';
      acc[cat] = (acc[cat] || 0) + Number(exp.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const trendData = recentExpenses.slice().reverse().map((exp, i) => ({
    name: exp.description ? exp.description.slice(0, 8) : `Tx ${i + 1}`,
    amount: Number(exp.amount)
  }));

  const baseBalance = metrics?.liquidBalance || 2130;
  const baseBurn = (metrics?.metrics?.avgDailyBurn || 45) * simBurnMultiplier;
  const extraCost = parseFloat(simPurchase) || 0;
  const simBalance = Math.max(0, baseBalance - extraCost);
  const simRunwayDays = baseBurn > 0 ? Math.floor(simBalance / baseBurn) : 0;

  const daysOfLiquidity = metrics?.metrics?.daysOfLiquidity || 0;
  const runwayProgressPct = Math.min(100, Math.max(0, (daysOfLiquidity / 60) * 100));

  return (
    <div className="dashboard-container">
      {/* Executive Header */}
      <header className="header">
        <div>
          <h1 className="title">AURA FINTECH</h1>
          <div className="subtitle">
            Autonomous Capital Intelligence & Predictive Wealth Terminal
            <span className="tech-badge">MySQL 8.4</span>
            <span className="tech-badge">Gemini AI</span>
            <span className="tech-badge">Live FX</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>

          <div className="currency-selector">
            <Globe size={15} color="#94a3b8" />
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="status-badge">
            <div className="pulse-dot"></div> Engine Active
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid">
        {/* Card 1: Smart AI Transaction Ingestion */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <Cpu size={18} color="#3b82f6" />
                <span>Smart AI Transaction Ingestion</span>
              </div>
              <Sparkles size={16} color="#60a5fa" />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <Sliders size={14} color="#94a3b8" />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category Mode:</span>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="select-custom"
              >
                <option value="Auto">✨ Auto AI Categorize</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Tech & Electronics">Tech & Electronics</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Transport">Transport</option>
                <option value="Lifestyle">Lifestyle</option>
              </select>
            </div>

            <form onSubmit={handleParseExpense} className="input-box">
              <input
                type="text"
                placeholder="e.g. Spent $450 on Uber Eats or Paid $1200 for RTX GPU"
                value={rawExpense}
                onChange={(e) => setRawExpense(e.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Parsing...' : 'Parse'}
              </button>
            </form>

            {parsedResult && (
              <div className={`alert-card ${parsedResult.isAnomaly ? 'anomaly' : 'normal'}`}>
                {parsedResult.isAnomaly ? <AlertTriangle size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#10b981" />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {parsedResult.category}: {formatCurr(parsedResult.amount)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    Confidence: {(parsedResult.confidence_score * 100).toFixed(0)}%
                  </div>
                  {parsedResult.isAnomaly && (
                    <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.3rem', fontWeight: 500 }}>
                      ⚠️ {parsedResult.anomalyReason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Capital Runway & Reserve */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <DollarSign size={18} color="#10b981" />
                <span>Capital Runway & Reserve</span>
              </div>
              <TrendingUp size={16} color="#34d399" />
            </div>

            {metrics ? (
              <div className="liquidity-display">
                <div>
                  <div className="main-balance-label">Liquid Capital ({currency})</div>
                  <div className="main-balance-val">{formatCurr(metrics.liquidBalance)}</div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${runwayProgressPct}%`,
                        background: daysOfLiquidity < 30 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #06b6d4)'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="metric-grid">
                  <div className="metric-item">
                    <div className="metric-item-label">Avg Daily Burn</div>
                    <div className="metric-item-value">{formatCurr(metrics.metrics?.avgDailyBurn)}/day</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-item-label">Runway Days</div>
                    <div className="metric-item-value" style={{ color: daysOfLiquidity < 30 ? '#ef4444' : '#34d399' }}>
                      {metrics.metrics?.daysOfLiquidity} Days
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-item-label">EOM Balance</div>
                    <div className="metric-item-value">{formatCurr(metrics.metrics?.projectedEomBalance)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.88rem' }}>Loading live ledger...</div>
            )}
          </div>
        </div>

        {/* Card 3: Interactive Analytics */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <LineIcon size={18} color="#06b6d4" />
                <span>Expenditure Trends & Distribution</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData.length ? trendData : [{ name: 'Init', amount: 0 }]}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData.length ? pieData : [{ name: 'General', value: 100 }]} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 4: What-If Scenario Simulator */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <Sliders size={18} color="#f59e0b" />
                <span>What-If Capital Scenario Simulator</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input
                type="number"
                placeholder="Simulate Purchase Amount ($)"
                value={simPurchase}
                onChange={(e) => setSimPurchase(e.target.value)}
              />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  <span>Burn Rate Factor ({simBurnMultiplier}x)</span>
                  <span>${(baseBurn).toFixed(0)}/day</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={simBurnMultiplier}
                  onChange={(e) => setSimBurnMultiplier(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Simulated Reserves</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{formatCurr(simBalance)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Simulated Runway</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: simRunwayDays < 20 ? '#ef4444' : '#34d399' }}>
                    {simRunwayDays} Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Category Budget Limits & Stream */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <ShoppingBag size={18} color="#06b6d4" />
                <span>Category Budget Limits & Stream</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(DEFAULT_BUDGETS).map(([cat, limit]) => {
                const spent = recentExpenses
                  .filter(e => e.category === cat)
                  .reduce((s, e) => s + Number(e.amount), 0);
                const pct = Math.min(100, (spent / limit) * 100);

                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>{cat}</span>
                      <span>{formatCurr(spent)} / {formatCurr(limit)}</span>
                    </div>
                    <div className="progress-bar-container" style={{ height: '4px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct > 85 ? '#ef4444' : (CATEGORY_COLORS[cat] || '#10b981')
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{exp.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{exp.category}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.82rem' }}>{formatCurr(Number(exp.amount))}</div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem' }}>No ledger transactions recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Card 6: AURA AI Wealth Co-Pilot */}
        <div className="card">
          <div>
            <div className="card-title">
              <div className="card-header-icon">
                <MessageSquare size={18} color="#8b5cf6" />
                <span>AURA AI Wealth Co-Pilot</span>
              </div>
            </div>

            <div className="quick-pills">
              <button className="pill-btn" onClick={() => handleCoPilotQuery(null, 'Where am I overspending based on my recent transactions?')}>
                💡 Overspending Analysis
              </button>
              <button className="pill-btn" onClick={() => handleCoPilotQuery(null, 'When is the safest time to buy a $600 smartphone?')}>
                📅 Timing Advice
              </button>
              <button className="pill-btn" onClick={() => handleCoPilotQuery(null, 'How can I extend my liquid runway by 15 days?')}>
                🚀 Extend Runway
              </button>
            </div>

            <div className="chat-window">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  <div style={{ whitespace: 'pre-wrap', lineHeight: '1.5' }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCoPilotQuery} className="input-box">
              <input
                type="text"
                placeholder="Ask anything... e.g. 'Can I afford a trip next month?'"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="primary-btn">
                <Send size={15} /> Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;