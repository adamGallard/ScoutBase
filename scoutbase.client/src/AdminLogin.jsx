import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import logo from './assets/scoutbase-logo.png';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
            localStorage.setItem('scoutbase-admin-authed', 'true'); // Save auth state
            navigate('/admin');
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="scout-container" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <img
                src={logo}
                alt="ScoutBase Logo"
                style={{
                    maxWidth: '150px',
                    marginTop: '2rem',
                    marginBottom: '1rem',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            />
            <img src="/src/assets/scoutbase-logo.png" alt="ScoutBase Logo" />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        fontSize: '1rem',
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        backgroundColor: '#0F5BA4',
                        color: 'white',
                        border: 'none',
                        fontSize: '1rem',
                        cursor: 'pointer',
                    }}
                >
                    Login
                </button>
                {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
            </form>
        </div>
    );
};

