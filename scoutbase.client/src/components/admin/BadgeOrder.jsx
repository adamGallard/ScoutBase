import { useEffect, useState, useCallback } from 'react';
import { Check, X, Mail, RefreshCcw, Award } from 'lucide-react';
import { getTerrainProfiles } from '@/helpers/terrainSyncHelper';   // you already have this
import { getPendingAwardSubmissions, getSIAAchievementsForMember } from '@/helpers/terrainBadgesHelper';   // function we built earlier
import {
    PageWrapper, Main, Content, PageTitle, PrimaryButton, AdminTable
} from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups.js';
import OrderPreviewModal from '@/components/Admin/OrderPreviewModal'; // created below

/* -------------------- helpers -------------------- */

const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

function formatBadge(bType, meta = {}) {
    switch (bType) {
        case 'special_interest_area':
            // meta.sia_area looks like "sia_adventure_sport"
            return `SIA - ${meta.sia_area?.replace('sia_', '').replace(/_/g, ' ')}`;

        case 'outdoor_adventure_skill':
            // meta.stream, meta.stage
            return `OAS - ${meta.stream} Stage ${meta.stage}`;

        case 'course_reflection':
            // meta.course_type or meta.title may exist; fall back gracefully
            return `Course Reflection${meta.course_type ? ` – ${meta.course_type}` : ''}`;

        case 'personal_reflection':
            return 'Personal Reflection';

        case 'intro_section':
            // meta.section could be "Joeys" / "Cubs" / etc.
            return `Intro to ${meta.section ?? 'Section'}`;

        case 'intro_scouting':
            return 'Intro to Scouting';

        case 'adventurous_journey':
            return 'Adventurous Journey';

        case 'milestone':
            // meta.stage holds 1, 2 or 3
            return `Milestone Stage ${meta.stage ?? '?'}`;

        case 'peak_award':
            // meta.award_name might be "Australian Scout Award"
            return `Peak Award${meta.award_name ? ` – ${meta.award_name}` : ''}`;

        default:
            return 'Unknown badge';
    }
}

/* -------------------- main component -------------------- */

export default function BadgeOrderView({ groupId, userInfo }) {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selected, setSelected] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [itemsPerPage] = useState(12);
    const [page, setPage] = useState(1);
    const groupName = userInfo?.group_name ?? 'Unknown';
    const leaderName = userInfo?.name ?? 'Unknown';

    //console.log('BadgeOrderView props:', { userInfo, groupName, leaderName });

    /* ---------- inside your component ---------- */
    const fetchBadges = useCallback(async () => {
        setLoading(true);
        try {
            /* 1 ▸ Terrain auth token */
            const token = localStorage.getItem('scoutbase-terrain-idtoken');
            if (!token) throw new Error('No Terrain token - please log in');

            /* 2 ▸ Which units can I see?  (cache first, then API) */
            const cached = localStorage.getItem('scoutbase-terrain-units');
            const units = cached ? JSON.parse(cached)
                : await getTerrainProfiles(token);   // [{unitId,section}, …]

            /* 3 ▸ Pull pending awards for every unit, flatten into one array */
            const results = [];
            for (const u of units) {
                const pending = await getPendingAwardSubmissions(token, u.unitId);
                pending.forEach(r => results.push({ ...r, section: u.section }));
            }
            //console.log('Pending awards:', results);
            /* 4 ▸ ———  SIA enrichment  ——— */
            const siaRows = results.filter(r => r.badgeType === 'special_interest_area');
			//console.log('SIA rows:', siaRows);
            /* pull each member’s SIA achievements once */
            const memberIds = [...new Set(siaRows.map(r => r.memberId))];
            for (const mId of memberIds) {
                const achievements = await getSIAAchievementsForMember(token, mId);
                const lookup = Object.fromEntries(achievements.map(a => [a.id, a]));

                siaRows.filter(r => r.memberId === mId).forEach(r => {
                    const ach = lookup[r.badgeId];
				    if (!ach) return;                         // safety

                    r.projectName =
                        // Cub / Scout / Venturer SIA “plan” template
                        ach.answers?.project_name?.trim() ||
                        // fallback used by the “review” template in some sections
                        ach.answers?.project_title?.trim() ||
                        // last-ditch: nothing found
                        '';
                    r.approvedDate = ach.status_updated || '';   
                    r.approvedBy = ach.approval?.actioned_by?.[0]
                        ? `${ach.approval.actioned_by[0].member_first_name} ${ach.approval.actioned_by[0].member_last_name}`
                        : '';
                });
            }

            /* 5 ▸ push to state */
            setBadges(results);
        } catch (err) {
            console.error('Badge fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => { fetchBadges(); }, [fetchBadges]);

    /* ---------- selection helpers ---------- */

    const selectAllPage = checked => {
        paged.forEach(b => setSelected(s => ({ ...s, [b.submissionId]: checked })));
    };

    /* ---------- filtering & paging ---------- */
    const filtered = badges.filter(b => {
        const matchesSearch = b.youthName.toLowerCase()
            .includes(filterText.toLowerCase());
        const matchesSection = !sectionFilter ||
            codeToSectionLabel(b.section) === codeToSectionLabel(sectionFilter);
        const matchesType = !typeFilter || b.badgeType === typeFilter;
        return matchesSearch && matchesSection && matchesType;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const paged = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    /* ---------- order generation ---------- */
    const selectedRows = badges.filter(b => selected[b.submissionId]);
    /* helper used below */
    const toAusDate = iso =>
        iso ? new Date(iso).toLocaleDateString('en-AU') : 'TBC';

    /**
     * Build the text that goes inside the mailto: body
     *  – leaderName can come from userInfo, auth context, etc.
     *  – groupName likewise (or hard-code)
     */
    const sectionList = [...new Set(
        selectedRows.map(b => codeToSectionLabel(b.section))
    )].join(', ') || 'All Sections';

    const buildEmailBody = (leaderName, groupName) => {
        const header =
            `Badge Order Request
Group : ${groupName}
Section: ${sectionList}
Leader: ${leaderName}

`; // blank line before bullets

        const lines = selectedRows.map(b => {
            const badge = formatBadge(b.badgeType, b.badgeMeta);
            const section = codeToSectionLabel(b.section);
            const proj = b.projectName ? ` – “${b.projectName}”` : '';
            const when = b.approvedDate ? ` – approved ${toAusDate(b.approvedDate)}` : '';
            return `• ${b.youthName} (${section}) – ${badge}${proj}${when}`;
        });

        return header + lines.join('\n');
    };

    const handleGenerateOrder = () => {
        if (!selectedRows.length) return alert('Select at least one badge.');
        setShowPreview(true);
    };
    const toggleSelect = (badgeId) => {
        setSelected((prev) => ({
            ...prev,
            [badgeId]: !prev[badgeId]
        }));
    };

    /* -------------------- render -------------------- */
    return (
        <div className="content-box">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                <PageTitle>
                    <Award size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Badge Order
                </PageTitle>

                        <PrimaryButton onClick={fetchBadges}>
                            <RefreshCcw size={18} style={{ marginRight: 4 }} />Refresh
                        </PrimaryButton>
                    </div>

                    {/* filters */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <input placeholder="Search youth"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6 }} />

                        <select value={sectionFilter}
                            onChange={e => { setSectionFilter(e.target.value); setPage(1); }}
                            style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 6 }}>
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
                    <option value="special_interest_area">SIA (Special Interest Area)</option>
                    <option value="outdoor_adventure_skill">OAS (Outdoor Adventure Skill)</option>
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

                        <PrimaryButton style={{ marginLeft: 'auto' }}
                            onClick={handleGenerateOrder}>
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
                                <th />
                                <th>Youth</th>
                                <th>Section</th>
                                <th>Badge</th>
                                <th>Project</th>
                                <th>Status</th>      
                                <th>Approved by</th>    
                                <th>Approved on</th>    
                                <th>Submitted</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paged.map(b => (
                                <tr key={b.submissionId}>
                                    <td><input type="checkbox"
                                        checked={!!selected[b.submissionId]}
                                        onChange={() => toggleSelect(b.submissionId)} /></td>
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


                    {/* preview modal */}
            {showPreview && (
                <OrderPreviewModal
                 emailBody   ={buildEmailBody(leaderName, groupName)}
                 groupName   ={groupName}
                    leaderName={leaderName}
                    section={sectionList}
            onClose     ={() => setShowPreview(false)}
  />
)}

</div>
    );
}
