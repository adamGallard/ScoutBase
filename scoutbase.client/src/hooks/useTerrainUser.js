import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logAuditEvent } from "@/helpers/auditHelper";

export function useTerrainUser() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const hasLoggedAudit = useRef(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const idToken = localStorage.getItem('scoutbase-terrain-idtoken');
            const terrainUserId = localStorage.getItem('scoutbase-terrain-userid');

            if (!idToken || !terrainUserId) {
                setError('Missing authentication tokens');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('https://members.terrain.scouts.com.au/profiles', {
                    headers: { Authorization: idToken }
                });

                const profileData = await response.json();
                const profile = profileData?.profiles?.[0];

                if (!profile || !profile.member?.name) {
                    setError('No valid profile info found');
                    setLoading(false);
                    return;
                }

                const { name } = profile.member;

                const { data: userRecord, error: userError } = await supabase
                    .from('users')
                    .select('id, group_id, role, section')
                    .eq('terrain_user_id', terrainUserId)
                    .single();

                if (userError || !userRecord) {
                    console.error('User lookup failed:', userError || 'No user found');
                    setError('User not found in ScoutBase database');
                } else {
                    const fullUserInfo = {
                        id: userRecord.id,
                        name,
                        group_id: userRecord.group_id,
                        role: userRecord.role,
                        section: userRecord.section
                    };

                    setUserInfo(fullUserInfo);

                    const sessionAuditKey = `scoutbase-login-audit-${terrainUserId}`;

                    // 🚫 Avoid multiple logs in dev/strict mode
                    if (
                        !sessionStorage.getItem(sessionAuditKey) &&
                        !hasLoggedAudit.current
                    ) {
                        hasLoggedAudit.current = true;
                        sessionStorage.setItem(sessionAuditKey, 'true');

                        // Delay log to suppress duplicate in React Strict Mode
                        setTimeout(() => {
                            logAuditEvent({
                                userId: userRecord.id,
                                groupId: userRecord.group_id,
                                role: userRecord.role,
                                action: 'admin_login',
                                targetType: 'system'
                            });
                        }, 250);
                    }
                }
            } catch (err) {
                console.error('Error fetching Terrain profile:', err);
                setError('Could not get user profile');
            }

            setLoading(false);
        };

        fetchUserInfo();
    }, []);

    return { userInfo, loading, error };
}
