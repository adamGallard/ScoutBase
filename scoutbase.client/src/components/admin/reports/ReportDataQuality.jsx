// src/components/admin/reports/ReportDataQuality.jsx

import React, { useEffect, useState } from 'react';
import { PageWrapper, PageTitle, PrimaryButton, CompactSelect } from '@/components/common/SharedStyles';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { FileCheck2 } from 'lucide-react';
import { sections, stages } from '@/components/common/Lookups.js';

function ReportCard({ title, description, data, filename, fixPathBase }) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{description}</p>

            <ul style={{ marginBottom: '1rem' }}>
                {data.slice(0, 5).map(item => (
                    <li key={item.id}>
                        {item.name || item.email || `ID: ${item.id}`}{' '}
                        <a href={`${fixPathBase}?id=${item.id}`} style={{ fontSize: '0.8rem', color: '#0F5BA4' }}>
                            Fix
                        </a>
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
            // 1) Find the "Retired" stage code
            const retiredCode = stages.find(s => s.label === 'Retired')?.code;

            // 2) Fetch each dataset, defaulting to [] if undefined
            const { data: pypData = [] } = await supabase
                .from('parent_youth')
                .select('parent_id, youth_id, is_primary');

            const { data: parentsData = [] } = await supabase
                .from('parent')
                .select('id, name, email, phone, group_id')
                .eq('group_id', groupId);

            const { data: youthData = [] } = await supabase
                .from('youth')
                .select('id, name, section, patrol_id, group_id, membership_stage')
                .eq('group_id', groupId)
                .neq('membership_stage', retiredCode);

            const { data: patrolsData = [] } = await supabase
                .from('patrols')
                .select('id, name, group_id, section')
                .eq('group_id', groupId);

            const { data: transitionsData = [] } = await supabase
                .from('youth_transitions')
                .select('youth_id');

            // 3) Compute each report slice

            // Youth missing a primary parent
            const primaryLinks = new Set(pypData.filter(p => p.is_primary).map(p => p.youth_id));
            const youthWithNoPrimary = youthData.filter(y => !primaryLinks.has(y.id));

            // Parents with no linked youth
            const parentsWithLinks = new Set(pypData.map(p => p.parent_id));
            const unlinkedParents = parentsData.filter(p => !parentsWithLinks.has(p.id));

            // Youth not assigned to a patrol
            const youthWithNoPatrol = youthData.filter(y => !y.patrol_id);

            // Patrols without any youth
            const patrolsWithYouth = new Set(youthData.map(y => y.patrol_id).filter(Boolean));
            const patrolsNoYouth = patrolsData.filter(p => !patrolsWithYouth.has(p.id));

            // Patrols missing a PL or APL
            const { data: youthRolesData = [] } = await supabase
                .from('youth')
                .select('patrol_id, rank');
            const patrolsMissingPLAPL = patrolsData.filter(p => {
                const members = youthRolesData.filter(r => r.patrol_id === p.id);
                return !members.some(m => m.rank === 'PL') || !members.some(m => m.rank === 'APL');
            });

            // 1. Build a map of youth by ID for easy lookup
            const youthById = new Map(youthData.map(y => [y.id, y]));

            // 2. Build a map: parentId -> [linked youth]
            const parentToYouth = {};
            pypData.forEach(link => {
                if (!parentToYouth[link.parent_id]) parentToYouth[link.parent_id] = [];
                parentToYouth[link.parent_id].push(youthById.get(link.youth_id));
            });

            // 3. Find parents where all linked youth are retired (or all links are null/missing)
            const parentsAllYouthRetired = parentsData.filter(parent => {
                const youthLinks = parentToYouth[parent.id] || [];
                // If they have at least 1 youth AND all are retired
                return youthLinks.length > 0 && youthLinks.every(
                    y => y && y.membership_stage === retiredCode
                );
            });

            // Youth without any transitions
            const transitionedIds = new Set(transitionsData.map(t => t.youth_id));
            const noTransition = youthData.filter(y => !transitionedIds.has(y.id));

            // Parents missing both email and phone
            const noContactParents = parentsData.filter(p => !p.email && !p.phone);

            // 4) Update state
            setReports({
                missingPrimaryParent: youthWithNoPrimary,
                unlinkedParents,
                missingPatrol: youthWithNoPatrol,
                patrolsWithoutYouth: patrolsNoYouth,
                patrolsMissingLeaders: patrolsMissingPLAPL,
                youthWithoutTransitions: noTransition,
                parentsMissingContact: noContactParents,
                parentsAllYouthRetired // <--- new!
            });
        };

        if (groupId) {
            loadReports();
        }
    }, [groupId]);

    // Only filter arrays that have a `.section` property:
    const filterBySection = items =>
        sectionFilter === ''
            ? items
            : items.filter(item => item.section === sectionFilter);



      // Prepare filtered lists for section‐aware categories
          const filteredReports = {
            missingPrimaryParent: filterBySection(reports.missingPrimaryParent),
            unlinkedParents: reports.unlinkedParents,
               missingPatrol: filterBySection(reports.missingPatrol),
                    patrolsWithoutYouth: filterBySection(reports.patrolsWithoutYouth),
                        patrolsMissingLeaders: filterBySection(reports.patrolsMissingLeaders),
                            youthWithoutTransitions: filterBySection(reports.youthWithoutTransitions),
                                parentsMissingContact: reports.parentsMissingContact
                                  };
  // Check if any category has items
      const anyIssues = Object.values(filteredReports).some(arr => arr.length > 0);
  return (
        <PageWrapper>
            <PageTitle>
                <FileCheck2 size={24} style={{ marginRight: '0.5rem' }} />
                Data Quality Reports
            </PageTitle>
            <p style={{ marginBottom: '1rem', color: '#444' }}>
                Check for missing links or important data gaps in your group records.
            </p>

            <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="sectionFilter" style={{ marginRight: '0.5rem' }}>
                    Filter by section:
                </label>
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
                        ))}
                </CompactSelect>
            </div>
          
                {/* If no issues found, show a friendly message */}
               {!anyIssues && (
                      <p style={{ padding: '1rem', background: '#e6ffed', border: '1px solid #a3f7c4', borderRadius: '4px', textAlign: 'center' }}>
                            🎉 No data issues found!
                          </p>
                    )}
          


            <ReportCard
                title="Youth Missing Primary Parent"
                description="These youth have no parent marked as primary contact."
              data={filteredReports.missingPrimaryParent}
                filename="youth_missing_primary"
                fixPathBase="/admin/add-youth"
            />

            <ReportCard
                title="Parents Without Linked Youth"
                description="These parents are not linked to any youth."
              data={filteredReports.unlinkedParents}
                filename="unlinked_parents"
                fixPathBase="/admin/add-parent"
            />

            <ReportCard
                title="Youth Not Assigned to a Patrol"
                description="These youth do not have a patrol assigned."
              data={filteredReports.missingPatrol}
                filename="youth_no_patrol"
                fixPathBase="/admin/add-youth"
            />

            <ReportCard
                title="Patrols Without Youth"
                description="These patrols have no youth assigned to them."
              data={filteredReports.patrolsWithoutYouth}
                filename="patrols_no_youth"
                fixPathBase="/admin/patrol-management"
            />

            <ReportCard
                title="Patrols Missing PL or APL"
                description="These patrols are missing either a Patrol Leader or Assistant Patrol Leader."
              data={filteredReports.patrolsMissingLeaders}
                filename="patrols_missing_leaders"
                fixPathBase="/admin/patrol-management"
            />

            <ReportCard
                title="Youth Without Any Transitions"
                description="These youth do not have any entries in the transition history."
              data={filteredReports.youthWithoutTransitions}
                filename="youth_no_transitions"
                fixPathBase="/admin/add-youth"
            />

            <ReportCard
                title="Parents Missing Email or Phone"
                description="These parents have no email or phone number on record."
              data={filteredReports.parentsMissingContact}
                filename="parents_missing_contact"
                fixPathBase="/admin/add-parent"
          />

          <ReportCard
              title="Parents With All Linked Youth Retired"
              description="These parents are only linked to youth who have left or are marked as retired."
              data={filteredReports.parentsAllYouthRetired}
              filename="parents_all_youth_retired"
              fixPathBase="/admin/add-parent"
          />
        </PageWrapper>
    );
}
