import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, History, Info, LogIn, User, Smartphone, PieChart, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();

  // Visitor Navigation
  const publicItems = [
    { path: '/', label: 'Home', icon: Activity },
    { path: '/about', label: 'About ML', icon: Info },
  ];

  // Workspace Navigation (After Login)
  const privateItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard', label: 'Analyzer', icon: Code2 },
    { path: '/history', label: 'History', icon: History },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
  ];

  const currentItems = user ? privateItems : publicItems;

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">
          <Activity size={20} />
        </div>
        <h1>Code Radar <span>v2</span></h1>
      </Link>
      
      <nav className="navbar-links">
        {currentItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="navbar-actions">
        {user ? (
          <Link to="/profile" className="profile-pill">
            <div className="profile-circle">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <span>{user.username}</span>
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm login-btn">
            <LogIn size={16} /> Log In
          </Link>
        )}
      </div>
    </header>
  );
}
