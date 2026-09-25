import useAuth from '../context/useAuth';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  History,
  PieChart,
  Zap,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Activity
} from 'lucide-react';
import './SaaSDashboard.css';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function SaasDashboard() {
  const { user } = useAuth();

  const [recentActivity, setRecentActivity] = useState([]);
  useEffect(() => {
    apiFetch('/history/').then(response => response.ok ? response.json() : []).then(setRecentActivity).catch(() => setRecentActivity([]));
  }, []);

  const avgComplexity = recentActivity.length
    ? (recentActivity.reduce((sum, item) => sum + Number(item.metrics?.avg_complexity || 0), 0) / recentActivity.length).toFixed(1)
    : '—';
  const avgHealth = recentActivity.length
    ? `${Math.round(recentActivity.reduce((sum, item) => sum + Number(item.metrics?.maintainability_index || 0), 0) / recentActivity.length)}%`
    : '—';
  const stats = [
    { label: 'Recent Analyses', value: recentActivity.length, icon: Code2, color: 'text-accent' },
    { label: 'Avg. Complexity', value: avgComplexity, icon: TrendingUp, color: 'text-success' },
    { label: 'Refactors Done', value: '—', icon: Zap, color: 'text-warning' },
    { label: 'Avg. Maintainability', value: avgHealth, icon: CheckCircle2, color: 'text-primary' },
  ];

  const trendPoints = recentActivity.length
    ? recentActivity.slice(0, 11).reverse().map(item => Number(item.metrics?.maintainability_index || 0))
    : [0];
  const targetLine = 80;

  return (
    <div className="saas-dashboard">
      <header className="dashboard-hero">
        <div className="welcome-section">
          <h1>Welcome back, <span className="text-gradient">{user?.username}</span></h1>
          <p>Your code health is looking strong today. You have 3 new refactoring suggestions available.</p>
        </div>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary btn-large">
            <Code2 size={20} /> New Analysis <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      {/* Health Score Summary Sparkline */}
      <div className="dashboard-trend-card">
        <div className="trend-header">
          <div className="trend-title">
            <Activity size={18} className="text-accent" />
            <h3>Maintainability Trend</h3>
          </div>
          <div className="trend-badge">80 MI benchmark</div>
        </div>
        <div className="sparkline-container">
          <div className="sparkline spark-summary">
            {/* Goal Line Overlay */}
            <div className="goal-line-overlay" style={{ bottom: `${targetLine}%` }}>
            </div>
            {trendPoints.map((p, i) => (
              <div
                key={i}
                className="spark-dot-wrapper"
              >
                <div
                  className={`spark-dot ${p >= targetLine ? 'at-goal' : ''}`}
                  style={{ bottom: `${p}%` }}
                >
                  <div className="spark-tooltip">{p}% MI</div>
                  {i === trendPoints.length - 1 && (
                    <div className="current-status-tag">Current</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="sparkline-labels">
            <span>Critical</span>
            <span>Stable</span>
            <span>Optimal</span>
          </div>
        </div>
      </div>

      <div className="stats-grid-modern">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card-modern">
            <div className={`stat-icon-wrapper ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <section className="activity-section">
          <div className="section-header-compact">
            <h3>Recent Activity</h3>
            <Link to="/history">View All</Link>
          </div>
          <div className="activity-list">
            {recentActivity.slice(0, 5).map(item => (
              <div key={item.id} className="activity-item">
                <div className="activity-info">
                  <div className="activity-avatar">{(item.metrics?.language || 'C')[0]}</div>
                  <div>
                    <div className="activity-title">{item.code_snippet.split('\n')[0].slice(0, 36) || 'Code analysis'}</div>
                    <div className="activity-meta">{item.metrics?.language || 'Code'} • {new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <span className={`badge score-${(item.score || 'low').toLowerCase()}`}>{item.score}</span>
              </div>
            ))}
          </div>
          {recentActivity.length === 0 && <p className="activity-empty">Your completed analyses will appear here.</p>}
        </section>

        <section className="insights-card">
          <div className="insights-header">
            <Zap size={20} className="text-warning" />
            <h3>AI Insights</h3>
          </div>
          <div className="insights-body">
            <div className="insight-entry">
              <AlertCircle size={16} className="text-warning" />
              <p>Your <strong>Auth Middleware</strong> has several nested loops that could be simplified.</p>
            </div>
            <div className="insight-entry">
              <CheckCircle2 size={16} className="text-success" />
              <p>Nice work! Your <strong>React UI Utils</strong> follows all maintainability best practices.</p>
            </div>
          </div>
          <Link to="/analytics" className="insights-cta">
            View Deep Analytics <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
