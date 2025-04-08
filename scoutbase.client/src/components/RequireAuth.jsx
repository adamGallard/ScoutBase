import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
    const navigate = useNavigate();

    useEffect(() => {
        const isAuthed = localStorage.getItem('scoutbase-admin-authed');
        if (!isAuthed) {
            navigate('/admin-login');
        }
    }, [navigate]);

    return children;
}
