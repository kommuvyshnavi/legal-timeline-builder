import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    ⚖️ <span>CaseMap</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/cases" className={`nav-link ${isActive('/cases') ? 'active' : ''}`}>
                        Cases
                    </Link>
                    <Link to="/upload" className="btn btn-primary btn-sm">
                        + New Upload
                    </Link>
                </div>
            </div>
        </nav>
    );
}
