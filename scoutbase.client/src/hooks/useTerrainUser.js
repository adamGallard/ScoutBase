import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logAuditEvent } from "@/helpers/auditHelper";


export function useTerrainUser() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const hasLoggedLogin = useRef(false);

    useEffect(() => {
        const idToken = localStorage.getItem('scoutbase-terrain-idtoken');
        const terrainUserId = localStorage.getItem('scoutbase-terrain-userid'); 
 

        fetch('https://members.terrain.scouts.com.au/profiles', {
            headers: { Authorization: idToken }
        })
            .then(res => res.json())
            .then(async data => {
                if (data.profiles?.length > 0) {
                    const profile = data.profiles[0];
                    const name = profile.member?.name;

                    const { data: userRecord, error: userError } = await supabase
                        .from('users')
                        .select('id, group_id, role')
                        .eq('terrain_user_id', terrainUserId)
                        .single();

                    if (userError || !userRecord) {
                        console.error('User lookup failed:', userError || 'No user found');
                        setError('User not found in database');
                    } else {
                        setUserInfo({
                            name,
                            role: userRecord.role,
                            group_id: userRecord.group_id
                        });
                        if (!hasLoggedLogin.current) {
                            hasLoggedLogin.current = true;
                            await logAuditEvent({
                                userId: userRecord.id,
                                groupId: userRecord.group_id,
                                role: userRecord.role,
                                action: 'Admin login',
                                targetType: 'System'
                            });
                        }


                    }
                } else {
                    setError('No profile info found');
                }

                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching profile:', err);
                setError('Could not get user profile');
                setLoading(false);
            });
    }, []);

    return { userInfo, loading, error };
}


export async function getTerrainProfiles(token) {
    const response = await fetch('/api/terrain/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Terrain profiles');
    }

    const data = await response.json();

    return data.profiles.map(profile => ({
        unitId: profile.unit.id,
        unitName: profile.unit.name,
        section: profile.unit.section
    }));
}