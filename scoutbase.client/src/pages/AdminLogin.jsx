import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageWrapper,
    Main,
    Content
} from '@/components/common/SharedStyles';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';

const branches = [
    { label: 'QLD', value: 'qld' },
    { label: 'NSW', value: 'nsw' },
    { label: 'ACT', value: 'act' },
    { label: 'VIC', value: 'vic' },
    { label: 'TAS', value: 'tas' },
    { label: 'SA', value: 'sa' },
    { label: 'WA', value: 'wa' },
    { label: 'NT', value: 'nt' }
];

export default function AdminLogin() {
    const navigate = useNavigate();
    const [region, setRegion] = useState('qld');
    const [memberId, setMemberId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/terrain-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region, memberId, password })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            // ✅ Success – navigate to admin
            navigate('/admin');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <Header />

            <Main style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Content style={{ maxWidth: '400px', width: '100%' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                        Admin Login (Terrain)
                    </h2>
                    <p style={{ fontSize: '0.95rem', marginBottom: '1rem', textAlign: 'center', color: '#555' }}>
                        Login using your <strong>Terrain Member Number and Password</strong>. You must be listed as a leader in <strong>Terrain</strong> and also be registered as a <strong>Leader in ScoutBase</strong> to access the admin area.
                    </p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                            {branches.map((b) => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Member Number"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            required
                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                        />

                        <input
                            type="password"
                            placeholder="Terrain Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '6px',
                                backgroundColor: '#0F5BA4',
                                color: 'white',
                                border: 'none',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
                    </form>
                </Content>
            </Main>

            <Footer />
        </PageWrapper>
    );
}
