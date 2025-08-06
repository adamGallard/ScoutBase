import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton, PageTitle } from '@/components/common/SharedStyles';
import { Mail } from 'lucide-react';
import { sections } from '@/components/common/Lookups.js';

function uniqueArray(arr) {
    return [...new Set(arr.filter(Boolean))];
}

export default function ReportParentEmails({ groupId }) {
    const [adults, setAdults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [roleOptions, setRoleOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(['']);
    const [selectedSections, setSelectedSections] = useState(['']);
    const [primaryOnly, setPrimaryOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Sorting
    const [sortCol, setSortCol] = useState('Name');
    const [sortAsc, setSortAsc] = useState(true);

    // Email selection
    const [selectedIds, setSelectedIds] = useState([]);
    const [copyStatus, setCopyStatus] = useState('');

    useEffect(() => {
        async function fetchFilters() {
            // Get all role_groups from adult_roles
            const { data: roles } = await supabase
                .from('adult_roles')
                .select('role_group')
                .neq('role_group', null);

            const groups = Array.from(
                new Set((roles || []).map(r => r.role_group))
            ).sort();

            setRoleOptions([
                { value: '', label: 'All Role Groups' },
                ...groups.map(g => ({
                    value: g,
                    label: g
                }))
            ]);

            setSectionOptions([
                { value: '', label: 'All Sections' },
                ...sections
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map(s => ({ value: s.code, label: s.label }))
            ]);
        }
        fetchFilters();
    }, []);

    // Fetch all adults & youth relationships
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Join parent to adult_roles
            const { data: adultsData, error: adultErr } = await supabase
                .from('parent')
                .select(`
                    id, name, email, group_id, role_code,
                    adult_roles:role_code (
                        code, title, section, role_group
                    )
                `)
                .eq('group_id', groupId);

            if (adultErr) {
                setLoading(false);
                return;
            }

            // 2. Parent-Youth Links (to get only primary relationships)
            const { data: parentLinks, error: linkErr } = await supabase
                .from('parent_youth')
                .select('parent_id, youth_id, is_primary')
                .eq('group_id', groupId);

            if (linkErr) {
                setLoading(false);
                return;
            }

            // 3. Youth (with section info)
            const { data: youthData, error: youthErr } = await supabase
                .from('youth')
                .select('id, name, section')
                .eq('group_id', groupId);

            if (youthErr) {
                setLoading(false);
                return;
            }

            // Build mapping: parent_id -> [{youth, is_primary}]
            const youthById = Object.fromEntries(
                youthData.map(y => [y.id, y])
            );
            const linksByParent = {};
            for (const link of parentLinks) {
                if (!linksByParent[link.parent_id]) linksByParent[link.parent_id] = [];
                if (youthById[link.youth_id]) {
                    linksByParent[link.parent_id].push({
                        ...youthById[link.youth_id],
                        is_primary: link.is_primary
                    });
                }
            }

            setAdults(
                (adultsData || []).map(a => ({
                    ...a,
                    roleTitle: a.adult_roles?.title || '',
                    roleSection: a.adult_roles?.section || '',
                    roleGroup: a.adult_roles?.role_group || '',
                    youth: linksByParent[a.id] || []
                }))
            );
            setLoading(false);
        };
        fetchData();
    }, [groupId]);

    // Filtering logic
    function filterAdults(a) {
        // 1. Filter by search (name/email/youth name)
        const searchText = search.toLowerCase().trim();
        if (
            searchText &&
            !(
                (a.name || '').toLowerCase().includes(searchText) ||
                (a.email || '').toLowerCase().includes(searchText) ||
                a.youth.some(y => (y.name || '').toLowerCase().includes(searchText))
            )
        ) {
            return false;
        }

        // 2. Filter by primary only
        if (primaryOnly && !a.youth.some(y => y.is_primary)) {
            return false;
        }

        // 3. Filter by roles
        if (
            selectedRoles.length > 0 &&
            !selectedRoles.includes('') &&
            !selectedRoles.includes(a.roleGroup)
        ) {
            return false;
        }

        // 4. Filter by sections (from adult_roles)
        if (
            selectedSections.length > 0 &&
            !selectedSections.includes('')
        ) {
            // If any of their linked youth's section matches (primary only if required)
            const youthMatches = a.youth.some(
                y => (!primaryOnly || y.is_primary) && selectedSections.includes(y.section)
            );
            // Or if their own section (from their role) matches
            const roleSectionMatches = selectedSections.includes(a.roleSection);

            if (!youthMatches && !roleSectionMatches) {
                return false;
            }
        }

        // 5. Show only selected
        if (showOnlySelected && !selectedIds.includes(a.id)) {
            return false;
        }
        return true;
    }

    // Sorted/filtered
    const filtered = adults.filter(filterAdults);

    const sorted = [...filtered].sort((a, b) => {
        let aval, bval;
        switch (sortCol) {
            case 'Name':
                aval = a.name || '';
                bval = b.name || '';
                break;
            case 'Email':
                aval = a.email || '';
                bval = b.email || '';
                break;
            case 'Role':
                aval = a.roleTitle || '';
                bval = b.roleTitle || '';
                break;
            case 'Section':
                aval = sections.find(s => s.code === a.roleSection)?.label || a.roleSection || '';
                bval = sections.find(s => s.code === b.roleSection)?.label || b.roleSection || '';
                break;
            case 'LinkedYouth':
                aval = (a.youth.filter(y => y.is_primary).map(y => y.name).join(', ') || '').toLowerCase();
                bval = (b.youth.filter(y => y.is_primary).map(y => y.name).join(', ') || '').toLowerCase();
                break;
            case 'Primary':
                aval = a.youth.some(y => y.is_primary) ? 'Yes' : 'No';
                bval = b.youth.some(y => y.is_primary) ? 'Yes' : 'No';
                break;
            default:
                aval = '';
                bval = '';
        }
        if (aval < bval) return sortAsc ? -1 : 1;
        if (aval > bval) return sortAsc ? 1 : -1;
        return 0;
    });

    // CSV and clipboard helpers
    const tableRows = sorted.map(a => {
        const primaryYouth = a.youth.filter(y => y.is_primary);
        return {
            Name: a.name,
            Email: a.email,
            Role: a.roleTitle,
            Section: sections.find(s => s.code === a.roleSection)?.label || a.roleSection || '',
            LinkedYouth: primaryYouth.map(y => `${y.name} (${sections.find(s => s.code === y.section)?.label || y.section})`).join(', '),
            Primary: primaryYouth.length > 0 ? 'Yes' : 'No'
        };
    });

    function handleSelectAll(e) {
        if (e.target.checked) {
            setSelectedIds(sorted.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    }

    function handleRowSelect(id) {
        setSelectedIds(ids =>
            ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
        );
    }

    function handleDownloadSelected() {
        const selectedRows = tableRows.filter((row, idx) => selectedIds.includes(sorted[idx].id));
        downloadCSV(selectedRows, 'selected_adult_emails');
    }

    function handleCopySelected() {
        const selectedRows = sorted.filter(a => selectedIds.includes(a.id));
        const emails = uniqueArray(selectedRows.map(a => a.email)).join('; ');
        navigator.clipboard.writeText(emails);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 1500);
    }

    // Multi-select for roles/sections
    function handleMultiSelect(e, setter) {
        let vals = Array.from(e.target.selectedOptions, opt => opt.value);
        if (vals.includes('')) {
            setter(['']);
        } else if (vals.length === 0) {
            setter(['']);
        } else {
            setter(vals);
        }
    }

    return (
        <div className="content-box">
            <PageTitle>
                <Mail size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Adult/Parent Email Distribution List
            </PageTitle>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <input
                    type="text"
                    placeholder="Search (name, email, youth)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', minWidth: 180 }}
                />
                <label>
                    <select
                        multiple
                        value={selectedRoles}
                        onChange={e => handleMultiSelect(e, setSelectedRoles)}
                        style={{ minWidth: 110, padding: 4, borderRadius: 6, border: '1px solid #ccc', height: 60 }}
                    >
                        {roleOptions.map(r =>
                            <option key={r.value} value={r.value}>{r.label}</option>
                        )}
                    </select>
                </label>
                <label>
                    <select
                        multiple
                        value={selectedSections}
                        onChange={e => handleMultiSelect(e, setSelectedSections)}
                        style={{ minWidth: 110, padding: 4, borderRadius: 6, border: '1px solid #ccc', height: 60 }}
                    >
                        {sectionOptions.map(s =>
                            <option key={s.value} value={s.value}>{s.label}</option>
                        )}
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                        type="checkbox"
                        checked={primaryOnly}
                        onChange={e => setPrimaryOnly(e.target.checked)}
                    /> Primary Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                        type="checkbox"
                        checked={showOnlySelected}
                        onChange={e => setShowOnlySelected(e.target.checked)}
                    /> Show Selected Only
                </label>
            </div>

            <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                        type="checkbox"
                        checked={selectedIds.length === sorted.length && sorted.length > 0}
                        onChange={handleSelectAll}
                    /> Select All
                </label>
                <PrimaryButton onClick={handleDownloadSelected} disabled={selectedIds.length === 0}>Download Selected CSV</PrimaryButton>
                <PrimaryButton onClick={handleCopySelected} disabled={selectedIds.length === 0}>
                    {copyStatus || 'Copy Selected Emails'}
                </PrimaryButton>
            </div>

            <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: '#fff' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: 8, borderBottom: '1px solid #ddd', width: 40 }}></th>
                            {['Name', 'Email', 'Role', 'Section', 'LinkedYouth', 'Primary'].map(col => (
                                <th
                                    key={col}
                                    style={{
                                        padding: 8,
                                        borderBottom: '1px solid #ddd',
                                        cursor: 'pointer',
                                        background: sortCol === col ? '#e2e8f0' : undefined
                                    }}
                                    onClick={() => {
                                        if (sortCol === col) setSortAsc(a => !a);
                                        else { setSortCol(col); setSortAsc(true); }
                                    }}
                                >
                                    {col}
                                    {sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>Loading…</td></tr>
                        ) : sorted.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center' }}>No matching records.</td></tr>
                        ) : (
                            sorted.map(adult => {
                                const primaryYouth = adult.youth.filter(y => y.is_primary);
                                return (
                                    <tr key={adult.id} style={selectedIds.includes(adult.id) ? { background: '#def' } : {}}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(adult.id)}
                                                onChange={() => handleRowSelect(adult.id)}
                                            />
                                        </td>
                                        <td style={{ padding: 8 }}>{adult.name}</td>
                                        <td style={{ padding: 8 }}>{adult.email}</td>
                                        <td style={{ padding: 8 }}>{adult.roleTitle}</td>
                                        <td style={{ padding: 8 }}>{sections.find(s => s.code === adult.roleSection)?.label || adult.roleSection || ''}</td>
                                        <td style={{ padding: 8 }}>
                                            {primaryYouth.length
                                                ? primaryYouth.map(y =>
                                                    `${y.name} (${sections.find(s => s.code === y.section)?.label || y.section})`
                                                ).join(', ')
                                                : ''}
                                        </td>
                                        <td style={{ padding: 8, textAlign: 'center' }}>
                                            {primaryYouth.length > 0 ? 'Yes' : 'No'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
