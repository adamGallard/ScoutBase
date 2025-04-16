import React, { useEffect, useState } from 'react';
import {
    PageTitle,
    AdminTable,
    PrimaryButton, ButtonRowRight
} from '@/components/sharedStyles';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import {BookOpenCheck} from 'lucide-react';
import InspectionEntryForm from './InspectionEntryForm';
import { supabase } from '@/lib/supabaseClient';

const InspectionPage = ({ groupId, userInfo }) => {
    const [section, setSection] = useState(userInfo.section || '');
    const [availableSections, setAvailableSections] = useState([]);
    const [entries, setEntries] = useState([]);
    const [patrols, setPatrols] = useState([]);

    const fetchEntries = async () => {
        const { data, error } = await supabase
            .from('inspection_entries')
            .select(`
        id, date, week,
        inspection_scores (
          patrol_id,
          total,
          patrols ( name )
        )
      `)
            .eq('group_id', groupId)
            .eq('section', section)
            .eq('archived', false)
            .order('date');

        if (!error) {
            const mapped = data.map((entry) => ({
                ...entry,
                scores: entry.inspection_scores.map(s => ({
                    patrol_id: s.patrol_id,
                    patrol_name: s.patrols?.name || '',
                    total: s.total
                }))
            }));
            setEntries(mapped);
        } else {
            console.error(error);
        }
    };

    const fetchPatrols = async () => {
        const { data, error } = await supabase
            .from('patrols')
            .select('id, name')
            .eq('group_id', groupId)
            .eq('section', section);

        if (!error) setPatrols(data);
        else console.error(error);
    };

    const fetchAvailableSections = async () => {
        const { data, error } = await supabase
            .from('patrols')
            .select('section')
            .eq('group_id', groupId);

        if (!error && data) {
            const uniqueSections = [...new Set(data.map(p => p.section))];
            setAvailableSections(uniqueSections);
        }
    };

    const handleArchive = async () => {
        const { error } = await supabase
            .from('inspection_entries')
            .update({ archived: true })
            .eq('group_id', groupId)
            .eq('section', section)
            .eq('archived', false);

        if (!error) {
            alert('Archived successfully');
            fetchEntries();
        } else {
            console.error(error);
        }
    };

    useEffect(() => {
        if (groupId && !userInfo.section) {
            fetchAvailableSections();
        }
    }, [groupId, userInfo]);

    useEffect(() => {
        if (groupId && section) {
            fetchEntries();
            fetchPatrols();
        }
    }, [groupId, section]);

    console.log(userInfo & '' & section )
    if (!userInfo || !groupId) {
        return <div>Loading inspection data...</div>;
    }

    const patrolTotals = patrols.map((p) => {
        let total = 0;
        entries.forEach((entry) => {
            const match = entry.scores.find((x) => x.patrol_id === p.id);
            if (match) total += match.total;
        });
        return { id: p.id, name: p.name, total: parseFloat(total.toFixed(2)) };
    });

    const rankedTotals = [...patrolTotals]
        .sort((a, b) => b.total - a.total)
        .map((item, i) => ({ ...item, rank: i + 1 }));

    const totalsMap = Object.fromEntries(rankedTotals.map(r => [r.id, r]));
    const dateHeaders = entries.map(e => ({
        date: e.date,
        label: e.week || new Date(e.date).toLocaleDateString()
    }));

    return (
        <div>

            <PageTitle>
                <BookOpenCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Inspection Scores
            </PageTitle>


            {!userInfo.section && (
                <div style={{ marginBottom: '1rem' }}>
                    <select
                        id="section-select"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
                    >
                        <option value="" disabled>Select a section</option>
                        {availableSections.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            )}

            <InspectionEntryForm
                groupId={groupId}
                userInfo={{ ...userInfo, section }}
                onSubmitted={fetchEntries}
            />

            <PageTitle>Inspection Totals</PageTitle>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <BarChart data={rankedTotals} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0F5BA4">
                            <LabelList dataKey="total" position="top" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>


            <AdminTable>
                <thead>
                    <tr>
                        <th>Patrol</th>
                        {dateHeaders.map(({ label }) => (
                            <th key={label}>{label}</th>
                        ))}
                        <th>Total</th>
                        <th>Rank</th>
                    </tr>
                </thead>
                <tbody>
                    {patrols.map((p) => {
                        let rowTotal = 0;
                        return (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                {entries.map((entry) => {
                                    const s = entry.scores.find(x => x.patrol_id === p.id);
                                    const val = s ? s.total : 0;
                                    rowTotal += val;
                                    return <td key={`${entry.id}-${p.id}`}>{val.toFixed(2)}</td>;
                                })}
                                <td>{rowTotal.toFixed(2)}</td>
                                <td>{totalsMap[p.id]?.rank ?? '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </AdminTable>
            <ButtonRowRight>
                <PrimaryButton onClick={handleArchive}>
                    Archive Current Term
                </PrimaryButton>
            </ButtonRowRight>
        </div>
    );
};

export default InspectionPage;
