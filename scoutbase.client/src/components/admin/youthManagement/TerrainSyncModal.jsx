import React from 'react';
import { PrimaryButton } from '@/components/common/SharedStyles';
import { formatDate } from '@/utils/dateUtils';

export default function TerrainSyncModal({ toAdd, toUpdate, onConfirm, onCancel }) {
    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Terrain Sync Preview</h3>

                <div style={{ marginBottom: '1rem' }}>
                    <h4>Youth to be <strong>added</strong> ({toAdd.length})</h4>
                    {toAdd.length === 0 ? <p>None</p> : (
                        <ul>
                            {toAdd.map(y => (
                                <li key={y.terrain_id}>{y.name}  -   {y.member_number}   -  {formatDate(y.dob)}  -  {y.section}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <h4>Youth to be <strong>updated</strong> ({toUpdate.length})</h4>
                    {toUpdate.length === 0 ? <p>None</p> : (
                        <ul>
                            {toUpdate.map(y => (
                                <li key={y.terrain_id} style={{ marginBottom: '0.5rem' }}>
                                    <div>{y.name} – {y.member_number} – {formatDate(y.dob)} – {y.section}</div>
                                    <ul style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                                        {Object.entries(y.fieldChanges || {}).map(([field, { from, to }]) => (
                                            <li key={field}>
                                                <strong>{field}</strong>: "{from}" → "{to}"
                                            </li>
                                        ))}
                                        {y.transition_type && (
                                            <li><strong>transition</strong>: → {y.transition_type}</li>
                                        )}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <PrimaryButton onClick={onConfirm}>Confirm Sync</PrimaryButton>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

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
    maxHeight: '80vh',            // ← constrain height
    overflowY: 'auto',            // ← enable scroll inside modal
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};
