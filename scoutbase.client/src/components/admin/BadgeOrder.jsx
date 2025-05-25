// BadgeOrderView.jsx
import { useEffect, useState, useCallback } from 'react';
import { Mail, RefreshCcw, Award } from 'lucide-react';

import { getTerrainProfiles } from '@/helpers/terrainSyncHelper';
import {
    getPendingAwardSubmissions,
    getSIAAchievementsForMember,
    createBadgeOrderRequests,
    getOrderedBadgesForGroup
} from '@/helpers/terrainBadgesHelper';

import {
    PageTitle,
    PrimaryButton,
    AdminTable
} from '@/components/common/SharedStyles';

import { sections } from '@/components/common/Lookups';
import OrderPreviewModal from '@/components/admin/OrderPreviewModal';

/* ---------- helpers ---------- */

const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

function formatBadge(type, meta = {}) {
    switch (type) {
        case 'special_interest_area':
            return `SIA – ${meta.sia_area?.replace('sia_', '').replace(/_/g, ' ')}`;
        case 'outdoor_adventure_skill':
            return `OAS – ${meta.stream} Stage ${meta.stage}`;
        case 'course_reflection':
            return `Course Reflection${meta.course_type ? ` – ${meta.course_type}` : ''}`;
        case 'personal_reflection':
            return 'Personal Reflection';
        case 'intro_section':
            return `Intro to ${meta.section ?? 'Section'}`;
        case 'intro_scouting':
            return 'Intro to Scouting';
        case 'adventurous_journey':
            return 'Adventurous Journey';
        case 'milestone':
            return `Milestone Stage ${meta.stage ?? '?'}`;
        case 'peak_award':
            return `Peak Award${meta.award_name ? ` – ${meta.award_name}` : ''}`;
        default:
            return 'Unknown badge';
    }
}

/* ---------- component ---------- */

export default function BadgeOrderView({ groupId, userInfo }) {
    /* state */
    const [badges, setBadges] = useState([]);
    const [ordered, setOrdered] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterText, setFilterText] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selected, setSelected] = useState({});

    const [showPreview, setShowPreview] = useState(false);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    const groupName = userInfo?.group_name ?? 'Unknown';
    const leaderName = userInfo?.name ?? 'Unknown';

    /* fetch pending Terrain submissions */
    const fetchBadges = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('scoutbase-terrain-idtoken');
            if (!token) throw new Error('No Terrain token – please log in.');

            const units = JSON.parse(
                localStorage.getItem('scoutbase-terrain-units') ||
                JSON.stringify(await getTerrainProfiles(token))
            ); // [{unitId, section}]

            /* pull & enrich */
            const results = [];
            for (const u of units) {
                const pending = await getPendingAwardSubmissions(token, u.unitId);
                pending.forEach(r => results.push({ ...r, section: u.section }));
            }

            /* SIA enrichment */
            const siaRows = results.filter(r => r.badgeType === 'special_interest_area');
            const memberIds = [...new Set(siaRows.map(r => r.memberId))];

            for (const mId of memberIds) {
                const achievements = await getSIAAchievementsForMember(token, mId);
                const lookup = Object.fromEntries(achievements.map(a => [a.id, a]));
                siaRows.filter(r => r.memberId === mId).forEach(r => {
                    const ach = lookup[r.badgeId];
                    if (!ach) return;

                    r.projectName = ach.answers?.project_name?.trim() ||
                        ach.answers?.project_title?.trim() || '';
                    r.approvedDate = ach.status_updated || '';
                    r.approvedBy = ach.approval?.actioned_by?.[0]
                        ? `${ach.approval.actioned_by[0].member_first_name} ${ach.approval.actioned_by[0].member_last_name}`
                        : '';
                });
            }

            setBadges(results);
        } catch (err) {
            console.error('Badge fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /* fetch list of rows already queued in ScoutBase */
    const fetchOrdered = useCallback(async () => {
        if (!groupId) return;
        const rows = await getOrderedBadgesForGroup(groupId); // helper returns array
         setOrdered(rows);
    }, [groupId]);

    /* initial loads */
    useEffect(() => { fetchBadges(); }, [fetchBadges]);
    useEffect(() => { fetchOrdered(); }, [fetchOrdered]);

    /* filters & paging */
    const filtered = badges
        .filter(b => b.youthName.toLowerCase().includes(filterText.toLowerCase()))
        .filter(b => !sectionFilter || codeToSectionLabel(b.section) === codeToSectionLabel(sectionFilter))
        .filter(b => !typeFilter || b.badgeType === typeFilter)
        .filter(b => !ordered.some(o => o.submission_id === b.submissionId));

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paged = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    /* helpers */
    const selectAllPage = checked =>
        paged.forEach(b => setSelected(s => ({ ...s, [b.submissionId]: checked })));

    const selectedRows = badges.filter(b => selected[b.submissionId]);

    const toAusDate = iso => iso ? new Date(iso).toLocaleDateString('en-AU') : 'TBC';

    /* build email preview text (still used inside the modal) */
    const sectionList = [...new Set(selectedRows.map(b => codeToSectionLabel(b.section)))].join(', ') || 'All Sections';

    const buildEmailBody = () => {
        const header =
            `Badge Order Request
Group : ${groupName}
Section: ${sectionList}
Leader: ${leaderName}

`;
        const lines = selectedRows.map(b => {
            const badge = formatBadge(b.badgeType, b.badgeMeta);
            const section = codeToSectionLabel(b.section);
            const proj = b.projectName ? ` – “${b.projectName}”` : '';
            const when = b.approvedDate ? ` – approved ${toAusDate(b.approvedDate)}` : '';
            return `• ${b.youthName} (${section}) – ${badge}${proj}${when}`;
        });
        return header + lines.join('\n');
    };

    /* submit order requests → DB */
    async function handleConfirmOrder() {
        try {
            await createBadgeOrderRequests(
                selectedRows,
                userInfo.user_id,
                userInfo.group_id
            );
            setSelected({});
            setShowPreview(false);
            await fetchOrdered();        // refresh queue list
        } catch (err) {
            alert(err.message);
        }
    }

    const handleGenerateOrder = () => {
        if (!selectedRows.length) return alert('Select at least one badge.');
        setShowPreview(true);
    };

    /* ---------- render ---------- */
    return (
        <div className="content-box">

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <PageTitle>
                    <Award size={25} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Badge Order
                </PageTitle>

                <PrimaryButton onClick={fetchBadges}>
                    <RefreshCcw size={18} style={{ marginRight: 4 }} />Refresh
                </PrimaryButton>
            </div>

            {/* filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input
                    placeholder="Search youth"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6 }}
                />

                <select
                    value={sectionFilter}
                    onChange={e => { setSectionFilter(e.target.value); setPage(1); }}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6 }}
                >
                    <option value="">All sections</option>
                    {sections.sort((a, b) => a.order - b.order).map(s => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                </select>

                <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6 }}
                >
                    <option value="">All badge types</option>
                    <option value="special_interest_area">SIA</option>
                    <option value="outdoor_adventure_skill">OAS</option>
                    <option value="course_reflection">Course Reflection</option>
                    <option value="personal_reflection">Personal Reflection</option>
                    <option value="intro_section">Intro to Section</option>
                    <option value="intro_scouting">Intro to Scouting</option>
                    <option value="adventurous_journey">Adventurous Journey</option>
                    <option value="milestone">Milestone</option>
                    <option value="peak_award">Peak Award</option>
                </select>

                <button onClick={() => { setFilterText(''); setSectionFilter(''); setTypeFilter(''); }}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: 6 }}>
                    Clear
                </button>

                <PrimaryButton style={{ marginLeft: 'auto' }} onClick={handleGenerateOrder}>
                    <Mail size={18} style={{ marginRight: 4 }} />Generate Order
                </PrimaryButton>
            </div>

            {/* table */}
            {loading ? (
                <p>Loading…</p>
            ) : (
                <AdminTable>
                    <thead>
                        <tr>
                            <th><input type="checkbox" onChange={e => selectAllPage(e.target.checked)} /></th>
                            <th>Youth</th><th>Section</th><th>Badge</th><th>Project</th>
                            <th>Status</th><th>Approved by</th><th>Approved on</th><th>Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map(b => (
                            <tr key={b.submissionId}>
                                <td><input type="checkbox"
                                    checked={!!selected[b.submissionId]}
                                    onChange={() => setSelected(s => ({ ...s, [b.submissionId]: !s[b.submissionId] }))} /></td>
                                <td>{b.youthName}</td>
                                <td>{codeToSectionLabel(b.section)}</td>
                                <td>{formatBadge(b.badgeType, b.badgeMeta)}</td>
                                <td>{b.projectName || '—'}</td>
                                <td>{b.status}</td>
                                <td>{b.approvedBy || '—'}</td>
                                <td>{b.approvedDate ? new Date(b.approvedDate).toLocaleDateString() : '—'}</td>
                                <td>{new Date(b.dateSubmitted).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}

            {/* pagination */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>

            {/* queued/pending list */}
            {ordered.length > 0 && (
                <>
                    <h3 style={{ marginTop: '2rem' }}>Badges Awaiting GL Action</h3>
                    <AdminTable>
                        <thead><tr>
                            <th>Youth</th><th>Section</th><th>Badge</th><th>Project</th><th>Requested</th>
                        </tr></thead>
                        <tbody>
                            {ordered.map(o => (
                                <tr key={o.id}>
                                    <td>{o.youth_name ?? '—'}</td>
                                    <td>{codeToSectionLabel(o.section)}</td>
                                    <td>{formatBadge(o.badge_type, o.badge_meta)}</td>
                                    <td>{o.project_name}</td>
                                    <td>{new Date(o.ordered_date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </AdminTable>
                </>
            )}

            {/* preview modal */}
            {showPreview && (
                <OrderPreviewModal
                    emailBody={buildEmailBody()}
                    groupName={groupName}
                    leaderName={leaderName}
                    section={sectionList}
                    onConfirm={handleConfirmOrder}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
