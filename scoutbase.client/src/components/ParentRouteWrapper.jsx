// src/components/common/ParentRouteWrapper.jsx
import { Navigate, useLocation } from 'react-router-dom';

export default function ParentRouteWrapper({ children }) {
    const location = useLocation();
    const { state } = location;

    // if we don’t have a logged-in parent or a groupId, bounce back to login (preserving query)
    if (!state?.parent?.id || !state?.groupId) {
        const qs = location.search || '';
        return <Navigate to={`/parent-login${qs}`} replace />;
    }

    return children;
}
