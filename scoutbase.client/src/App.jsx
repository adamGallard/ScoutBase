import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import SignInRouteWrapper from './components/SignInRouteWrapper';
import Privacy from './pages/Privacy';
import Features from './pages/Features';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/sign-in" element={<SignInRouteWrapper />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/features" element={<Features />} />
            </Routes>
        </Router>
    );
}
