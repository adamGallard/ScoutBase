import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PageWrapper,
    Main,
    Content
} from '../components/SharedStyles';
import Footer from '../components/Footer';
import Header from '../components/Header';

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

    const clientIds = [
        '6v98tbc09aqfvh52fml3usas3c',
        '5g9rg6ppc5g1pcs5odb7nf7hf9',
        '1u4uajve0lin0ki5n6b61ovva7',
        '21m9o832lp5krto1e8ioo6ldg2'
    ];

    const loginToTerrain = async (region, memberId, password) => {
        const fullUsername = `${region}-${memberId}`;

        for (const clientId of clientIds) {
            const response = await fetch('https://cognito-idp.ap-southeast-2.amazonaws.com/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-amz-json-1.1',
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
                },
                body: JSON.stringify({
                    AuthFlow: 'USER_PASSWORD_AUTH',
                    ClientId: clientId,
                    AuthParameters: {
                        USERNAME: fullUsername,
                        PASSWORD: password
                    }
                })
            });

            const data = await response.json();
            if (response.ok && data.AuthenticationResult) {
                localStorage.setItem('scoutbase-client-id', clientId);
                localStorage.setItem('scoutbase-terrain-idtoken', data.AuthenticationResult.IdToken);
                localStorage.setItem('scoutbase-terrain-token', data.AuthenticationResult.AccessToken);
                localStorage.setItem('scoutbase-terrain-userid', `${region}-${memberId}`);
                return;
            }
        }

        throw new Error('Login failed: Invalid credentials or no valid client ID');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await loginToTerrain(region, memberId, password);
            localStorage.setItem('scoutbase-admin-authed', 'true');
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
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        Admin Login (Terrain)
                    </h2>

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
