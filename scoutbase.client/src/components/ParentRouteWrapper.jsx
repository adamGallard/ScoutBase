// src/components/common/ParentRouteWrapper.jsx
import { Navigate, useLocation } from 'react-router-dom';

export default function ParentRouteWrapper({ children }) {
    const location = useLocation();
    const { state } = location;

    // Fallback to sessionStorage if state is missing
    const session = sessionStorage.getItem('parentInfo');
    const sessionData = session ? JSON.parse(session) : null;

    const parent = state?.parent || sessionData?.parent;
    const groupId = state?.groupId || sessionData?.groupId;

    if (!parent?.id || !groupId) {
        const qs = location.search || '';
        return <Navigate to={`/sign-in${qs}`} replace />;
    }

    return children;
}