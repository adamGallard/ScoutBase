// src/pages/parent/LinksPage.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageWrapper, PageTitle } from '@/components/common/SharedStyles';
import { ExternalLink } from 'lucide-react';

export default function LinksPage() {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch links from Supabase
    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('parent_links')
                .select('id, title, url, description')
            setLoading(false);
            if (error) {
                console.error('Error fetching links:', error);
            } else {
                setLinks(data);
            }
        })();
    }, []);

    return (
        <PageWrapper style={{ padding: '1rem', paddingBottom: '56px' }}>
            <PageTitle>🔗 Useful Links</PageTitle>

            {loading ? (
                <p>Loading links…</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {links.map(link => (
                        <li
                            key={link.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                padding: '1rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {link.title}
                                </div>
                                {link.description && (
                                    <div style={{ color: '#555', fontSize: '0.9rem' }}>
                                        {link.description}
                                    </div>
                                )}
                            </div>
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#0F5BA4',
                                }}
                            >
                                <ExternalLink size={20} />
                            </a>
                        </li>
                    ))}
                    {links.length === 0 && <p>No links available.</p>}
                </ul>
            )}
        </PageWrapper>
    );
}
