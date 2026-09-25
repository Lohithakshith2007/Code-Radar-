import { useState, useEffect } from 'react';
import useAuth from '../context/useAuth';
import { apiFetch, responseError, setAuthToken } from '../lib/api';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Settings, 
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
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Account Details');
  
  // Local form state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Settings updated successfully!');
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [showPass, setShowPass] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  // Preferences
  const [prefs, setPrefs] = useState(() => {
    try {
      return { theme: 'Dark', lang: 'Python', ...JSON.parse(localStorage.getItem('code_radar_preferences') || '{}') };
    } catch {
      return { theme: 'Dark', lang: 'Python' };
    }
  });

  useEffect(() => {
    let active = true;
    apiFetch('/auth/me/').then(async (response) => {
      if (!response.ok) return;
      const freshUser = await response.json();
      if (active) {
        updateUser(freshUser);
        setUsername(freshUser.username);
        setEmail(freshUser.email);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [updateUser]);

  // Theme Switching Logic
  useEffect(() => {
    if (prefs.theme === 'Light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [prefs.theme]);

  useEffect(() => {
    localStorage.setItem('code_radar_preferences', JSON.stringify(prefs));
  }, [prefs]);

  if (!user) return null;

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiFetch('/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ name: username, email }),
      });
      if (!response.ok) throw await responseError(response, 'Unable to save profile.');
      const updatedUser = await response.json();
      updateUser(updatedUser);
      setIsSaving(false);
      triggerToast('Profile updated successfully!');
    } catch (error) {
      window.alert(error.message);
      setIsSaving(false);
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      window.alert('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiFetch('/auth/password/', {
        method: 'POST',
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.next }),
      });
      if (!response.ok) throw await responseError(response, 'Unable to change password.');
      const data = await response.json();
      setAuthToken(data.token);
      updateUser(data.user);
      setPasswords({ current: '', next: '', confirm: '' });
      setIsSaving(false);
      triggerToast('Password changed successfully!');
    } catch (error) {
      window.alert(error.message);
      setIsSaving(false);
    }
  };

  const navItems = [
    { label: 'Account Details', icon: User },
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
                      <strong>{user.date_joined ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.date_joined)) : '—'}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Analyses Done</span>
                      <strong>{user.analysis_count ?? 0}</strong>
                    </div>
                    <div className="stat-row">
                       <span>Personal workspace</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
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

              <div className="security-card">
                <div className="security-info">
                  <Shield size={24} className="text-muted" />
                  <div>
                    <h4>Two-Factor Authentication</h4>
                    <p>Two-factor authentication is not available yet.</p>
                  </div>
                </div>
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
