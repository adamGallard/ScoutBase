import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import Features from './pages/Features';
import Logout from './pages/Logout';
import About from './pages/About';
import ContactPage from './pages/Contact';
import { Analytics } from '@vercel/analytics/react';
// Admin portal pages
import AdminLogin from './pages/AdminLogin';
import AdminPage from './pages/AdminPage';
// Parent portal pages
import ParentLogin from './pages/ParentLogin';
import ParentPage from './pages/ParentPage';
import FamilySignupPage from './pages/FamilySignupPage';
import ParentRouteWrapper from './components/ParentRouteWrapper';

import { ParentSessionProvider } from '@/helpers/SessionContext';
import { NotificationProvider } from '@/helpers/NotificationContext';

export default function App() {
	return (
		<Router>
			<ParentSessionProvider>
				<NotificationProvider>
					<>
						<Routes>
							{/* Public / Marketing */}
							<Route path="/" element={<LandingPage />} />
							<Route path="/about" element={<About />} />
							<Route path="/features" element={<Features />} />
							<Route path="/privacy" element={<Privacy />} />
							<Route path="/contact" element={<ContactPage />} />

							{/* Admin */}
							<Route path="/admin-login" element={<AdminLogin />} />
							<Route path="/admin/*" element={<AdminPage />} />
							<Route path="/logout" element={<Logout />} />

							{/* Parent portal */}
							<Route path="/sign-in" element={<ParentLogin />} />
							<Route
								path="/parent/*"
								element={
									<ParentRouteWrapper>
										<ParentPage />
									</ParentRouteWrapper>
								}
							/>
							<Route path="/signup" element={<FamilySignupPage />} />
							{/* Fallback */}
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
						<Analytics />
					</>
				</NotificationProvider>
			</ParentSessionProvider>
		</Router>
	);
}
