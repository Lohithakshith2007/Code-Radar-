import { useState, useRef, useCallback, useEffect } from "react";
import { Play, RotateCcw, Brain, Activity, Zap, Shield, Search, Code } from "lucide-react";
import { apiFetch, responseError } from "../lib/api";
import FormattedResponse from "../components/FormattedResponse";

export default function Dashboard() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatMessagesRef = useRef(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Sync scroll
  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [chatMessages, isChatOpen]);

  const analyzeCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAiSuggestion(null);
    setIsChatOpen(false);
    setChatMessages([]);

    try {
      const res = await apiFetch("/analyze/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw await responseError(res, "Analysis failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const getAiSuggestion = async () => {
    if (!code.trim() || !result) return;
    setAiLoading(true);

    try {
      const res = await apiFetch("/suggest/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, metrics: result }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
      }
    } catch {
      setAiSuggestion({
        suggestion: "Failed to get AI suggestions. Make sure the backend is running.",
        source: "error",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !result) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await apiFetch("/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, metrics: result, history, message: userMsg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lineCount = Math.max(code.split("\n").length, 25);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="dashboard-layout">
      {/* Code Editor Panel */}
      <div className="editor-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Code size={16} className="text-muted" />
            Code Editor
          </div>
          <span className="language-badge">{result?.language || "Python"}</span>
        </div>

        <div className="code-editor-wrapper">
          <div className="line-numbers" ref={lineNumbersRef}>
            {lines.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here...&#10;&#10;function calculateTotal(items) {&#10;    return items.reduce((acc, item) => acc + item.price, 0);&#10;}"
            spellCheck={false}
          />
        </div>

        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={analyzeCode}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <><span className="spinner-small" /> Analyzing...</>
            ) : (
              <><Play size={16} /> Analyze Code</>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setCode("");
              setResult(null);
              setAiSuggestion(null);
              setError(null);
            }}
            disabled={!code}
          >
            <RotateCcw size={16} /> Clear
          </button>
          <span className="char-count">
            {code.length} chars · {code.split("\n").length} lines
          </span>
        </div>
      </div>

      {/* Analysis Results Panel */}
      <div className="results-panel">
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!result && !loading && (
          <div className="results-empty">
            <Activity size={48} className="results-empty-icon" />
            <h3>Awaiting Analysis</h3>
            <p>Paste your code and click Analyze to generate machine learning predictions and metrics.</p>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner large"></div>
            <p>Scoring code complexity via ML model...</p>
          </div>
        )}

        {result && !loading && (
          <div className="results-content">
            {/* ML Prediction Banner */}
            {result.ml_prediction && (
              <div className="ml-banner">
                <div className="ml-header">
                  <Brain className="ml-icon" />
                  <h4>ML Prediction Model</h4>
                </div>
                <div className="ml-prediction-body">
                  <div className="ml-pill">
                    <span className="ml-label">Prediction:</span>
                    <span className={`badge score-${result.ml_prediction.toLowerCase()}`}>
                      {result.ml_prediction} Complexity
                    </span>
                  </div>
                  <div className="ml-pill">
                    <span className="ml-label">Confidence:</span>
                    <strong className="text-white">{result.ml_confidence}%</strong>
                  </div>
                </div>
                <div className="ml-probs">
                  {Object.entries(result.ml_probabilities || {}).map(([label, prob]) => (
                    <div key={label} className="prob-bar-container">
                      <div className="prob-label">{label}</div>
                      <div className="prob-bar-bg">
                        <div 
                          className={`prob-bar-fill fill-${label.toLowerCase()}`}
                          style={{ width: `${prob}%` }}
                        />
                      </div>
                      <div className="prob-val">{prob}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="metrics-section">
              <div className="section-label">Structural Metrics</div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Lines of Code</div>
                  <div className="metric-value">{result.loc?.total_lines || 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Maintainability</div>
                  <div className="metric-value">
                    {result.maintainability_index}
                    <span className="metric-unit">MI</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Avg. Cyclomatic</div>
                  <div className="metric-value">
                    {result.avg_complexity}
                    <span className="metric-unit">CC</span>
                  </div>
                </div>
                {result.halstead?.volume && (
                   <div className="metric-card">
                     <div className="metric-label">Halstead Volume</div>
                     <div className="metric-value">{result.halstead.volume}</div>
                   </div>
                )}
              </div>
            </div>

            {/* AI Refactoring Panel */}
            <div className="ai-section">
              <div className="section-label">Groq AI Refactoring</div>
              {!aiSuggestion && !aiLoading && (
                <button
                  className="ai-trigger btn btn-primary"
                  onClick={getAiSuggestion}
                >
                  <Zap size={16} /> Generate AI Suggestions (Llama 3.3)
                </button>
              )}
              
              {aiLoading && (
                <div className="ai-loading">
                  <div className="spinner small"></div>
                  Generating high-speed suggestions via Groq LPU...
                </div>
              )}
              
              {aiSuggestion && (
                <div className="ai-result-box">
                  <div className="ai-response">
                    <FormattedResponse text={aiSuggestion.suggestion} />
                  </div>
                  <div className="ai-source-badge">
                    {aiSuggestion.source === "groq" ? <Zap size={12} /> : <Shield size={12} />}
                    {aiSuggestion.source === "groq" ? "Powered by Groq" : "Rule-based analysis"}
                  </div>
                </div>
              )}

              {/* Chat Interface 'Ask More' */}
              {aiSuggestion && !isChatOpen && (
                <button
                  className="ai-trigger btn btn-secondary mt-3"
                  onClick={() => setIsChatOpen(true)}
                  style={{ marginTop: '16px' }}
                >
                  💬 Ask More about this code
                </button>
              )}

              {isChatOpen && (
                <div className="chat-container">
                  <div className="chat-header">
                    <h4>Discussion</h4>
                    <span className="chat-badge text-muted">Powered by Groq</span>
                  </div>
                  
                  <div className="chat-messages" ref={chatMessagesRef}>
                    <div className="chat-message assistant">
                      <div className="chat-bubble">
                        I'm your AI coding assistant. What specific questions do you have about the complexity or the refactoring suggestions?
                      </div>
                    </div>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="chat-bubble"><FormattedResponse text={msg.content} /></div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="chat-message assistant">
                        <div className="chat-bubble loading"><span className="spinner small"></span> Thinking...</div>
                      </div>
                    )}
                  </div>

                  <form className="chat-input-area" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      placeholder="Ask about your code..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button type="submit" disabled={!chatInput.trim() || chatLoading} className="btn-chat-send">
                      Send
                    </button>
                  </form>
                </div>
              )}

            </div>
            
            <div className="spacer-bottom"></div>
          </div>
        )}
      </div>
    </div>
  );
}
