import { useEffect, useState } from 'react';
import { PageWrapper, PageTitle, PrimaryButton, CompactSelect } from '@/components/common/SharedStyles';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { FileCheck2 } from 'lucide-react';
import { sections } from '@/components/common/Lookups.js';

function ReportCard({ title, description, data, filename, fixPathBase }) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{description}</p>

            <ul style={{ marginBottom: '1rem' }}>
                {data.slice(0, 5).map((item) => (
                    <li key={item.id}>
                        {item.name || item.email || `ID: ${item.id}`} &nbsp;
                        <a href={`${fixPathBase}?id=${item.id}`} style={{ fontSize: '0.8rem', color: '#0F5BA4' }}>Fix</a>
                    </li>
                ))}
                {data.length > 5 && <li>...and {data.length - 5} more</li>}
            </ul>

            <PrimaryButton onClick={() => downloadCSV(data, filename)}>Download CSV</PrimaryButton>
        </div>
    );
}


export default function DataQualityPage({ groupId }) {
    const [sectionFilter, setSectionFilter] = useState('');
    const [reports, setReports] = useState({
        missingPrimaryParent: [],
        unlinkedParents: [],
        missingPatrol: [],
        patrolsWithoutYouth: [],
        patrolsMissingLeaders: [],
        youthWithoutTransitions: [],
        parentsMissingContact: []
    });

    useEffect(() => {
        const loadReports = async () => {
            const [pyp, parents, youth, patrols, transitions] = await Promise.all([
                supabase.from('parent_youth').select('parent_id, youth_id, is_primary'),
                supabase.from('parent').select('id, name, email, phone, group_id').eq('group_id', groupId),
                supabase.from('youth').select('id, name, section, patrol_id, group_id').eq('group_id', groupId),
                supabase.from('patrols').select('id, name, group_id, section').eq('group_id', groupId),
                supabase.from('youth_transitions').select('id, youth_id')
            ]);

            const primaryLinks = new Set(pyp.data.filter(p => p.is_primary).map(p => p.youth_id));
            const youthWithNoPrimary = youth.data.filter(y => !primaryLinks.has(y.id));

            const parentsWithLinks = new Set(pyp.data.map(p => p.parent_id));
            const unlinkedParents = parents.data.filter(p => !parentsWithLinks.has(p.id));

            const youthWithNoPatrol = youth.data.filter(y => !y.patrol_id);
            const patrolsWithYouth = new Set(youth.data.map(y => y.patrol_id).filter(Boolean));
            const patrolsNoYouth = patrols.data.filter(p => !patrolsWithYouth.has(p.id));

            const youthRoles = await supabase.from('youth').select('patrol_id, rank');
            const patrolsMissingPLAPL = patrols.data.filter(p => {
                const members = youthRoles.data.filter(y => y.patrol_id === p.id);
                return !members.some(m => m.rank === 'PL') || !members.some(m => m.rank === 'APL');
            });

            const youthIds = new Set(transitions.data.map(t => t.youth_id));
            const noTransition = youth.data.filter(y => !youthIds.has(y.id));

            const noContactParents = parents.data.filter(p => !p.email && !p.phone);

            setReports({
                missingPrimaryParent: youthWithNoPrimary,
                unlinkedParents,
                missingPatrol: youthWithNoPatrol,
                patrolsWithoutYouth: patrolsNoYouth,
                patrolsMissingLeaders: patrolsMissingPLAPL,
                youthWithoutTransitions: noTransition,
                parentsMissingContact: noContactParents
            });
        };

        if (groupId) loadReports();
    }, [groupId]);

        // only filter items that actually have a `.section` field
   const filterBySection = items =>
              sectionFilter === ''
                    ? items
                : items.filter(item => item.section === sectionFilter);

    return (
        <PageWrapper>
            <PageTitle>
                <FileCheck2 size={24} style={{ marginRight: '0.5rem' }} />Data Quality Reports</PageTitle>
            <p style={{ marginBottom: '1rem', color: '#444' }}>Check for missing links or important data gaps in your group records.</p>

            <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="sectionFilter" style={{ marginRight: '0.5rem' }}>Filter by section:</label>
                <CompactSelect
                    id="sectionFilter"
                    value={sectionFilter}
                    onChange={e => setSectionFilter(e.target.value)}
                >
                    <option value="">All</option>
                    {sections
                        .sort((a, b) => a.order - b.order)
                        .map(({ code, label }) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))
                    }
                </CompactSelect>
            </div>

            <ReportCard
                title="Youth Missing Primary Parent"
                description="These youth have no parent marked as primary contact."
                data={filterBySection(reports.missingPrimaryParent)}
                filename="youth_missing_primary"
                fixPathBase="/admin/add-youth" // ✅ direct path for youth
            />
            <ReportCard
                title="Parents Without Linked Youth"
                description="These parents are not linked to any youth."
                data={reports.unlinkedParents}
                filename="unlinked_parents"
                fixPathBase="/admin/add-parent"
            />

            <ReportCard
                title="Youth Not Assigned to a Patrol"
                description="These youth do not have a patrol assigned."
                data={filterBySection(reports.missingPatrol)}
                filename="youth_no_patrol"
                fixPathBase="/admin/add-youth"
            />

            <ReportCard
                title="Patrols Without Youth"
                description="These patrols have no youth assigned to them."
                data={filterBySection(reports.patrolsWithoutYouth)}
                filename="patrols_no_youth"
                fixPathBase="/admin/patrol-management"
            />

            <ReportCard
                title="Patrols Missing PL or APL"
                description="These patrols are missing either a Patrol Leader or Assistant Patrol Leader."
                data={filterBySection(reports.patrolsMissingLeaders)}
                filename="patrols_missing_leaders"
                fixPathBase="/admin/patrol-management"
            />

            <ReportCard
                title="Youth Without Any Transitions"
                description="These youth do not have any entries in the transition history."
                data={filterBySection(reports.youthWithoutTransitions)}
                filename="youth_no_transitions"
                fixPathBase="/admin/add-youth"
            />

            <ReportCard
                title="Parents Missing Email or Phone"
                description="These parents have no email or phone number on record."
                data={reports.parentsMissingContact}
                filename="parents_missing_contact"
                fixPathBase="/admin/add-parent"
            />
        </PageWrapper>
    );
}
