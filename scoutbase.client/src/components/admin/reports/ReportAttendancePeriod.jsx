// src/components/admin/AttendancePeriodReport.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sections, stages } from '@/components/common/Lookups.js';
import { AdminTable, PageTitle, PrimaryButton } from '@/components/common/SharedStyles';
import { downloadCSV } from '@/utils/exportUtils';
import { CalendarClock } from 'lucide-react';

export default function AttendancePeriodReport({ groupId, userInfo }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [section, setSection] = useState('');  // section code
   // Section Leaders are forced to their own section
   const effectiveSection = userInfo?.role === 'Section Leader'
              ? userInfo.section
          : section;
    const [stage, setStage] = useState('');  // stage code
    const [data, setData] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // compute number of weeks (inclusive) between two dates
    const weeksBetween = (start, end) => {
        const msPerWeek = 7 * 24 * 3600 * 1000;
        const diff = new Date(end) - new Date(start);
        return diff < 0 ? 0 : Math.floor(diff / msPerWeek) + 1;
    };

    const loadReport = async () => {
        if (!groupId || !startDate || !endDate) return;
            // find the lookup code for "Retired"
    const retiredStage = stages.find(s => s.label === 'Retired');
    const retiredCode = retiredStage?.code;

        // 1) fetch youth filtered by group, section, stage
        let qry = supabase
            .from('youth')
            .select('id, name, section, membership_stage')
            .eq('group_id', groupId);

        if (effectiveSection) {
              qry = qry.eq('section', effectiveSection);
                }
            if (stage) {
                 // if the user picked a specific stage, filter to that
                      qry = qry.eq('membership_stage', stage);
                } else if (retiredCode) {
                      // otherwise exclude retired by default
                          qry = qry.neq('membership_stage', retiredCode);
                    }

        const { data: youthList, error: yErr } = await qry;
        if (yErr) {
            console.error(yErr);
            return;
        }
        if (!youthList.length) {
            setData([]);
            return;
        }

        const youthIds = youthList.map(y => y.id);

        // 2) fetch all attendance records in the date range
        const { data: attRows, error: aErr } = await supabase
            .from('attendance')
            .select('youth_id, event_date')
            .in('youth_id', youthIds)
            .gte('event_date', startDate)
            .lte('event_date', endDate);
        if (aErr) {
            console.error(aErr);
            return;
        }

        // tally unique dates per youth (count sign-in + sign-out once)
        const dateSets = attRows.reduce((acc, { youth_id, event_date }) => {
            if (!acc[youth_id]) acc[youth_id] = new Set();
            acc[youth_id].add(event_date);
            return acc;
        }, {});
        const counts = Object.fromEntries(
            Object.entries(dateSets).map(([id, dates]) => [id, dates.size])
        );

        // expected sessions (one per week)
        const expected = weeksBetween(startDate, endDate);

        // assemble report rows
        const report = youthList.map(y => ({
            id: y.id,
            name: y.name,
            section: y.section,
            membership_stage: y.membership_stage,
            attended: counts[y.id] || 0,
            expected,
            pct: expected > 0
                ? Math.round((counts[y.id] || 0) / expected * 100)
                : 0
        }));

        setData(report);
    };

    // toggle sort for a given key
    const requestSort = key => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // memoized sorted data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    
          // build and download a CSV of the current sortedData
          const handleExportCSV = () => {
                if (!sortedData.length) return;
                const rows = sortedData.map(r => ({
 Name: r.name,
                      Section: sections.find(s => s.code === r.section)?.label ?? r.section,
                      Stage: stages.find(s => s.code === r.membership_stage)?.label ?? r.membership_stage,
                      Attended: r.attended,
                      Expected: r.expected,
                      Percent: `${r.pct}%`
                }));
        const filename = `attendance_${startDate}_to_${endDate}.csv`;
       downloadCSV(rows, filename);
      };

    return (
        <div className="content-box">
            <PageTitle>
                <CalendarClock size={25} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Attendance Over Period
            </PageTitle>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <label>
                    Start:{' '}
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </label>
                <label>
                    End:{' '}
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </label>
                {userInfo.role !== 'Section Leader' ? (
                      <label>
                            Section:{' '}
                            <select value={section} onChange={e => setSection(e.target.value)}>
                                <option value=''>All Sections</option>
                                 {sections
                                       .slice()
                                       .sort((a, b) => a.order - b.order)
                                       .map(s => (
                                             <option key={s.code} value={s.code}>
                                                   {s.label}
                                                 </option>
                                           ))
                                     }
                               </select>
                          </label>
                    ) : (
                      <input type="hidden" value={userInfo.section} />
                    )}
                <label>
                    Stage:{' '}
                    <select value={stage} onChange={e => setStage(e.target.value)}>
                        <option value="">All</option>
                        {stages
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map(s => (
                                <option key={s.code} value={s.code}>
                                    {s.label}
                                </option>
                            ))}
                    </select>
                </label>
                <PrimaryButton onClick={loadReport}>Run Report</PrimaryButton>
                 <PrimaryButton
          disabled={!data.length}
          onClick={handleExportCSV}
        >
         Export CSV
        </PrimaryButton>
            </div>

            <AdminTable>
                <thead>
                    <tr>
                        <th onClick={() => requestSort('name')}>
                            Name{sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                        <th onClick={() => requestSort('section')}>
                            Section{sortConfig.key === 'section' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                        <th onClick={() => requestSort('membership_stage')}>
                            Stage{sortConfig.key === 'membership_stage' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                        <th onClick={() => requestSort('attended')}>
                            Attended{sortConfig.key === 'attended' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                        <th onClick={() => requestSort('expected')}>
                            Expected{sortConfig.key === 'expected' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                        <th onClick={() => requestSort('pct')}>
                            %{sortConfig.key === 'pct' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map(r => (
                        <tr key={r.id}>
                            <td>{r.name}</td>
                            <td>{sections.find(s => s.code === r.section)?.label ?? r.section}</td>
                            <td>{stages.find(s => s.code === r.membership_stage)?.label ?? r.membership_stage}</td>
                            <td>{r.attended}</td>
                            <td>{r.expected}</td>
                            <td>{r.pct}%</td>
                        </tr>
                    ))}
                </tbody>
            </AdminTable>
        </div>
    );
}
