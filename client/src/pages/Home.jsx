import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../lib/api';

export default function Home() {
    const [stats, setStats] = useState({ cases: 0, docs: 0, events: 0 });

    useEffect(() => {
        getCases()
            .then((cases) => {
                setStats({
                    cases: cases.length,
                    docs: cases.reduce((s, c) => s + (c.documentCount || 0), 0),
                    events: cases.reduce((s, c) => s + (c.eventCount || 0), 0),
                });
            })
            .catch(() => { });
    }, []);

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-brand">
                        <span className="brand-icon">⚖</span>
                        <span className="brand-text">CaseMap</span>
                    </Link>
                    <div className="landing-nav-links">
                        <Link to="/" className="lnav-link active">Home</Link>
                        <Link to="/register" className="lnav-link">Registration</Link>
                        <Link to="/login" className="lnav-link">👤 User Login</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="hero-version-badge">🚀 V1.0 — Intelligent Timeline Builder</div>
                    <h1>
                        Stop Searching.<br />
                        <span className="hero-gradient-text">Start Mapping.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Upload your legal documents and case files.
                        Get instant, interactive timelines with intelligently extracted dates,
                        events, and parties — powered by advanced document analysis.
                    </p>
                    <div className="hero-cta-row">
                        <Link to="/register" className="btn-hero-primary">🎯 Get Started Free</Link>
                        <a href="#features" className="btn-hero-secondary">+ Explore Features</a>
                    </div>
                    <div className="hero-stats-row">
                        <div className="hero-stat-item">
                            <span className="hero-stat-num">{stats.cases || '10k'}+</span>
                            <span className="hero-stat-lbl">Cases Built</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-num">Smart</span>
                            <span className="hero-stat-lbl">NLP Powered</span>
                        </div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-num">100%</span>
                            <span className="hero-stat-lbl">Local & Private</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features" id="features">
                <div className="landing-container">
                    <div className="features-header">
                        <span className="features-badge">✦ FEATURES</span>
                        <h2>Everything You Need to Build Legal Timelines</h2>
                        <p>Tools and intelligence built for legal professionals who want clarity, not confusion.</p>
                    </div>
                    <div className="features-grid">
                        {[
                            { icon: '🔍', title: 'Deep Document Analysis', desc: 'Understands legal documents — contracts, filings, depositions — extracting every date and event automatically.' },
                            { icon: '💡', title: 'Plain English Summaries', desc: 'Translates complex legal language into clear event descriptions anyone on your team can understand.' },
                            { icon: '⚡', title: 'Instant Timeline Generation', desc: 'Receive a visual, interactive timeline within minutes. Zoom, filter, and click any event for details.' },
                            { icon: '📁', title: 'Multi-Format Support', desc: 'Upload PDF, DOCX, and TXT files. Drag and drop up to 50 documents at once for batch processing.' },
                            { icon: '🔒', title: 'Secure & Private', desc: 'Your documents stay on your server. Nothing is stored in the cloud unless you choose to use Atlas.' },
                            { icon: '📥', title: 'Export Anywhere', desc: 'Export your timelines as CSV, JSON, or print-to-PDF. Share with colleagues or import into other tools.' },
                        ].map((f, i) => (
                            <div key={i} className="feature-card">
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© 2026 CaseMap — Intelligent Timeline Builder</p>
            </footer>
        </div>
    );
}
