import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useTerrainUser() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const idToken = localStorage.getItem('scoutbase-terrain-idtoken');
        const terrainUserId = localStorage.getItem('scoutbase-terrain-userid'); // QLD-281595 etc

        if (!idToken || !terrainUserId) {
            if (import.meta.env.DEV) {
                setUserInfo({
                    name: 'Dev Superadmin',
                    role: 'superadmin',
                    group_id: 1
                });
            }
            setLoading(false);
            return;
        }

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
                        .select('group_id, role')
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
