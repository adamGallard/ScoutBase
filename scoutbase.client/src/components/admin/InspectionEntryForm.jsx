import React, { useState, useEffect } from 'react';
import {
    PageTitle,
    FormGrid,
    PatrolGrid,
    PatrolCard,
    Label,
    PrimaryButton,
    AdminInput, AdminInputLabel, AdminInputWrapper,CompactInputGroup, CompactInput,} from '@/components/sharedStyles';

import { supabase } from '@/lib/supabaseClient';

const InspectionEntryForm = ({ groupId, userInfo, onSubmitted }) => {
    const [date, setDate] = useState('');
    const [week, setWeek] = useState('');
    const [patrols, setPatrols] = useState([]);
    const [scores, setScores] = useState({});

    useEffect(() => {
        const fetchPatrols = async () => {
            const { data } = await supabase
                .from('patrols')
                .select('id, name')
                .eq('group_id', groupId)
                .eq('section', userInfo.section);

            setPatrols(data);
            setScores(
                Object.fromEntries(data.map(p => [p.id, { points: '', members: '' }]))
            );
        };

        fetchPatrols();
    }, [groupId, userInfo.section]);

    const handleChange = (patrolId, field, value) => {
        setScores({
            ...scores,
            [patrolId]: { ...scores[patrolId], [field]: value }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Insert entry row
        const { data: entryData, error: entryError } = await supabase
            .from('inspection_entries')
            .insert({
                group_id: groupId,
                section: userInfo.section,
                date,
                week,
                archived: false
            })
            .select()
            .single();

        if (entryError) return alert('Error creating entry: ' + entryError.message);

        // Prepare scores
        const rows = Object.entries(scores).map(([patrol_id, { points, members }]) => ({
            entry_id: entryData.id,
            patrol_id,
            points: parseFloat(points),
            members: parseInt(members)
        }));

        const { error: scoreError } = await supabase.from('inspection_scores').insert(rows);

        if (scoreError) return alert('Error saving scores: ' + scoreError.message);

        setDate('');
        setWeek('');
        setScores({});
        onSubmitted(); // refresh parent
    };

    return (
        <div>
            <PageTitle>New Inspection Entry</PageTitle>

            <form onSubmit={handleSubmit}>
                <CompactInputGroup>
                    <div>
                        <Label>Date</Label>
                        <CompactInput
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label>Week</Label>
                        <CompactInput
                            type="text"
                            value={week}
                            onChange={(e) => setWeek(e.target.value)}
                            required
                        />
                    </div>
                </CompactInputGroup>

                <PatrolGrid>
                    {patrols.map(({ id, name }) => (
                        <PatrolCard key={id}>
                            <h4>{name}</h4>
                            <Label>Points</Label>
                            <input
                                type="number"
                                value={scores[id]?.points || ''}
                                onChange={(e) => handleChange(id, 'points', e.target.value)}
                            />
                            <Label>Members</Label>
                            <input
                                type="number"
                                value={scores[id]?.members || ''}
                                onChange={(e) => handleChange(id, 'members', e.target.value)}
                            />
                        </PatrolCard>
                    ))}
                </PatrolGrid>

                <PrimaryButton type="submit">Add Entry</PrimaryButton>
            </form>
        </div>
    );
};

export default InspectionEntryForm;
