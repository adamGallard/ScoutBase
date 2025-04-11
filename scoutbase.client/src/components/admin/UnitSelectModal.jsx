import React, { useState } from 'react';
import { PrimaryButton } from '../SharedStyles';

export default function UnitSelectModal({ units, onConfirm, onCancel }) {
    const [selected, setSelected] = useState([]);

    const toggleUnit = (unitId) => {
        setSelected(prev =>
            prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
        );
    };

    const selectAll = () => {
        setSelected(units.map(u => u.unitId));
    };

    const clearAll = () => {
        setSelected([]);
    };

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <h3>Select Units to Sync From</h3>

                {units.length === 0 ? (
                    <p>No units available.</p>
                ) : (
                    <ul>
                        {units.map(u => (
                            <li key={u.unitId}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(u.unitId)}
                                        onChange={() => toggleUnit(u.unitId)}
                                    />
                                    {u.unitName} ({u.section})
                                </label>
                            </li>
                        ))}
                    </ul>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={selectAll}>Select All</button>
                    <button onClick={clearAll}>Clear</button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <PrimaryButton onClick={() => onConfirm(selected)}>Next</PrimaryButton>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};