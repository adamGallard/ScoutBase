// src/components/admin/TransitionModal.jsx

import React, { useEffect, useState } from 'react';
import {
    fetchTransitionsForYouth,
    addYouthTransition,
    deleteYouthTransition
} from '@/helpers/supabaseHelpers';
import { PrimaryButton } from '@/components/common/SharedStyles';
import { formatDate } from '@/utils/dateUtils';
import { sections, stages } from '@/components/common/Lookups.js';

// Helpers to map code → human-friendly label
const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

const codeToStageLabel = code =>
    stages.find(s => s.code === code)?.label ?? code;

export default function TransitionModal({
    youth,
    onClose,
    isMobile,
    refreshYouth
}) {
    const [transitions, setTransitions] = useState([]);
    const [form, setForm] = useState({
        transition_type: '',
        section: '',
        transition_date: '',
        notes: '',
    });

    useEffect(() => {
        if (youth?.id) loadTransitions();
    }, [youth]);

    const loadTransitions = async () => {
        const { data } = await fetchTransitionsForYouth(youth.id);
        setTransitions(data || []);
    };

    const handleSubmit = async () => {
        const { transition_type, section, transition_date, notes } = form;

        // If you still want to enforce “section required” for certain transitions,
        // do that here. But the dropdown will always be visible.
        if (
            (transition_type === 'Linking' ||
                transition_type === 'Invested' ||
                transition_type === 'section_change') &&
            !section
        ) {
            alert('Please select a section for this transition.');
            return;
        }

        const { error } = await addYouthTransition({
            youth_id: youth.id,
            transition_type,
            section,
            transition_date,
            notes
        });

        if (error) {
            console.error('Failed to add transition:', error);
            return;
        }

        setForm({
            transition_type: '',
            section: '',
            transition_date: '',
            notes: '',
        });
        await loadTransitions();
        if (refreshYouth) refreshYouth();
    };

    const handleDelete = async id => {
        await deleteYouthTransition(id);
        loadTransitions();
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Transitions for {youth.name}</h3>

                {/* Existing transitions list */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {transitions.map(t => (
                        <div key={t.id} style={{ marginBottom: '0.5rem' }}>
                            <strong>{codeToStageLabel(t.transition_type)}</strong>
                            {t.section ? ` → ${codeToSectionLabel(t.section)}` : ''} on {formatDate(t.transition_date)}
                            {t.notes && <> — {t.notes}</>}
                            <button
                                onClick={() => handleDelete(t.id)}
                                style={{ marginLeft: '1rem' }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>

                {/* Form: Transition + Section + Date + Notes + Add */}
                <div style={{ marginBottom: '1rem' }}>
                    {/* Transition dropdown */}
                    <select
                        value={form.transition_type}
                        onChange={e => setForm({ ...form, transition_type: e.target.value })}
                    >
                        <option value="">Select transition</option>
                        {stages.map(({ code, label }) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>

                    {/* Always-visible Section dropdown */}
                    <select
                        value={form.section}
                        onChange={e => setForm({ ...form, section: e.target.value })}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        <option value="">Select section</option>
                        {sections
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map(({ code, label }) => (
                                <option key={code} value={code}>{label}</option>
                            ))
                        }
                    </select>

                    {/* Date picker */}
                    <input
                        type="date"
                        value={form.transition_date}
                        onChange={e => setForm({ ...form, transition_date: e.target.value })}
                        style={{ marginLeft: '0.5rem' }}
                    />

                    {/* Notes */}
                    <input
                        type="text"
                        placeholder="Notes"
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        style={{ marginLeft: '0.5rem', width: '150px' }}
                    />

                    <PrimaryButton
                        isMobile={isMobile}
                        onClick={handleSubmit}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        Add
                    </PrimaryButton>
                </div>

                <PrimaryButton isMobile={isMobile} onClick={onClose}>
                    Close
                </PrimaryButton>
            </div>
        </div>
    );
}

// Modal backdrop
const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
};

// Modal box
const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '700px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};
