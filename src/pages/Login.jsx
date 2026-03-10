import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('Welcome@123');
        setError('');
    };

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb orb-1" />
                <div className="login-bg-orb orb-2" />
                <div className="login-bg-orb orb-3" />
            </div>

            <div className="login-container">
                {/* Left panel - branding */}
                <div className="login-brand">
                    <div className="login-brand-content">
                        <div className="login-logo">
                            <div className="login-logo-icon">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h1>Clear Energy</h1>
                                <p>Work Management System</p>
                            </div>
                        </div>

                        <div className="login-brand-tagline">
                            <h2>Power your workflow</h2>
                            <p>
                                Manage tasks, track sales leads, handle employee leaves,
                                and drive your team forward — all in one place.
                            </p>
                        </div>

                        <div className="login-features">
                            <div className="login-feature">
                                <div className="login-feature-dot indigo" />
                                <span>Task & Project Management</span>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-dot green" />
                                <span>Sales Pipeline & CRM</span>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-dot amber" />
                                <span>Employee Leave Tracking</span>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-dot blue" />
                                <span>Reports & Analytics</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right panel - login form */}
                <div className="login-form-panel">
                    <div className="login-form-wrapper">
                        <div className="login-form-header">
                            <h2>Welcome back</h2>
                            <p>Sign in to your account to continue</p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="login-error">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="login-field">
                                <label htmlFor="login-email">Email Address</label>
                                <div className="login-input-wrapper">
                                    <Mail size={18} className="login-input-icon" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your.email@clearenergy.in"
                                        required
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label htmlFor="login-password">Password</label>
                                <div className="login-input-wrapper">
                                    <Lock size={18} className="login-input-icon" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="login-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                                id="btn-login"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Demo credentials */}
                        <div className="login-demo">
                            <p className="login-demo-label">Quick login with demo accounts:</p>
                            <div className="login-demo-cards">
                                <button className="login-demo-card" onClick={() => fillDemo('ananya@clearenergy.in')}>
                                    <span className="login-demo-role admin">Admin</span>
                                    <span className="login-demo-name">Ananya Desai</span>
                                </button>
                                <button className="login-demo-card" onClick={() => fillDemo('rajesh@clearenergy.in')}>
                                    <span className="login-demo-role manager">Manager</span>
                                    <span className="login-demo-name">Rajesh Kumar</span>
                                </button>
                                <button className="login-demo-card" onClick={() => fillDemo('priya@clearenergy.in')}>
                                    <span className="login-demo-role employee">Employee</span>
                                    <span className="login-demo-name">Priya Sharma</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
