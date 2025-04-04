import { useEffect, useState } from 'react';

export function useTerrainUser() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const idToken = localStorage.getItem('scoutbase-terrain-idtoken');
        if (!idToken) {
            setLoading(false);
            return;
        }

        fetch('https://members.terrain.scouts.com.au/profiles', {
            method: 'GET',
            headers: {
                'Authorization': idToken
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.profiles && data.profiles.length > 0) {
                    const profile = data.profiles[0];
                    const name = profile.member?.name;
                    setUserInfo({ name });
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
