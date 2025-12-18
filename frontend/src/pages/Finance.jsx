import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 📊 Retro SVG Charts - 90s/2000s Style
const LineChart = ({ series, width = 700, height = 260, padding = 32 }) => {
  const allX = Array.from(new Set(series.flatMap(s => s.data.map(p => p.x))));
  const xIndex = (x) => allX.indexOf(x);
  const allY = series.flatMap(s => s.data.map(p => p.y));
  const minY = Math.min(0, ...allY);
  const maxY = Math.max(...allY, 1);
  const iw = width - padding * 2;
  const ih = height - padding * 2;
  const sx = (i) => (i / Math.max(allX.length - 1, 1)) * iw + padding;
  const sy = (v) => height - padding - ((v - minY) / Math.max(maxY - minY, 1)) * ih;

  // Retro bright colors - Neopets/Geocities inspired
  const colors = ['#9966ff', '#ff66cc', '#ffcc00', '#00ccff', '#00ff99', '#ff3366', '#cc00ff', '#ff9933'];
  const labelStep = allX.length > 24 ? Math.ceil(allX.length / 12) : (allX.length > 12 ? 2 : 1);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart" style={{background: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)'}}>
      {/* Grid pattern background */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(153,102,255,0.1)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x={padding} y={padding} width={iw} height={ih} fill="url(#grid)" />

      {/* Axes - Bold retro style */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#330066" strokeWidth="3" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#330066" strokeWidth="3" />

      {/* Series with drop shadows */}
      {series.map((s, si) => {
        const d = s.data
          .filter(p => allX.includes(p.x))
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(xIndex(p.x))} ${sy(p.y)}`)
          .join(' ');
        const color = colors[si % colors.length];
        return (
          <g key={s.name}>
            {/* Drop shadow */}
            <path d={d} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="5" transform="translate(2, 2)" />
            {/* Main line - thick and bold */}
            <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Data points as circles */}
            {s.data.filter(p => allX.includes(p.x)).map((p, i) => (
              <g key={i}>
                <circle cx={sx(xIndex(p.x))} cy={sy(p.y)} r="6" fill="white" stroke={color} strokeWidth="3" />
                <circle cx={sx(xIndex(p.x))} cy={sy(p.y)} r="3" fill={color} />
              </g>
            ))}
          </g>
        );
      })}

      {/* X labels - bold */}
      {allX.map((x, i) => (
        i % labelStep === 0 ? (
          <text key={x} x={sx(i)} y={height - padding + 20} fontSize="12" fontWeight="bold" textAnchor="middle" fill="#330066">{x}</text>
        ) : null
      ))}

      {/* Y labels - bold with background */}
      {[minY, (minY+maxY)/2, maxY].map((v, i) => (
        <g key={i}>
          <rect x={padding - 50} y={sy(v) - 10} width="45" height="20" fill="white" stroke="#9966ff" strokeWidth="2" rx="4" />
          <text x={padding - 27} y={sy(v)} fontSize="11" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fill="#330066">{v.toFixed(0)}</text>
          <line x1={padding} y1={sy(v)} x2={width-padding} y2={sy(v)} stroke="rgba(153,102,255,0.3)" strokeWidth="1" strokeDasharray="4,4" />
        </g>
      ))}

      {/* Legend */}
      {series.map((s, si) => (
        <g key={s.name} transform={`translate(${width - 150}, ${20 + si * 25})`}>
          <rect x="0" y="0" width="140" height="20" fill="white" stroke={colors[si % colors.length]} strokeWidth="2" rx="4" />
          <line x1="5" y1="10" x2="25" y2="10" stroke={colors[si % colors.length]} strokeWidth="3" />
          <circle cx="15" cy="10" r="4" fill={colors[si % colors.length]} />
          <text x="30" y="10" fontSize="10" fontWeight="bold" alignmentBaseline="middle" fill="#330066">{s.name}</text>
        </g>
      ))}
    </svg>
  );
};

const BarChart = ({ data, width = 700, height = 260, padding = 32 }) => {
  const iw = width - padding * 2;
  const ih = height - padding * 2;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense, d.net].map(Math.abs)), 1);
  const bw = iw / Math.max(data.length, 1) / 3; // 3 bars per group
  const sx = (i, k) => padding + i * (iw / Math.max(data.length, 1)) + k * bw;
  const sh = (v) => (Math.abs(v) / maxVal) * ih;
  const labelStep = data.length > 24 ? Math.ceil(data.length / 12) : (data.length > 12 ? 2 : 1);

  // Retro bright colors
  const incomeColor = '#00ff99';  // bright green
  const expenseColor = '#ff3366'; // hot pink
  const netColor = '#ffcc00';     // golden yellow

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart" style={{background: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)'}}>
      {/* Grid pattern */}
      <defs>
        <pattern id="grid-bar" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(153,102,255,0.1)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x={padding} y={padding} width={iw} height={ih} fill="url(#grid-bar)" />

      {/* Baseline */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#330066" strokeWidth="3" />

      {/* Bars with 3D effect */}
      {data.map((d, i) => (
        <g key={d.month}>
          {/* Income bar */}
          <rect x={sx(i, 0)} y={height - padding - sh(d.income)} width={bw - 2} height={sh(d.income)}
                fill={incomeColor} stroke="#330066" strokeWidth="2" />
          <rect x={sx(i, 0)} y={height - padding - sh(d.income)} width={bw - 2} height="4"
                fill="rgba(255,255,255,0.5)" />

          {/* Expense bar */}
          <rect x={sx(i, 1)} y={height - padding - sh(d.expense)} width={bw - 2} height={sh(d.expense)}
                fill={expenseColor} stroke="#330066" strokeWidth="2" />
          <rect x={sx(i, 1)} y={height - padding - sh(d.expense)} width={bw - 2} height="4"
                fill="rgba(255,255,255,0.5)" />

          {/* Net bar */}
          <rect x={sx(i, 2)} y={height - padding - sh(d.net)} width={bw - 2} height={sh(d.net)}
                fill={netColor} stroke="#330066" strokeWidth="2" />
          <rect x={sx(i, 2)} y={height - padding - sh(d.net)} width={bw - 2} height="4"
                fill="rgba(255,255,255,0.5)" />

          {/* Month label */}
          {i % labelStep === 0 ? (
            <text x={padding + i * (iw / Math.max(data.length, 1)) + bw} y={height - padding + 20}
                  fontSize="12" fontWeight="bold" textAnchor="middle" fill="#330066">{d.month.slice(5)}</text>
          ) : null}
        </g>
      ))}

      {/* Legend */}
      {[
        { label: 'Income', color: incomeColor },
        { label: 'Expense', color: expenseColor },
        { label: 'Net', color: netColor }
      ].map((item, i) => (
        <g key={item.label} transform={`translate(${width - 120}, ${20 + i * 25})`}>
          <rect x="0" y="0" width="110" height="20" fill="white" stroke={item.color} strokeWidth="2" rx="4" />
          <rect x="5" y="5" width="15" height="10" fill={item.color} stroke="#330066" strokeWidth="1" />
          <text x="25" y="10" fontSize="10" fontWeight="bold" alignmentBaseline="middle" fill="#330066">{item.label}</text>
        </g>
      ))}
    </svg>
  );
};

const PieChart = ({ data, width = 280, height = 280 }) => {
  const r = Math.min(width, height) / 2 - 30;
  const cx = width / 2, cy = height / 2;
  const total = data.reduce((s, d) => s + (d.amount || 0), 0) || 1;
  let angle = -Math.PI / 2; // Start from top

  // Retro bright colors - more vibrant
  const colors = ['#9966ff', '#ff66cc', '#ffcc00', '#00ccff', '#00ff99', '#ff3366', '#cc00ff', '#ff9933'];

  const slices = data.map((d, i) => {
    const val = d.amount || 0;
    const a0 = angle;
    const a1 = angle + (val / total) * Math.PI * 2;
    angle = a1;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const dpath = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;

    // Calculate label position
    const midAngle = (a0 + a1) / 2;
    const labelR = r * 0.7;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { d: dpath, color: colors[i % colors.length], label: d.category, value: val, lx, ly, percent: ((val/total)*100).toFixed(0) };
  });

  return (
    <svg width={width} height={height} role="img" aria-label="Pie chart" style={{background: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)'}}>
      {/* Drop shadow for pie */}
      <ellipse cx={cx + 3} cy={cy + 3} rx={r + 3} ry={r + 3} fill="rgba(0,0,0,0.2)" />

      {/* Pie slices with borders */}
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill={s.color} stroke="#330066" strokeWidth="3" />
          {/* Percentage label on slice */}
          {s.percent > 5 && (
            <g>
              <circle cx={s.lx} cy={s.ly} r="18" fill="white" stroke={s.color} strokeWidth="3" />
              <text x={s.lx} y={s.ly} fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fill="#330066">
                {s.percent}%
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Center circle for donut effect */}
      <circle cx={cx} cy={cy} r={r * 0.4} fill="white" stroke="#330066" strokeWidth="3" />

      {/* Total in center */}
      <text x={cx} y={cy - 5} fontSize="14" fontWeight="bold" textAnchor="middle" fill="#330066">Total</text>
      <text x={cx} y={cy + 12} fontSize="18" fontWeight="bold" textAnchor="middle" fill="#9966ff">${total.toFixed(0)}</text>
    </svg>
  );
};

const Finance = () => {
  const queryClient = useQueryClient();
  const [txForm, setTxForm] = useState({ date: '', amount: '', type: 'expense', category: '', notes: '' });
  const [months, setMonths] = useState(12);

  // Planner state
  const [scenarioName, setScenarioName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [optionForm, setOptionForm] = useState({ name: '', monthly_delta: 0, one_time_delta: 0, start_month: '', months: '' });
  const [compare, setCompare] = useState(null);
  const [tab, setTab] = useState('overview');

  // Import/Export
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // Fetch finance summary with React Query
  const { data: summary = { balance: 0, monthly: [], category_breakdown: [], recent: [], timeseries: [] }, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance', 'summary', months],
    queryFn: async () => {
      const res = await fetch(`/backend/api/finance?months=${months}`, { credentials: 'include' });
      if (!res.ok) throw new Error('summary failed');
      return res.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Fetch transactions with React Query
  const { data: tx = [], isLoading: txLoading } = useQuery({
    queryKey: ['finance', 'transactions'],
    queryFn: async () => {
      const res = await fetch('/backend/api/finance/transactions', { credentials: 'include' });
      if (!res.ok) throw new Error('transactions failed');
      return res.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Fetch scenarios with React Query
  const { data: scenarios = [] } = useQuery({
    queryKey: ['finance', 'scenarios'],
    queryFn: async () => {
      const res = await fetch('/backend/api/finance/scenarios', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loading = summaryLoading || txLoading;

  const loadScenarioDetail = async (id) => {
    const res = await fetch(`/backend/api/finance/scenarios/${id}`, { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    setSelectedScenario(json);
  };
  const loadCompare = async (id, n = 12) => {
    const res = await fetch(`/backend/api/finance/scenarios/${id}/compare?n=${n}`, { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    setCompare(json);
  };

  // Mutation for adding transaction
  const addTxMutation = useMutation({
    mutationFn: async (txData) => {
      const res = await fetch('/backend/api/finance/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      if (!res.ok) throw new Error('Failed to add transaction');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'summary'] });
      setTxForm({ date: '', amount: '', type: 'expense', category: '', notes: '' });
    },
  });

  const addTx = async (e) => {
    e.preventDefault();
    const body = { ...txForm, amount: parseFloat(txForm.amount) };
    addTxMutation.mutate(body);
  };

  // Mutation for creating scenario
  const createScenarioMutation = useMutation({
    mutationFn: async (name) => {
      const res = await fetch('/backend/api/finance/scenarios', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to create scenario');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'scenarios'] });
      setScenarioName('');
    },
  });

  const createScenario = async (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;
    createScenarioMutation.mutate(scenarioName);
  };

  const addOption = async (e) => {
    e.preventDefault();
    if (!selectedScenario) return;
    const payload = { ...optionForm };
    if (payload.months === '') payload.months = null;
    const res = await fetch(`/backend/api/finance/scenarios/${selectedScenario.id}/options`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (res.ok) {
      setOptionForm({ name: '', monthly_delta: 0, one_time_delta: 0, start_month: '', months: '' });
      await loadScenarioDetail(selectedScenario.id);
      await loadCompare(selectedScenario.id);
    }
  };

  // Mutation for clearing finance data
  const clearFinanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/backend/api/finance/clear', {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to clear finance data');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      alert('Finance data cleared.');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const clearFinance = async () => {
    if (!window.confirm('This will permanently delete all your finance transactions and scenarios. Continue?')) return;
    clearFinanceMutation.mutate();
  };

  const monthlyData = summary.monthly || [];
  const pieData = useMemo(() => (summary.category_breakdown || []).slice(0, 8), [summary]);
  const timeseries = useMemo(() => ({
    series: [
      { name: 'Balance', data: (summary.timeseries || []).map(p => ({ x: p.month, y: p.balance })) }
    ]
  }), [summary]);

  return (
    <div className="finance-container">
      <h1>Finance</h1>

      <div className="tabs" style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        {['overview','transactions','planner','data'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="overview">
          <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Range:
              <select value={months} onChange={e=>setMonths(parseInt(e.target.value,10))}>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
              </select>
            </label>
          </div>
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="dashboard-card" style={{ padding: 12, background: '#fff8', borderRadius: 8 }}>
              <h2>Current Balance</h2>
              <p style={{ fontSize: 24 }}>{loading ? 'Loading…' : (summary.balance ?? 0)}</p>
            </div>
            <div className="dashboard-card" style={{ padding: 12, background: '#fff8', borderRadius: 8 }}>
              <h2>Monthly Income vs Expense</h2>
              {!loading && <BarChart data={monthlyData} />}
            </div>
            <div className="dashboard-card" style={{ padding: 12, background: '#fff8', borderRadius: 8 }}>
              <h2>Balance Over Time</h2>
              {!loading && <LineChart series={timeseries.series} />}
            </div>
            <div className="dashboard-card" style={{ padding: 12, background: '#fff8', borderRadius: 8 }}>
              <h2>Expenses by Category</h2>
              {!loading && <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <PieChart data={pieData} />
                <ul>
                  {pieData.map((d, i) => (
                    <li key={i}>{d.category}: {d.amount}</li>
                  ))}
                </ul>
              </div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="transactions">
          <h2>Add Transaction</h2>
          <form onSubmit={addTx} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', alignItems: 'end' }}>
            <label> Date
              <input type="date" value={txForm.date} onChange={e=>setTxForm(v=>({ ...v, date: e.target.value }))} required />
            </label>
            <label> Amount
              <input type="number" step="0.01" value={txForm.amount} onChange={e=>setTxForm(v=>({ ...v, amount: e.target.value }))} required />
            </label>
            <label> Type
              <select value={txForm.type} onChange={e=>setTxForm(v=>({ ...v, type: e.target.value }))}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label> Category
              <input value={txForm.category} onChange={e=>setTxForm(v=>({ ...v, category: e.target.value }))} placeholder="e.g., Groceries" />
            </label>
            <label> Notes
              <input value={txForm.notes} onChange={e=>setTxForm(v=>({ ...v, notes: e.target.value }))} />
            </label>
            <button type="submit">Add</button>
          </form>

          <h2 style={{ marginTop: 16 }}>Recent Transactions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Category</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {tx.map(row => (
                  <tr key={row.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{row.date}</td>
                    <td style={{ padding: 8, color: row.type==='income'? '#7cc5b8':'#f7a8c3' }}>{row.type}</td>
                    <td style={{ padding: 8 }}>{row.category || '—'}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{row.amount}</td>
                    <td style={{ padding: 8 }}>{row.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'planner' && (
        <div className="planner">
          <div className="card-grid">
            <div className="card">
              <h2>Scenarios</h2>
              <form onSubmit={createScenario} className="row">
                <input value={scenarioName} onChange={e=>setScenarioName(e.target.value)} placeholder="New scenario name" />
                <button type="submit">Create</button>
              </form>
              <ul className="list">
                {scenarios.map(s => (
                  <li key={s.id}>
                    <button type="button" className="linklike" onClick={async ()=>{ await loadScenarioDetail(s.id); await loadCompare(s.id); }}>
                      {s.name} ({s.options_count})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              {selectedScenario ? (
                <div>
                  <h2>{selectedScenario.name}</h2>
                  <h3>Add Option</h3>
                  <form onSubmit={addOption} className="grid5">
                    <label>Name
                      <input value={optionForm.name} onChange={e=>setOptionForm(v=>({ ...v, name: e.target.value }))} required />
                    </label>
                    <label>Monthly Δ
                      <input type="number" step="0.01" value={optionForm.monthly_delta} onChange={e=>setOptionForm(v=>({ ...v, monthly_delta: parseFloat(e.target.value || 0) }))} />
                    </label>
                    <label>One-time Δ
                      <input type="number" step="0.01" value={optionForm.one_time_delta} onChange={e=>setOptionForm(v=>({ ...v, one_time_delta: parseFloat(e.target.value || 0) }))} />
                    </label>
                    <label>Start (YYYY-MM)
                      <input value={optionForm.start_month} onChange={e=>setOptionForm(v=>({ ...v, start_month: e.target.value }))} placeholder="2025-09" />
                    </label>
                    <label>Months (optional)
                      <input type="number" value={optionForm.months} onChange={e=>setOptionForm(v=>({ ...v, months: e.target.value }))} />
                    </label>
                    <button type="submit">Add Option</button>
                  </form>

                  <h3 style={{ marginTop: 12 }}>Options</h3>
                  <ul className="list">
                    {(selectedScenario.options||[]).map(o => (
                      <li key={o.id}>{o.name} — monthly {o.monthly_delta}, one-time {o.one_time_delta} at {o.start_month}{o.months?`, for ${o.months} mo`:''}</li>
                    ))}
                  </ul>

                  <h3 style={{ marginTop: 12 }}>Comparison</h3>
                  {compare && <LineChart series={compare.series.map(s => ({ name: s.name, data: s.data.map(p => ({ x: p.x, y: p.y })) }))} />}
                </div>
              ) : (
                <p>Select a scenario to view details and comparisons.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="data">
          <div className="card-grid">
            <div className="card">
              <h2>Import CSV</h2>
              <p>Paste CSV from your bank export or choose a file. Supported formats include Amount or Debit/Credit columns; dates like YYYY-MM-DD or MM/DD/YYYY.</p>
              <div className="row">
                <input type="file" accept=".csv,text/csv" onChange={async (e)=>{
                  const f = e.target.files?.[0]; if (!f) return; const text = await f.text(); setImportText(text);
                }} />
                <button disabled={!importText || importing} onClick={async ()=>{
                  try { setImporting(true);
                    const res = await fetch('/backend/api/finance/import', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: importText }) });
                    const json = await res.json();
                    if (res.ok && json?.ok) {
                      queryClient.invalidateQueries({ queryKey: ['finance', 'transactions'] });
                      queryClient.invalidateQueries({ queryKey: ['finance', 'summary'] });
                      alert(`Imported ${json.imported} rows`);
                      setImportText('');
                    } else {
                      alert(json?.error || 'Import failed');
                    }
                  } finally { setImporting(false); }
                }}>Import</button>
              </div>
              <textarea rows={10} placeholder="Paste CSV here" value={importText} onChange={e=>setImportText(e.target.value)} />
            </div>
            <div className="card">
              <h2>Export CSV</h2>
              <p>Download your current transactions as CSV.</p>
              <button onClick={async ()=>{
                const res = await fetch('/backend/api/finance/export', { credentials: 'include' });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'transactions.csv';
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
              }}>Download CSV</button>
            </div>
            <div className="card">
              <h2>Danger Zone</h2>
              <p>Clear all your finance transactions and planner scenarios.</p>
              <button onClick={clearFinance} style={{ background: '#e76f51' }}>Clear My Finance Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;