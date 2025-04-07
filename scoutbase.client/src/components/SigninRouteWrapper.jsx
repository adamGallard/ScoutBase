import { useLocation } from 'react-router-dom';
import SignInOutPage from '../pages/SignInOutPage';
import LandingPage from '../pages/LandingPage';


function useQuery() {
	return new URLSearchParams(useLocation().search);
}
export default function SignInRouteWrapper() {
	const query = new URLSearchParams(useLocation().search);
	const group = query.get('group');
	return group ? <SignInOutPage group={group} /> : <LandingPage />;
}
