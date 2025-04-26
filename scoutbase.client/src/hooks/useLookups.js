import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useLookups() {
    const [sections, setSections] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [{ data: secData, error: secError },
                    { data: stgData, error: stgError }] = await Promise.all([
                        supabase
                            .from('sections')
                            .select('code, label, color')
                            .order('sort_order', { ascending: true }),
                        supabase
                            .from('membership_stages')
                            .select('code, label')
                            .order('sort_order', { ascending: true })
                    ]);

                if (error) {
                    console.error('Fetch sections error:', error);
                }

                if (secError || stgError) {
                    throw secError || stgError;
                }

                setSections(secData);
                setStages(stgData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { sections, stages, loading, error };
}