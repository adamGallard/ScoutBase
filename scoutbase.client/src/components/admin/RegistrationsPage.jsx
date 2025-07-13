// src/pages/admin/RegistrationsPage.jsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle } from '@/components/common/SharedStyles';
import { Check, X, ClipboardCheck } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/helpers/auditHelper';
// Inside your approval logic:

export default function RegistrationsPage({ groupId,userInfo }) {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const defaultPIN = '1258'
    useEffect(() => {
        async function fetchPending() {
            setLoading(true);
            // Query all pending families for this group
            const { data, error } = await supabase
                .from('pending_family')
                .select(`
           *,  
          pending_parent(*),
          pending_youth(*),
          pending_parent_youth(*)
        `)
                .eq('group_id', groupId)   // or remove for all
                .eq('status', 'pending');
            if (data) setPending(data);
            setLoading(false);
        }
        fetchPending();
    }, []);

    const handleApprove = async (fam) => {
        try {
;
            const hashedPIN = await bcrypt.hash(defaultPIN, 10);
            // 1. Insert parents
            const { data: realParents, error: parentErr } = await supabase
                .from('parent')
                .insert(fam.pending_parent.map(p => ({
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    skills: p.skills,
                    interests_hobbies: p.interests,
                    group_id: fam.group_id,
                    pin_hash: hashedPIN  // <-- set here!
                })))
                .select();

            if (parentErr) throw new Error(parentErr.message);

            // 2. Insert youth
            const { data: realYouths, error: youthErr } = await supabase
                .from('youth')
                .insert(fam.pending_youth.map(y => ({
                    name: y.name,
                    dob: y.dob,
                    gender: y.gender, // or 'sex' if that's your field
                    section: y.section,
                    group_id: fam.group_id
                })))
                .select();

            if (youthErr) throw new Error(youthErr.message);

            // 3. Build a lookup: pending ID → new real ID
            const parentMap = {};
            fam.pending_parent.forEach((p, i) => { parentMap[p.id] = realParents[i].id; });
            const youthMap = {};
            fam.pending_youth.forEach((y, i) => { youthMap[y.id] = realYouths[i].id; });

            // 4. Insert links (parent_youth)
            const relRows = fam.pending_parent_youth.map(link => ({
                parent_id: parentMap[link.parent_id],
                youth_id: youthMap[link.youth_id],
                group_id: fam.group_id,
                is_primary: link.is_primary,
                relationship: link.relationship
            }));
            if (relRows.length) {
                const { error: linkErr } = await supabase.from('parent_youth').insert(relRows);
                if (linkErr) throw new Error(linkErr.message);
            }

            const transitions = realYouths.map(y => ({
                youth_id: y.id,
                transition_date: new Date().toISOString().split('T')[0], // today as 'YYYY-MM-DD'
                transition_type: 'have_a_go',
                section: y.section
            }));

            const { error: transitionErr } = await supabase
                .from('youth_transitions')
                .insert(transitions);

            if (transitionErr) {
                // handle/log error
            }



            // 5. Delete all pending records (order: child tables first)
            await supabase.from('pending_parent_youth').delete().eq('family_id', fam.id);
            await supabase.from('pending_parent').delete().eq('family_id', fam.id);
            await supabase.from('pending_youth').delete().eq('family_id', fam.id);
            await supabase.from('pending_family').delete().eq('id', fam.id);

            // 6. Log the audit event
            await logAuditEvent({
                userId: userInfo.id,
                groupId: fam.group_id,
                role: userInfo.role,
                action: 'approve_family_registration',
                targetType: 'Family',
                targetId: fam.id,
                metadata: `Approved pending family. Parents: ${fam.pending_parent.map(p => p.email).join(', ')}`
            });

            // UI: Remove from list and show a message
            setPending(pending => pending.filter(f => f.id !== fam.id));
            alert('Family approved and added!');
        } catch (err) {
            alert('Error approving registration: ' + err.message);
        }
    };


    const handleReject = async familyId => {
        // 1. Delete all pending_ for this familyId
        await supabase.from('pending_parent_youth').delete().eq('family_id', familyId);
        await supabase.from('pending_parent').delete().eq('family_id', familyId);
        await supabase.from('pending_youth').delete().eq('family_id', familyId);
        await supabase.from('pending_family').delete().eq('id', familyId);
        setPending(pending => pending.filter(fam => fam.id !== familyId));
    };

    return (
        <div style={{ padding: 24 }}>
            <PageTitle>
                <ClipboardCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Pending Registrations</PageTitle>
            {loading ? (
                <p>Loading…</p>
            ) : pending.length === 0 ? (
                <p>No pending family registrations.</p>
            ) : (
                pending.map(fam => (
                    <div key={fam.id} style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        margin: '18px 0',
                        padding: 16
                    }}>
                        <b>Family ID: {fam.id.slice(0, 8)}...</b>
                        <div style={{ margin: '10px 0 0 0' }}>
                            <b>Parents:</b>
                            {fam.pending_parent.map(parent => (
                                <div key={parent.id} style={{ margin: '3px 0', paddingLeft: 8 }}>
                                    {parent.name} ({parent.email}) – {parent.skills} {parent.interests}
                                </div>
                            ))}
                        </div>
                        <div style={{ margin: '8px 0' }}>
                            <b>Youths:</b>
                            {fam.pending_youth.map(youth => (
                                <div key={youth.id} style={{ margin: '3px 0', paddingLeft: 8 }}>
                                    {youth.name}, {youth.dob} ({youth.section})
                                </div>
                            ))}
                        </div>
                        <div>
                            <b>Relationships:</b>
                            {fam.pending_parent_youth.map(link => (
                                <div key={link.id} style={{ fontSize: 13, paddingLeft: 8 }}>
                                    Parent: {fam.pending_parent.find(p => p.id === link.parent_id)?.name || link.parent_id} —&gt; Youth: {fam.pending_youth.find(y => y.id === link.youth_id)?.name || link.youth_id} ({link.relationship}{link.is_primary ? ', primary' : ''})
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 10 }}>
                            <button
                                style={{ color: 'white', background: '#16a34a', marginRight: 12, border: 'none', borderRadius: 5, padding: '6px 15px' }}
                                onClick={() => handleApprove(fam)}
                            >
                                <Check size={16} style={{ verticalAlign: 'middle' }} /> Approve
                            </button>
                            <button
                                style={{ color: 'white', background: '#dc2626', border: 'none', borderRadius: 5, padding: '6px 15px' }}
                                onClick={() => handleReject(fam.id)}
                            >
                                <X size={16} style={{ verticalAlign: 'middle' }} /> Reject
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
