import React, { useEffect, useState } from 'react';
import { useParentSession } from '@/helpers/SessionContext';
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

export default function YouthAttendancePage() {
    const { session, loading: sessionLoading } = useParentSession();
    const navigate = useNavigate();
    const { search } = useLocation();
    const isMobile = useIsMobile();

    // --- All hooks at the top ---
    const parent = session?.parent;
    const groupId = session?.groupId;
    const token = session?.token;
    const query = new URLSearchParams(search);
    const groupSlug = query.get('group');

    // State
    const [step, setStep] = useState('list');
    const [youthList, setYouthList] = useState([]);
    const [latestStatusMap, setLatestStatusMap] = useState({});
    const [sectionFilter, setSectionFilter] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Bounce to login if not authenticated
    useEffect(() => {
        if (!sessionLoading && (!parent || !groupId || !token)) {
            navigate(`/sign-in?group=${groupSlug}`, { replace: true });
        }
    }, [sessionLoading, parent, groupId, token, navigate, groupSlug]);

    // Fetch youth and their attendance
    useEffect(() => {
        if (!parent?.id || !groupId || !token) return;
        setLoading(true);
        setError('');
        (async () => {
            try {
                const result = await fetchYouthByParentId(parent.id, token);
                if (result.error) {
                    setError(result.error);
                    setYouthList([]);
                    setLoading(false);
                    return;
                }
                const yl = result.youthList || [];
                setYouthList(yl);
                if (yl.length > 0) {
                    const statusMap = await fetchLatestAttendanceForYouthList(yl, groupId);
                    setLatestStatusMap(statusMap);
                } else {
                    setLatestStatusMap({});
                }
                setLoading(false);
            } catch (err) {
                setError('Could not load youth. Please try again.');
                setLoading(false);
            }
        })();
    }, [parent, groupId, token]);

    // --- Early returns for loading/error/youth-list ---
    if (sessionLoading) return <PageWrapperParent><p>Loading...</p></PageWrapperParent>;
    if (error) return <PageWrapperParent><p style={{ color: 'red' }}>{typeof error === "string" ? error : error.message || JSON.stringify(error)}</p></PageWrapperParent>;
    if (loading) return <PageWrapperParent><p>Loading youth…</p></PageWrapperParent>;
    if (!youthList.length) return <PageWrapperParent><p>No youth found linked to this parent account.</p></PageWrapperParent>;

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
    const filteredYouth = youthList
        .filter(y => !sectionFilter || y.section === sectionFilter)
        .sort((a, b) => {
            if (a.is_primary === b.is_primary) {
                return a.name.localeCompare(b.name);
            }
            return a.is_primary ? -1 : 1;
        });

    const primaryYouth = filteredYouth.filter(y => y.is_primary);
    const otherYouth = filteredYouth.filter(y => !y.is_primary);

    const renderYouthCard = (y) => {
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
                        setSelectedMember(y);
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
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {codeToSectionLabel(y.section)}
                        </div>
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
    };

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

                    {primaryYouth.length > 0 && (
                        <>
                            <h4 style={{ marginLeft: '1rem' }}>Primary Linked Youth</h4>
                            {primaryYouth.map(renderYouthCard)}
                        </>
                    )}
                    {otherYouth.length > 0 && (
                        <>
                            <h4 style={{ marginLeft: '1rem' }}>Other Youth</h4>
                            {otherYouth.map(renderYouthCard)}
                        </>
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
