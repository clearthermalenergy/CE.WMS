import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { RefreshCcw, Database, Shield, Bell, Palette } from 'lucide-react';
import './Settings.css';

export default function Settings() {
    const { store } = useStore();

    // Toggle states
    const [toggles, setToggles] = useState({
        darkMode: true,
        compactView: false,
        inAppNotif: true,
        emailNotif: false,
        taskReminders: true,
        twoFactor: false,
        activityLog: true
    });

    const toggle = (key) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReset = () => {
        if (confirm('Reset all data to defaults? This will clear all your changes.')) {
            store.reset();
        }
    };

    return (
        <div className="settings-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Application configuration and preferences</p>
                </div>
            </div>

            <div className="settings-grid">
                <div className="settings-card glass-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        <Palette size={24} />
                    </div>
                    <h3>Appearance</h3>
                    <p>Dark theme is enabled by default for optimal viewing experience.</p>
                    <div className="settings-options">
                        <div className="setting-row">
                            <span>Dark Mode</span>
                            <button role="switch" aria-checked={toggles.darkMode} onClick={() => toggle('darkMode')} className={`toggle ${toggles.darkMode ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                        <div className="setting-row">
                            <span>Compact View</span>
                            <button role="switch" aria-checked={toggles.compactView} onClick={() => toggle('compactView')} className={`toggle ${toggles.compactView ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                    </div>
                </div>

                <div className="settings-card glass-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(6,214,160,0.1)', color: '#06d6a0' }}>
                        <Bell size={24} />
                    </div>
                    <h3>Notifications</h3>
                    <p>Configure how you receive alerts and updates.</p>
                    <div className="settings-options">
                        <div className="setting-row">
                            <span>In-App Notifications</span>
                            <button role="switch" aria-checked={toggles.inAppNotif} onClick={() => toggle('inAppNotif')} className={`toggle ${toggles.inAppNotif ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                        <div className="setting-row">
                            <span>Email Notifications</span>
                            <button role="switch" aria-checked={toggles.emailNotif} onClick={() => toggle('emailNotif')} className={`toggle ${toggles.emailNotif ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                        <div className="setting-row">
                            <span>Task Reminders</span>
                            <button role="switch" aria-checked={toggles.taskReminders} onClick={() => toggle('taskReminders')} className={`toggle ${toggles.taskReminders ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                    </div>
                </div>

                <div className="settings-card glass-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <Shield size={24} />
                    </div>
                    <h3>Security</h3>
                    <p>Security features and authentication settings.</p>
                    <div className="settings-options">
                        <div className="setting-row">
                            <span>Two-Factor Auth</span>
                            <button role="switch" aria-checked={toggles.twoFactor} onClick={() => toggle('twoFactor')} className={`toggle ${toggles.twoFactor ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                        <div className="setting-row">
                            <span>Activity Logging</span>
                            <button role="switch" aria-checked={toggles.activityLog} onClick={() => toggle('activityLog')} className={`toggle ${toggles.activityLog ? 'active' : ''}`}><div className="toggle-dot" /></button>
                        </div>
                    </div>
                </div>

                <div className="settings-card glass-card">
                    <div className="settings-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Database size={24} />
                    </div>
                    <h3>Data Management</h3>
                    <p>Manage your application data and storage.</p>
                    <div className="settings-options">
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleReset}>
                            <RefreshCcw size={16} /> Reset All Data to Defaults
                        </button>
                        <p className="setting-hint">This will clear all custom data and restore the demo dataset.</p>
                    </div>
                </div>
            </div>

            <div className="settings-info glass-card">
                <h3>About CE-WMS</h3>
                <div className="about-grid">
                    <div><strong>Version</strong><span>1.0.0</span></div>
                    <div><strong>Platform</strong><span>Web Application</span></div>
                    <div><strong>Company</strong><span>Clear Energy</span></div>
                    <div><strong>Stack</strong><span>React + Vite</span></div>
                </div>
            </div>
        </div>
    );
}
