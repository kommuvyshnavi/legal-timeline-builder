import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../lib/api';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);

    const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await register({
                fullName: form.fullName,
                username: form.username,
                email: form.email,
                phone: form.phone,
                password: form.password,
            });
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
            <div className="auth-card register-card">
                <div className="auth-card-glow auth-glow-purple" />
                <div className="auth-icon-wrapper auth-icon-purple">🔗</div>
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join us and start building legal timelines</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label>FULL NAME *</label>
                            <input className="auth-input" placeholder="John Doe" value={form.fullName} onChange={handleChange('fullName')} required />
                        </div>
                        <div className="auth-field">
                            <label>USERNAME *</label>
                            <input className="auth-input" placeholder="johndoe123" value={form.username} onChange={handleChange('username')} required />
                        </div>
                    </div>

                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label>EMAIL ADDRESS *</label>
                            <input className="auth-input" type="email" placeholder="name@example.com" value={form.email} onChange={handleChange('email')} required />
                        </div>
                        <div className="auth-field">
                            <label>PHONE NUMBER</label>
                            <input className="auth-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange('phone')} />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>PASSWORD *</label>
                        <div className="auth-input-wrapper">
                            <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={handleChange('password')} required />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁️'}</button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>CONFIRM PASSWORD *</label>
                        <div className="auth-input-wrapper">
                            <input className="auth-input" type={showCpw ? 'text' : 'password'} placeholder="Re-type your password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowCpw(!showCpw)}>{showCpw ? '🙈' : '👁️'}</button>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-btn auth-btn-purple" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account →'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
