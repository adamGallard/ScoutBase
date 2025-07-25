// src/components/common/ParentRouteWrapper.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { getParentSession } from '@/helpers/authHelper';

export default function ParentRouteWrapper({ children }) {
    const location = useLocation();
    const { parent, groupId, token } = getParentSession();

    if (!parent?.id || !groupId || !token) {
        const qs = location.search || '';
        return <Navigate to={`/sign-in${qs}`} replace />;
    }

    return children;
}
