import { useState, useEffect } from "react";
import { Search, Trash2, Code, Activity, Brain } from "lucide-react";
import "./History.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all history?")) return;
    try {
      await fetch(`${API_BASE}/history/clear/`, { method: "DELETE" });
      setHistory([]);
    } catch {
      // silently fail
    }
  };

  const formatTime = (isoStr) => {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d);
  };

  const filteredHistory = history.filter(item => 
    item.code_snippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="history-page loading-state">
        <div className="spinner large"></div>
        <p>Loading analysis history...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header-main">
        <div>
          <h1>Analysis History</h1>
          <p>Review your past code complexity analyses across all sessions.</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-danger" onClick={clearHistory}>
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      <div className="history-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search code snippets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="history-empty-state">
          <Activity size={48} className="empty-icon" />
          <h2>No results found</h2>
          <p>{history.length === 0 ? "You haven't analyzed any code yet." : "No snippets matched your search."}</p>
        </div>
      ) : (
        <div className="history-grid">
          {filteredHistory.map((item) => (
            <div key={item.id} className="history-card">
              <div className="history-card-header">
                <span className={`badge score-${item.score.toLowerCase()}`}>
                  {item.score}
                </span>
                <span className="history-date">{formatTime(item.created_at)}</span>
              </div>
              
              <div className="history-code-preview">
                <code>
                  {item.code_snippet.split('\n').slice(0, 5).join('\n')}
                  {item.code_snippet.split('\n').length > 5 && '\n...'}
                </code>
              </div>

              <div className="history-metrics-mini">
                <div className="mini-metric">
                  <Code size={14} /> CC: {item.metrics?.avg_complexity || 'N/A'}
                </div>
                <div className="mini-metric">
                  <Activity size={14} /> MI: {item.metrics?.maintainability_index || 'N/A'}
                </div>
                {item.metrics?.ml_confidence && (
                  <div className="mini-metric">
                    <Brain size={14} /> ML Conf: {item.metrics.ml_confidence}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
