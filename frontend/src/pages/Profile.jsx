import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Settings, 
  Bell, 
  Lock, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Globe,
  Database
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Account Details');
  
  // Local form state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [is2FAEnabled, setIs2FAEnabled] = useState(true); // Default to on for demo
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Settings updated successfully!');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [showPass, setShowPass] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  // Preferences
  const [prefs, setPrefs] = useState({ theme: 'Dark', lang: 'Python', notify: true });

  // Theme Switching Logic
  useEffect(() => {
    if (prefs.theme === 'Light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [prefs.theme]);

  if (!user) return null;

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      login({ ...user, username, email });
      setIsSaving(false);
      triggerToast('Profile updated successfully!');
    }, 800);
  };

  const handlePassChange = (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      alert("Passwords do not match!");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPasswords({ current: '', next: '', confirm: '' });
      triggerToast('Password changed successfully!');
    }, 1000);
  };

  const navItems = [
    { label: 'Account Details', icon: User },
    { label: 'Notifications', icon: Bell },
    { label: 'Security', icon: Shield },
    { label: 'Preferences', icon: Settings },
  ];

  return (
    <div className="profile-container">
      <div className={`profile-toast ${showToast ? 'show' : ''}`}>
        <CheckCircle2 size={18} />
        <span>{toastMsg}</span>
      </div>

      <div className="profile-grid">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-user-info">
            <div className="profile-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <h3>{user.username}</h3>
            <p>{user.email}</p>
          </div>
          
          <nav className="profile-nav">
            {navItems.map(item => (
              <button 
                key={item.label}
                className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
            <div className="nav-divider"></div>
            <button className="nav-item logout" onClick={logout}>
              <LogOut size={18} /> Log Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          
          {/* TAB: Account Details */}
          {activeTab === 'Account Details' && (
            <form className="profile-section" onSubmit={handleSave}>
              <div className="section-header-row">
                <div className="section-title-group">
                  <h2>Account Settings</h2>
                  <p>Manage your account preferences and personal information.</p>
                </div>
                <button type="submit" className="btn btn-primary btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <div className="card-header">
                    <User size={20} className="text-accent" />
                    <h4>Personal Profile</h4>
                  </div>
                  <div className="settings-inputs">
                    <div className="input-group">
                      <label>Full Name</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-header">
                    <Calendar size={20} className="text-secondary" />
                    <h4>Usage Statistics</h4>
                  </div>
                  <div className="usage-stats">
                    <div className="stat-row">
                      <span>Member Since</span>
                      <strong>April 2024</strong>
                    </div>
                    <div className="stat-row">
                      <span>Analyses Done</span>
                      <strong>142</strong>
                    </div>
                    <div className="stat-row">
                       <span className="badge-pro">Pro Plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'Notifications' && (
            <div className="profile-section">
              <div className="section-header-row">
                <div className="section-title-group">
                  <h2>Notifications</h2>
                  <p>Stay updated on your code health and AI suggestions.</p>
                </div>
              </div>
              <div className="settings-card full-width">
                <div className="card-header">
                   <Bell size={20} className="text-accent" />
                   <h4>Notification Channels</h4>
                </div>
                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <h5>Email Notifications</h5>
                      <p>Receive reports when your code is analyzed.</p>
                    </div>
                    <input type="checkbox" className="toggle-switch" checked={prefs.notify} onChange={() => { setPrefs({...prefs, notify: !prefs.notify}); triggerToast('Preference saved!'); }} />
                  </div>
                  <div className="toggle-item">
                    <div>
                      <h5>Weekly Summaries</h5>
                      <p>Receive a weekly review of your code complexity trends.</p>
                    </div>
                    <input type="checkbox" className="toggle-switch" defaultChecked />
                  </div>
                  <div className="toggle-item">
                    <div>
                      <h5>AI Optimization Alerts</h5>
                      <p>Get notified when Groq identifies severe nested loops.</p>
                    </div>
                    <input type="checkbox" className="toggle-switch" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Security */}
          {activeTab === 'Security' && (
            <div className="profile-section">
              <div className="section-header-row">
                <div className="section-title-group">
                  <h2>Security</h2>
                  <p>Secure your account with multi-factor authentication and passwords.</p>
                </div>
              </div>

              <div className={`security-card ${is2FAEnabled ? 'active-border' : ''}`}>
                <div className="security-info">
                  <Shield size={24} className={is2FAEnabled ? 'text-success' : 'text-muted'} />
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <button 
                  className={`btn ${is2FAEnabled ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                  onClick={() => {
                    setIs2FAEnabled(!is2FAEnabled);
                    triggerToast(is2FAEnabled ? '2FA disabled' : '2FA enabled');
                  }}
                >
                  {is2FAEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="settings-card mt-6">
                <div className="card-header">
                  <Lock size={20} className="text-warning" />
                  <h4>Change Password</h4>
                </div>
                <form className="settings-inputs" onSubmit={handlePassChange}>
                  <div className="input-group">
                    <label>Current Password</label>
                    <div className="pass-input-wrapper">
                      <input type={showPass ? 'text' : 'password'} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>New Password</label>
                    <input type={showPass ? 'text' : 'password'} value={passwords.next} onChange={(e) => setPasswords({...passwords, next: e.target.value})} placeholder="••••••••" required />
                  </div>
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <input type={showPass ? 'text' : 'password'} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" required />
                  </div>
                  <div className="pass-actions">
                     <button type="button" className="btn btn-text" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />} 
                        {showPass ? 'Hide Passwords' : 'Show Passwords'}
                     </button>
                     <button type="submit" className="btn btn-primary" disabled={isSaving}>Update Password</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: Preferences */}
          {activeTab === 'Preferences' && (
            <div className="profile-section">
              <div className="section-header-row">
                <div className="section-title-group">
                  <h2>App Preferences</h2>
                  <p>Customize your workspace experience.</p>
                </div>
              </div>
              <div className="settings-grid">
                <div className="settings-card">
                   <div className="card-header">
                      <Sun size={20} className="text-warning" />
                      <h4>Theme Appearance</h4>
                   </div>
                   <div className="pref-selector">
                      <button className={`pref-btn ${prefs.theme === 'Dark' ? 'active' : ''}`} onClick={() => setPrefs({...prefs, theme: 'Dark'})}>Dark</button>
                      <button className={`pref-btn ${prefs.theme === 'Light' ? 'active' : ''}`} onClick={() => setPrefs({...prefs, theme: 'Light'})}>Light</button>
                      <button className={`pref-btn ${prefs.theme === 'System' ? 'active' : ''}`} onClick={() => setPrefs({...prefs, theme: 'System'})}>System</button>
                   </div>
                </div>
                <div className="settings-card">
                   <div className="card-header">
                      <Globe size={20} className="text-accent" />
                      <h4>Default Language</h4>
                   </div>
                   <div className="pref-selector">
                      <button className={`pref-btn ${prefs.lang === 'Python' ? 'active' : ''}`} onClick={() => setPrefs({...prefs, lang: 'Python'})}>Python</button>
                      <button className={`pref-btn ${prefs.lang === 'JavaScript' ? 'active' : ''}`} onClick={() => setPrefs({...prefs, lang: 'JavaScript'})}>NodeJS</button>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
