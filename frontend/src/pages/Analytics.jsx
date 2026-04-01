import { BarChart3, TrendingUp, PieChart, Target, Zap, Clock, Code2, ShieldCheck } from 'lucide-react';
import './Analytics.css';

export default function Analytics() {
  const complexityData = [
    { label: 'Low', value: 65, color: 'var(--success)' },
    { label: 'Medium', value: 25, color: 'var(--warning)' },
    { label: 'High', value: 10, color: 'var(--danger)' },
  ];

  const languageData = [
    { label: 'Python', value: 58 },
    { label: 'JavaScript', value: 32 },
    { label: 'Java', value: 7 },
    { label: 'C++', value: 3 },
  ];

  // Detailed Trend Data (Presentation Mode)
  const trendData = [65, 68, 72, 70, 75, 78, 80, 85, 88, 92, 95];
  const benchmarkLine = 80;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-title">
          <BarChart3 size={24} className="text-accent" />
          <h1>Code Quality Insights</h1>
        </div>
        <p>Deep-dive into your architectural trends and complexity distribution.</p>
      </div>

      <div className="analytics-grid">
        {/* Maintainability Historical Deep-Dive */}
        <div className="chart-card wide">
          <div className="card-header">
            <h3>Maintainability Historical Deep-Dive</h3>
            <div className="time-filter">Detailed Q1 Analysis</div>
          </div>
          <div className="trend-viz">
            <div className="trend-y-axis">
              <span>100</span>
              <span className="benchmark-marker">80 (Avg)</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="trend-bars">
              {/* Benchmark Overlay */}
              <div className="benchmark-overlay" style={{ bottom: `${benchmarkLine}%` }}></div>
              
              {trendData.map((val, i) => (
                <div key={i} className="trend-bar-wrapper">
                  <div 
                    className={`trend-bar ${val >= benchmarkLine ? 'above-bm' : ''}`} 
                    style={{ height: `${val}%` }}
                  >
                    <div className="trend-tooltip">{val} MI</div>
                    {i === trendData.length - 1 && (
                      <div className="audit-tag">Elite</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complexity Distribution */}
        <div className="chart-card">
          <div className="card-header">
            <h3>Complexity Distribution</h3>
          </div>
          <div className="complexity-viz">
            <div className="donut-chart">
              <div className="donut-segment segment-1"></div>
              <div className="donut-segment segment-2"></div>
              <div className="donut-center">
                <span className="center-val">142</span>
                <span className="center-lab">Files</span>
              </div>
            </div>
            <div className="complexity-legend">
              {complexityData.map(item => (
                <div key={item.label} className="legend-item">
                  <div className="legend-dot" style={{ background: item.color }}></div>
                  <span className="legend-label">{item.label}</span>
                  <span className="legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="chart-card">
          <div className="card-header">
            <h3>Language Popularity</h3>
          </div>
          <div className="language-viz">
            {languageData.map(lang => (
              <div key={lang.label} className="lang-row">
                <div className="lang-info">
                  <span>{lang.label}</span>
                  <span>{lang.value}%</span>
                </div>
                <div className="lang-bar-bg">
                  <div className="lang-bar-fill" style={{ width: `${lang.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency KPIs */}
        <div className="kpi-banner">
          <div className="kpi-item">
            <Clock size={20} />
            <div>
              <div className="kpi-val">1.2m</div>
              <div className="kpi-lab">Total Dev Time Saved</div>
            </div>
          </div>
          <div className="kpi-item">
            <Zap size={20} />
            <div>
              <div className="kpi-val">84</div>
              <div className="kpi-lab">AI Optimization Cycles</div>
            </div>
          </div>
          <div className="kpi-item">
             <ShieldCheck size={20} />
            <div>
              <div className="kpi-val">95%</div>
              <div className="kpi-lab">Code Health Target</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
