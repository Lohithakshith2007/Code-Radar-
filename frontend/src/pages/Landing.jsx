import { Link } from 'react-router-dom';
import { Shield, Zap, Brain, Code2, ArrowRight, Code, Activity, Layers } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Background Decorative Elements */}
      <div className="glow-sphere sphere-1"></div>
      <div className="glow-sphere sphere-2"></div>
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-pulse"></span>
          Intelligent code insights, at a glance
        </div>
        <h1 className="hero-title">
          Understand Your Code <br />
          <span className="text-gradient">Faster Than Ever</span>
        </h1>
        <p className="hero-subtitle">
          Instantly evaluate any language structure, predict maintainability using AST feature extraction,
          and get actionable refactoring advice powered by gpt oss 120b.
        </p>
        <div className="hero-cta">
          <Link to="/dashboard" className="btn btn-primary btn-large cta-glow">
            Start Analyzing <ArrowRight size={18} />
          </Link>
          <a href="https://github.com/Lohithakshith2007/Code-Radar-" target="_blank" rel="noreferrer" className="btn btn-secondary btn-large">
            <Code size={18} /> View Source
          </a>
        </div>
      </section>

      {/* Glassmorphism Stats Bar */}
      <section className="stats-glass-bar">
        <div className="stat-glass-item">
          <h4 className="stat-number">12+</h4>
          <p className="stat-text">Structural ML Features</p>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-glass-item">
          <h4 className="stat-number">&lt;1s</h4>
          <p className="stat-text">AI Inference Speed</p>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-glass-item">
          <h4 className="stat-number">Any</h4>
          <p className="stat-text">Language Supported</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="features-header">
          <h2 className="section-title">Built for Modern Developers</h2>
          <p className="section-desc">Everything you need to write cleaner, more maintainable code without the hassle.</p>
        </div>
        <div className="features-grid">

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper"><Brain size={24} /></div>
            <h3>Machine Learning Engine</h3>
            <p>Trained RandomForest classifier accurately predicts complexity from 12 distinct code structure metrics.</p>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper"><Zap size={24} /></div>
            <h3>Instant Refactoring</h3>
            <p>Powered by Groq Llama 3.3, get actionable, context-aware code suggestions at 800+ tokens per second.</p>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-wrapper"><Layers size={24} /></div>
            <h3>Multi-Language Analysis</h3>
            <p>Dynamic detection handles Python, JS, Java, and C++, seamlessly switching rules based on language.</p>
          </div>
          
          <div className="feature-card-modern">
            <div className="feature-icon-wrapper"><Shield size={24} /></div>
            <h3>Maintainability Scoring</h3>
            <p>Industry-standard Halstead and McCabe metrics integrated directly alongside the ML predictions.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
