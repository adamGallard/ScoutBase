import React, { useEffect, useState } from 'react';
import { fetchTransitionsForYouth, addYouthTransition, deleteYouthTransition } from '../../helpers/supabaseHelpers';
import { PrimaryButton } from '../SharedStyles';
import { formatDate } from '../../utils/dateUtils';

export default function TransitionModal({ youth, onClose, isMobile, refreshYouth }) {
    const [transitions, setTransitions] = useState([]);
    const [form, setForm] = useState({
        transition_type: 'section_change',
        section: '',
        transition_date: '',
        notes: '',
    });

    useEffect(() => {
        if (youth?.id) {
            loadTransitions();
        }
    }, [youth]);

    const loadTransitions = async () => {
        const { data } = await fetchTransitionsForYouth(youth.id);
        setTransitions(data || []);
    };

    const handleSubmit = async () => {
        const { data, error } = await addYouthTransition({ ...form, youth_id: youth.id });

        if (error) {
            console.error('Failed to add transition:', error);
            return;
        }

        setForm({
            transition_type: 'section_change',
            section: '',
            transition_date: '',
            notes: ''
        });

        await loadTransitions(); // Ensure this happens AFTER the transition is saved
    };

    const handleDelete = async (id) => {
        await deleteYouthTransition(id);
        loadTransitions();
    };


    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Transitions for {youth.name}</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {transitions.map((t) => (
                        <div key={t.id} style={{ marginBottom: '0.5rem' }}>
                            <strong>{t.transition_type}</strong>
                            {t.section ? ` → ${t.section}` : ''} on {formatDate(t.transition_date)}
                            {t.notes && <> — {t.notes}</>}
                            <button onClick={() => handleDelete(t.id)} style={{ marginLeft: '1rem' }}>Delete</button>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <select
                        value={form.transition_type}
                        onChange={(e) => setForm({ ...form, transition_type: e.target.value })}
                    >
                        <option value="">Select</option>
                        <option value="Have a Go">Have a Go</option>
                        <option value="Linking">Linking</option>
                        <option value="Invested">Invested</option>
                        <option value="Retired">Retired</option>
                    </select>

                    {form.transition_type !== 'left' && (
                        <select
                            value={form.section}
                            onChange={(e) => setForm({ ...form, section: e.target.value })}
                            style={{ marginLeft: '0.5rem' }}
                        >
                            <option value="">Select</option>
                            <option value="Joeys">Joeys</option>
                            <option value="Cubs">Cubs</option>
                            <option value="Scouts">Scouts</option>
                            <option value="Venturers">Venturers</option>
                        </select>
                    )}

                    <input
                        type="date"
                        value={form.transition_date}
                        onChange={(e) => setForm({ ...form, transition_date: e.target.value })}
                        style={{ marginLeft: '0.5rem' }}
                    />

                    <input
                        type="text"
                        placeholder="Notes"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        style={{ marginLeft: '0.5rem', width: '150px' }}
                    />

                    <PrimaryButton isMobile={isMobile} onClick={handleSubmit} style={{ marginLeft: '0.5rem' }}>
                        Add
                    </PrimaryButton>
                </div>

                <PrimaryButton isMobile={isMobile} onClick={onClose}>Close</PrimaryButton>
            </div>
        </div>
    );
}

// Simple modal styling
const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
};

const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '700px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};
