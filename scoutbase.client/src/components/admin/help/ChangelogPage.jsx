import React, { useEffect, useState } from 'react';
import { PageTitle } from '@/components/common/SharedStyles';
import { FileText } from 'lucide-react';

export default function ChangelogPage() {
    const [changelog, setChangelog] = useState([]);

    useEffect(() => {
        fetch('/changelog.json')
            .then((res) => res.json())
            .then((data) => setChangelog(data))
            .catch((err) => console.error('Failed to load changelog:', err));
    }, []);


    const formatDate = (isoDate) => {
        const [year, month, day] = isoDate.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="content-box">
            <PageTitle>
                <FileText size={24} style={{ marginRight: 8 }} />
                ScoutBase Changelog
            </PageTitle>

            <div style={{ padding: '1.5rem 1rem' }}>
                {changelog.length === 0 ? (
                    <p>Loading changelog...</p>
                ) : (
                    changelog.map((entry) => (
                        <div
                            key={entry.version}
                            style={{
                                marginBottom: '2rem',
                                padding: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                backgroundColor: '#fdfdfd',
                            }}
                        >
                            <h2 style={{ marginBottom: 6, color: '#0F5BA4' }}>
                                v{entry.version}
                                <span style={{
                                    marginLeft: 8,
                                    fontSize: '0.9rem',
                                    color: '#0F5BA4',
                                    fontWeight: 'normal'
                                }}>
                                    {formatDate(entry.date)}
                                </span>
                            </h2>
                            <ul style={{ paddingLeft: '1.2rem', marginTop: 8 }}>
                                {entry.changes.map((change, i) => (
                                    <li key={i} style={{ marginBottom: 6 }}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
