import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseTimeline from './pages/CaseTimeline';
import Upload from './pages/Upload';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                {/* Public pages (no app shell) */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* App pages (with Navbar) */}
                <Route element={<App />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/cases" element={<CaseList />} />
                    <Route path="/cases/:id" element={<CaseTimeline />} />
                    <Route path="/upload" element={<Upload />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
