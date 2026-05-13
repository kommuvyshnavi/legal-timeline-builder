import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ emailOrUsername: '', password: '' });
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(form);
            localStorage.setItem('casemap_token', result.token);
            localStorage.setItem('casemap_user', JSON.stringify(result.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card login-card">
                <div className="auth-card-glow auth-glow-purple" />
                <div className="auth-icon-wrapper auth-icon-purple">🔑</div>
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Sign in to access the Legal Timeline Builder</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>USERNAME OR EMAIL</label>
                        <input
                            className="auth-input"
                            placeholder="john@example.com or johndoe123"
                            value={form.emailOrUsername}
                            onChange={handleChange('emailOrUsername')}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label>PASSWORD</label>
                        <div className="auth-input-wrapper">
                            <input
                                className="auth-input"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange('password')}
                                required
                            />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                {showPw ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="auth-row">
                        <label className="auth-checkbox-label">
                            <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="auth-link">Forgot Password?</a>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-btn auth-btn-purple" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
                </p>
                <Link to="/" className="auth-back-link">← Back to Home</Link>
            </div>
        </div>
    );
}
