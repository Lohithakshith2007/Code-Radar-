import { Code } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-icon small">⚡</div>
          <span>Code Radar</span>
        </div>
        <p className="footer-text">
          AI & ML Code Complexity Analyzer Built for Developers. <br/>
          Powered by scikit-learn and Groq.
        </p>
        <div className="footer-links">
          <a href="#" className="social-link">
            <Code size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
