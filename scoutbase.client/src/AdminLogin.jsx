import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

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
        <div className="scout-container">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}
