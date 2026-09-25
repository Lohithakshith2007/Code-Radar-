import { useState, useEffect } from "react";
import { Search, Trash2, Code, Activity, Brain, X } from "lucide-react";
import { apiFetch } from "../lib/api";
import "./History.css";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/history/");
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
    try {
      const response = await apiFetch("/history/clear/", { method: "DELETE" });
      if (response.ok) setHistory([]);
    } catch {
      // silently fail
    }
    setShowClearDialog(false);
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
          <button className="btn btn-danger" onClick={() => setShowClearDialog(true)}>
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
      {showClearDialog && (
        <div className="history-modal-backdrop" role="presentation" onClick={() => setShowClearDialog(false)}>
          <section className="history-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-history-title" onClick={event => event.stopPropagation()}>
            <button className="history-modal-close" aria-label="Close" onClick={() => setShowClearDialog(false)}><X size={18} /></button>
            <div className="history-modal-icon"><Trash2 size={22} /></div>
            <h2 id="clear-history-title">Clear your history?</h2>
            <p>This will permanently remove all saved code analysis records.</p>
            <div className="history-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearDialog(false)}>Keep history</button>
              <button className="btn btn-danger" onClick={clearHistory}>Clear all</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
