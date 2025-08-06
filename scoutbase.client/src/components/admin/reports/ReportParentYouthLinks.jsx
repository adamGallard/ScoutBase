import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle, PrimaryButton } from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups';
import { downloadCSV } from '@/utils/exportUtils';

export default function ReportYouthParentLinks({ groupId }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectionFilter, setSectionFilter] = useState('');
    const [membershipFilter, setMembershipFilter] = useState('current'); // 'all', 'current', 'retired'

    function handleDownloadCSV() {
        const rows = [];
        filteredGroups.forEach(({ youth, parents }) => {
            parents
                .slice()
                .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
                .forEach(p => {
                    rows.push({
                        'Youth Name': youth.name,
                        'Membership Stage': youth.membership_stage,
                        'Section': sections.find(s => s.code === youth.section)?.label || youth.section,
                        'Parent Name': p.name,
                        'Parent Email': p.email,
						'Parent Phone': p.phone || '', 
                        'Primary': p.is_primary ? 'Yes' : ''
                    });
                });
        });
        if (rows.length === 0) return;
        downloadCSV(rows, 'youth_parent_links');
    }

    useEffect(() => {
        async function fetchLinks() {
            setLoading(true);
            const { data } = await supabase
                .from('parent_youth')
                .select(`
                    is_primary,
                    parent:parent_id (id, name, email,phone),
                    youth:youth_id (id, name, section, membership_stage)
                `)
                .eq('group_id', groupId);

            // Group by youth
            const grouped = {};
            (data || []).forEach(link => {
                if (!link.youth) return;
                const id = link.youth.id;
                if (!grouped[id]) grouped[id] = {
                    youth: link.youth,
                    parents: []
                };
                grouped[id].parents.push({
                    id: link.parent?.id,
                    name: link.parent?.name,
                    email: link.parent?.email,
					phone: link.parent?.phone || '',
                    is_primary: !!link.is_primary
                });
            });
            setGroups(
                Object.values(grouped).sort((a, b) =>
                    (a.youth.name || '').localeCompare(b.youth.name || '', undefined, { sensitivity: 'base' })
                )
            );
            setLoading(false);
        }
        fetchLinks();
    }, [groupId]);

    // Filtering logic
    const filteredGroups = groups.filter(({ youth }) => {
        if (sectionFilter && youth.section !== sectionFilter) return false;
        const isRetired = (youth.membership_stage || '').toLowerCase() === 'retired';
        if (membershipFilter === 'current' && isRetired) return false;
        if (membershipFilter === 'retired' && !isRetired) return false;
        // membershipFilter === 'all' returns all youth (retired or not)
        return true;
    });

    return (
        <div className="content-box">
            <PageTitle>Youth-Parent Links Report</PageTitle>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <label>
                    Section:&nbsp;
                    <select
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                        <option value="">All Sections</option>
                        {sections.map(s => (
                            <option key={s.code} value={s.code}>{s.label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Membership:&nbsp;
                    <select
                        value={membershipFilter}
                        onChange={e => setMembershipFilter(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                        <option value="current">Current Only</option>
                        <option value="retired">Retired Only</option>
                        <option value="all">All (include retired)</option>
                    </select>
                </label>
                <PrimaryButton style={{ marginBottom: 14 }} onClick={handleDownloadCSV}>
                    Export to CSV
                </PrimaryButton>
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                filteredGroups.length === 0 ? (
                    <p>No youth/parent links found.</p>
                ) : (
                    filteredGroups.map(({ youth, parents }) => (
                        <div key={youth.id} style={{
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            background: '#fafcff'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0F5BA4' }}>
                                {youth.name}
                                {youth.membership_stage && (
                                    <span style={{
                                        marginLeft: 10,
                                        fontSize: '0.95rem',
                                        color: youth.membership_stage.toLowerCase() === 'retired' ? '#b91c1c' : '#555'
                                    }}>
                                        ({youth.membership_stage.toLowerCase() === 'retired'
                                            ? 'Retired'
                                            : (sections.find(s => s.code === youth.section)?.label || youth.section)
                                        })
                                    </span>
                                )}
                            </div>
                            <table style={{
                                width: '100%',
                                marginTop: 8,
                                borderCollapse: 'collapse',
                                tableLayout: 'fixed'
                            }}>
                                <colgroup>
                                    <col style={{ width: '34%' }} />
                                    <col style={{ width: '26%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '20%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Parent Name</th>
                                        <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Email</th>
                                        <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Phone</th>
                                        <th style={{ textAlign: 'center', padding: 6, borderBottom: '1px solid #eee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Primary?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parents
                                        .slice()
                                        .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
                                        .map((p, i) => (
                                            <tr key={`${youth.id}-${p.id || i}`}>
                                            <td style={{
                                                padding: 6,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{p.name}</td>
                                            <td style={{
                                                padding: 6,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                                }}>{p.email}</td>
                                                <td style={{
                                                    padding: 6,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>{p.phone}</td>
                                            <td style={{
                                                padding: 6,
                                                textAlign: 'center',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{p.is_primary ? 'Yes' : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )
            )}
        </div>
    );
}
