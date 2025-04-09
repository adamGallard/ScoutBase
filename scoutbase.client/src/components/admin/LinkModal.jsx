import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

export default function LinkModal({ parentId, onClose, groupId }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);
    const [selectedYouthId, setSelectedYouthId] = useState('');

    useEffect(() => {
        if (parentId) {
            loadLinkedYouth();
            loadAllYouth();
        }
    }, [parentId]);

    const loadLinkedYouth = async () => {
        const { data } = await supabase
            .from('parent_youth')
            .select('youth (id, name, section)')
            .eq('parent_id', parentId);
        if (data) {
            setLinkedYouth(data.map(l => l.youth));
        }
    };

    const loadAllYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, section')
            .eq('group_id', groupId);
        if (data) {
            setAvailableYouth(data);
        }
    };

    const addLink = async () => {
        if (!selectedYouthId) return;
        await supabase.from('parent_youth').insert([
            { parent_id: parentId, youth_id: selectedYouthId, group_id: groupId }
        ]);
        setSelectedYouthId('');
        loadLinkedYouth();
    };

    const removeLink = async (youthId) => {
        await supabase
            .from('parent_youth')
            .delete()
            .eq('parent_id', parentId)
            .eq('youth_id', youthId);
        loadLinkedYouth();
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Linked Youth</h3>
                <ul>
                    {linkedYouth.map((youth) => (
                        <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>{youth.name} ({youth.section})</span>
                            <button onClick={() => removeLink(youth.id)}>Remove</button>
                        </li>
                    ))}
                </ul>

                <h4>Add Youth</h4>
                <select
                    value={selectedYouthId}
                    onChange={(e) => setSelectedYouthId(e.target.value)}
                >
                    <option value="">Select a youth...</option>
                    {availableYouth
                        .filter(y => !linkedYouth.find(l => l.id === y.id))
                        .map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name} ({y.section})
                            </option>
                        ))}
                </select>
                <button
                    onClick={addLink}
                    disabled={!selectedYouthId}
                    style={{ marginTop: '1rem' }}
                >
                    Add
                </button>

                <ButtonRow>
                    <button onClick={onClose}>Close</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}
// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: sans-serif; 
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #111827;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    margin: 1rem 0;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #111827;
  }

  button {
    padding: 0.5rem 1rem;
    font-weight: 600;
    background: #0F5BA4;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;

    &:hover {
      background: #0c4784;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;


const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;
