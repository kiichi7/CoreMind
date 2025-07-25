import React from 'react';
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

interface HistoryItem {
  neutral: number;
  negative: number;
  positive: number;
}

interface SentimentChartsProps {
  history: HistoryItem[];
}

const SentimentCharts: React.FC<SentimentChartsProps> = ({ history }) => {
  const labels = history.map((_, idx) => `#${idx + 1}`);
  const data = {
    labels,
    datasets: [
      {
        label: 'Neutral',
        data: history.map(item => item.neutral),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Negative',
        data: history.map(item => item.negative),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Positive',
        data: history.map(item => item.positive),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.3,
      },
    ],
  };

  return (
    <div>
      <h3>Prediction History (Line Chart)</h3>
      <Line data={data} options={{ responsive: true }} />
    </div>
  );
};

export default SentimentCharts; 