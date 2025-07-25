import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Result {
  text: string;
  label: string;
  confidence: number;
  neutral_conf: number;
  negative_conf: number;
  positive_conf: number;
}

interface HistoryItem {
  text: string;
  label: string;
  confidence: number;
  neutral_conf: number;
  negative_conf: number;
  positive_conf: number;
}

const HISTORY_KEY = 'sentiment_history';

const labelColor = (label: string) => {
  if (label === 'neutral') return 'rgba(54, 162, 235, 1)';
  if (label === 'negative') return 'rgba(255, 99, 132, 1)';
  if (label === 'positive') return 'rgba(75, 192, 192, 1)';
  return '#333';
};

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post('/api/predict', { text });
      setResult(res.data);
      const newItem: HistoryItem = {
        text: res.data.text,
        label: res.data.label,
        confidence: res.data.confidence,
        neutral_conf: res.data.neutral_conf,
        negative_conf: res.data.negative_conf,
        positive_conf: res.data.positive_conf,
      };
      setHistory(prev => [...prev, newItem]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Chart data for vertical line chart (only one line, each node is the max prob, color by predicted label)
  const chartLabels = history.map((_, idx) => `#${idx + 1}`);
  const maxProbs = history.map(item => {
    const max = Math.max(item.neutral_conf, item.negative_conf, item.positive_conf);
    return max;
  });
  const pointColors = history.map(item => labelColor(item.label));
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Predicted Max Probability',
        data: maxProbs,
        borderColor: 'rgba(0,0,0,0.7)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        pointBackgroundColor: pointColors,
        pointRadius: 7,
        pointHoverRadius: 10,
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const idx = context.dataIndex;
            const item = history[idx];
            return `${item.label} (${(maxProbs[idx] * 100).toFixed(2)}%)`;
          }
        }
      }
    },
    layout: {
      padding: 0
    },
    scales: {
      x: {
        min: 0,
        max: 1.2,
        title: { display: false },
      },
      y: {
        title: { display: false },
        ticks: { padding: 0 },
      },
    },
  };

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: 24, fontFamily: 'Calibri, Arial, sans-serif' }}>
      <h1>FinBERT Sentiment Analysis</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <label htmlFor="text" style={{ display: 'block', marginBottom: 8 }}>
          Enter financial text (English):
        </label>
        <textarea
          id="text"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          style={{ width: '100%', height: 200, marginBottom: 12 }}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 24px' }}>
          {loading ? 'Analyzing...' : 'Submit'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
        {/* Left: History Table */}
        <div style={{ flex: 1 }}>
          <h2>Prediction History</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ height: 40 }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Text</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Label</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Confidence</th>
                {/* <th style={{ textAlign: 'left', padding: 4 }}>Neutral</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Negative</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Positive</th> */}
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={idx} style={{ height: 48 }}>
                  <td style={{ padding: 0, borderBottom: '1px solid #eee', maxWidth: 400, wordBreak: 'break-word' }}>{item.text}</td>
                  <td style={{ padding: 0, borderBottom: '1px solid #eee', color: labelColor(item.label) }}>{item.label}</td>
                  <td style={{ padding: 0, borderBottom: '1px solid #eee', width: 50 }}>{item.confidence}</td>
                  {/* <td style={{ padding: 0, borderBottom: '1px solid #eee' }}>{item.neutral_conf}</td>
                  <td style={{ padding: 0, borderBottom: '1px solid #eee' }}>{item.negative_conf}</td>
                  <td style={{ padding: 0, borderBottom: '1px solid #eee' }}>{item.positive_conf}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Right: Vertical Line Chart */}
        <div style={{ width: 350, minHeight: 300, marginTop: 120 }}>
          <Line key={history.length} data={chartData} options={chartOptions} height={history.length * 47 + 2 } />
        </div>
      </div>
    </main>
  );
} 