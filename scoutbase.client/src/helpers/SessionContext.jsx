import React, { createContext, useContext, useState, useEffect } from 'react';
import { getParentSession, setParentSession, clearParentSession } from '@/helpers/authHelper';
import { setParentToken } from '@/lib/parentSupabaseClient';

const ParentSessionContext = createContext();

export function ParentSessionProvider({ children }) {
    const [session, setSession] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On mount: restore session from storage
        const local = getParentSession();
        if (local?.token) {
            setParentToken(local.token);
            setSession(local);
        }
        setLoading(false);
    }, []);

    const login = async ({ token, parent, groupId }) => {
        setParentSession(token, parent, groupId);
        setSession({ token, parent, groupId });
        await setParentToken(token);
    };

    const logout = async () => {
        clearParentSession();
        setSession({});
        await setParentToken(null);
    };

    return (
        <ParentSessionContext.Provider value={{ session, loading, login, logout }}>
            {children}
        </ParentSessionContext.Provider>
    );
}

export function useParentSession() {
    return useContext(ParentSessionContext);
}
