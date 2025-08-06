import React from 'react';
import { PageTitle } from '@/components/common/SharedStyles';
import {
    Info,
    ClipboardList,
    Mail
} from 'lucide-react';
import { appVersion } from '@/version';

export default function AboutPage() {
    return (
        <div className="content-box">
            <PageTitle>
                <Info size={24} style={{ marginRight: 8 }} />
                About ScoutBase
            </PageTitle>

            <div style={{ padding: '1.5rem 1rem', fontSize: '1rem', color: '#333' }}>
                <div
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        backgroundColor: '#f9f9f9',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}
                >
                    <h2 style={{ color: '#0F5BA4', marginBottom: 8 }}>ScoutBase</h2>
                    <p style={{ marginBottom: 6 }}>
                        ScoutBase helps Scout leaders manage youth, attendance, patrols, badgework, and parent communication.
                    </p>
                    <p style={{ marginBottom: 0 }}>
                        Version <strong>{appVersion.version}</strong> (Official Build)
                    </p>
                </div>

                <div
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        backgroundColor: '#fdfdfd',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}
                >
                    <h3 style={{ color: '#0F5BA4', marginBottom: 12 }}>Resources & Support</h3>
                    <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8rem' }}>
                        <li>
                            <Mail size={16} style={{ marginRight: 8 }} />
                            <a href="/admin/contact" style={{ color: '#0F5BA4' }}>Contact Support</a>
                        </li>
                        <li>
                            <ClipboardList size={16} style={{ marginRight: 8 }} />
                            <a href="/admin/changelog" style={{ color: '#0F5BA4' }}>View Changelog</a>
                        </li>
                        <li>
                            <img
                                src="https://cdn.simpleicons.org/github/000000"
                                alt="GitHub"
                                width="16"
                                height="16"
                                style={{ marginRight: '8px' }}

                            />
                            <a
                                href="https://github.com/adamGallard/ScoutBase/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#0F5BA4' }}
                            >
                                Report an Issue on GitHub
                            </a>
                        </li>
                    </ul>
                </div>

                <div
                    style={{
                        fontSize: '0.9rem',
                        color: '#555',
                        textAlign: 'center',
                        paddingTop: '1rem',
                        borderTop: '1px solid #eee'
                    }}
                >
                    <p>
                        ScoutBase is proudly built by volunteers, powered by the open source community.
                    </p>
                    <p style={{ marginTop: 4 }}>
                        &copy; {new Date().getFullYear()} ScoutBase. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
