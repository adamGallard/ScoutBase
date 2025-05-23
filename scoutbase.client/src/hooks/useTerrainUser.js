// src/hooks/useTerrainUser.jsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logAuditEvent } from '@/helpers/auditHelper';

export function useTerrainUser() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const hasLoggedAudit = useRef(false);

    /* 1️⃣  fetch once on mount  */
    useEffect(() => {
        (async () => {
            const idToken = localStorage.getItem('scoutbase-terrain-idtoken');
            const terrainUserId = localStorage.getItem('scoutbase-terrain-userid');
            if (!idToken || !terrainUserId) {
                setError('Missing authentication tokens');
                setLoading(false);
                return;
            }

            try {
                // Terrain profile (name)
                const resp = await fetch('https://members.terrain.scouts.com.au/profiles', {
                    headers: { Authorization: idToken },
                });
                const profile = (await resp.json())?.profiles?.[0];
                const name = profile?.member?.name;
                if (!name) throw new Error('No valid profile');

                // ScoutBase user row
                const { data: row, error: dbErr } = await supabase
                    .from('users')
                    .select('id, group_id, role, section')
                    .eq('terrain_user_id', terrainUserId)
                    .single();

                if (dbErr || !row) throw new Error('User not found in database');

                /* 🔍 lookup the group’s friendly name */
                                const { data: grp, error: grpErr } = await supabase
                                        .from('groups')
                                        .select('name')
                                        .eq('id', row.group_id)
                                        .single();
                
                                    // Build userInfo (now includes group_name)
                                    const u = {
 id: row.id,
                                   name,
                                        group_id   : row.group_id,
                                            group_name : grp?.name ?? 'Scout Group',
                                               role       : row.role,
                                                    section    : row.section
                                                    };
                setUserInfo(u);

                /* audit once‑per‑session */
                const auditKey = `scoutbase-login-audit-${terrainUserId}`;
                if (!sessionStorage.getItem(auditKey) && !hasLoggedAudit.current) {
                    hasLoggedAudit.current = true;
                    sessionStorage.setItem(auditKey, 'true');
                    setTimeout(() =>
                        logAuditEvent({
                            userId: row.id,
                            groupId: row.group_id,
                            role: row.role,
                            action: 'admin_login',
                            targetType: 'system',
                        }), 250);
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
            setLoading(false);
        })();
    }, []);

    /* 2️⃣  realtime subscription → live‑update role, group, section */
    useEffect(() => {
        if (!userInfo) return;                       // wait until we know id
        const channel = supabase.channel('user-role-watch')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userInfo.id}`,
                },
                payload => {
                    const { role, group_id, section } = payload.new;
                    setUserInfo(prev => ({ ...prev, role, group_id, section }));
                },
            )
            .subscribe();
        return () => channel.unsubscribe();
    }, [userInfo?.id]);

    return { userInfo, loading, error };
}
