import '../App.css';
import logo from '../assets/scoutbase-logo.png';

export default function LandingPage() {
    return (
        <div className="scout-container" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
            <img
                src={logo}
                alt="ScoutBase Logo"
                style={{ maxWidth: '160px', margin: '0 auto 2rem', display: 'block' }}
            />
            <h1 style={{ textAlign: 'center', fontSize: '2rem', color: '#0F5BA4' }}>Welcome to ScoutBase</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center' }}>
                ScoutBase is your digital companion for managing attendance in the Scouts community.
            </p>

            <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                <h2 style={{ color: '#333' }}>👪 For Parents</h2>
                <p>
                    To sign your child in or out, you'll need a <strong>group-specific sign-in link</strong>{' '}
                    provided by your Scout Leader. This helps ensure your information is secure and only visible to your local group.
                </p>
                <p>
                    <strong>➡️ Don’t have your link?</strong> Please ask your Scout Leader or section coordinator for the sign-in page.
                </p>

                <h2 style={{ color: '#333', marginTop: '2rem' }}>🧭 For Scout Leaders</h2>
                <p>
                    ScoutBase helps simplify your admin workload. With it, you can:
                </p>
                <ul>
                    <li>Track attendance by event and section</li>
                    <li>View real-time sign-in and sign-out data</li>
                    <li>Export reports for your records</li>
                    <li>Use secure PIN-based parent sign-in</li>
                </ul>
                <p>
                    Interested in getting your group on ScoutBase?{' '}
                    <a href="mailto:admin@scoutbase.app" style={{ color: '#0F5BA4' }}>
                        Contact us
                    </a>{' '}
                    to learn more.
                </p>
            </div>
        </div>
    );
}