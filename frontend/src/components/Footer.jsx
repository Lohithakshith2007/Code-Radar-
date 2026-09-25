import { Activity, Code } from 'lucide-react';
import useAuth from '../context/useAuth';
import './Footer.css';

export default function Footer() {
  const { user, loading } = useAuth();
  if (user || loading) return null;

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-icon small"><Activity size={18} /></div>
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
