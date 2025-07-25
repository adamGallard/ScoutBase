import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    fetchYouthByParentId,
    fetchLatestAttendanceForYouthList,
    insertAttendance
} from '@/helpers/attendanceHelper';
import { logAuditEvent } from '@/helpers/auditHelper';
import SignInForm from '@/components/SignInForm';
import {
    PageWrapperParent,
    PageTitle,
    PrimaryButton
} from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups.js';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getISODateInTZ } from '@/utils/dateUtils';
import { clearParentSession } from '@/helpers/authHelper';

const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

export default function YouthAttendancePage({ parent, groupId, token }) {
    const navigate = useNavigate();
    const { search } = useLocation();
    const isMobile = useIsMobile();
    const [error, setError] = useState('');
    // *** Get parent, groupId, token from session ***
    const { state } = useLocation();
    // If not logged in, bounce to login!
    const query = new URLSearchParams(search);
    const groupSlug = query.get('group');

    // State
    const [step, setStep] = useState('list');
    const [youthList, setYouthList] = useState([]);
    const [latestStatusMap, setLatestStatusMap] = useState({});
    const [sectionFilter, setSectionFilter] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("Effect triggered", { parent, groupId, token });
        if (!parent || !groupId || !token) return;
        (async () => {
            setLoading(true);
            const result = await fetchYouthByParentId(parent.id, token);
            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }
            const yl = result.youthList || [];
            setYouthList(yl);
            const statusMap = await fetchLatestAttendanceForYouthList(yl, groupId);
            setLatestStatusMap(statusMap);
            setLoading(false);
        })();
    }, [parent, groupId, token]);

    // Handle sign in/out
    const handleSign = async (memberId, data) => {
        const timestamp = new Date().toISOString();
        const event_date = getISODateInTZ('Australia/Brisbane');
        const result = await insertAttendance({
            youth_id: memberId,
            group_id: groupId,
            action: data.action,
            comment: data.comment || '',
            timestamp,
            event_date,
            signed_by: parent.id,
        }, token);

        if (result.error) {
            alert('Error saving attendance. Please try again.');
            return;
        }

        await logAuditEvent({
            userId: parent.id,
            groupId,
            role: 'parent',
            action: data.action,
        });

        setStep('list');
        setSelectedMember(null);
        // Reload latest statuses
        const statusMap = await fetchLatestAttendanceForYouthList(youthList, groupId);
        setLatestStatusMap(statusMap);
    };

    // Filter youth by section
    const filteredYouth = youthList.filter(
        y => !sectionFilter || y.section === sectionFilter
    );
    if (error) return <div style={{ color: 'red' }}>{typeof error === "string" ? error : error.message || JSON.stringify(error)}</div>;
    return (
        <PageWrapperParent style={{ padding: '0rem', paddingBottom: '56px' }}>
            <PageTitle style={{ marginBottom: '1rem' }}>
                {parent?.name}
            </PageTitle>

            {step === 'list' && (
                <p style={{ fontSize: '1rem', color: '#555', marginBottom: '1rem' }}>
                    Please select your child from the list below to sign them in or out.
                </p>
            )}

            {step === 'list' && (
                <>
                    <div style={{
                        margin: '1rem auto', display: 'flex', gap: '0.5rem', width: '90%',
                        maxWidth: '500px',
                    }}>
                        <label style={{ flex: 1 }}>
                            Filter Section:
                            <select
                                value={sectionFilter}
                                onChange={e => setSectionFilter(e.target.value)}
                                style={{
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    borderRadius: 6,
                                    border: '1px solid #ccc',
                                    width: '100%',
                                }}
                            >
                                <option value="">All</option>
                                {sections.map(s => (
                                    <option key={s.code} value={s.code}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <p>Loading youth…</p>
                    ) : (
                        filteredYouth.map(y => {
                            const latest = latestStatusMap[y.id];
                            return (
                                <div
                                    key={y.id}
                                    style={{
                                        width: '90%',
                                        maxWidth: '500px',
                                        background: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        margin: '0.5rem auto',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setSelectedMember(y)
                                            setStep('form');
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '1rem' : '0.95rem',
                                        }}
                                    >
                                        <div>
                                            <div><strong>{y.name}</strong></div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280', }}>{codeToSectionLabel(y.section)}</div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: latest?.action === 'signed in' ? '#10b981' : '#ef4444',
                                                fontWeight: 'bold',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {latest ? (
                                                <>
                                                    {latest.action} at<br />
                                                    {new Date(latest.timestamp).toLocaleString('en-AU', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </>
                                            ) : (
                                                'Not signed in'
                                            )}
                                        </div>
                                    </button>
                                </div>
                            );
                        })
                    )}

                    <PrimaryButton
                        isMobile={isMobile}
                        type="button"
                        onClick={() => {
                            clearParentSession();
                            navigate(`/sign-in?group=${groupSlug}`);
                        }}
                    >
						Logout of ScoutBase
                    </PrimaryButton>
                </>
            )}

            {step === 'form' && selectedMember && (
                <SignInForm
                    member={selectedMember}
                    parentName={parent.name}
                    onSign={handleSign}
                    onCancel={() => {
                        setStep('list');
                        setSelectedMember(null);
                    }}
                    latestStatus={latestStatusMap[selectedMember.id]}
                />
            )}
        </PageWrapperParent>
    );
}
