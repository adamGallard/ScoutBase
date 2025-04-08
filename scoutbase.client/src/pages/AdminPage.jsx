import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/scoutbase-logo.png';
import { useNavigate } from 'react-router-dom';
import { useTerrainUser } from '../hooks/useTerrainUser';
import UserManagementView from '../components/admin/UserManagementView';

import RequireAuth from '../components/RequireAuth';
import Sidebar from '../components/admin/Sidebar';
import AttendanceView from '../components/admin/AttendanceView';
import ParentView from '../components/admin/ParentView';
import YouthView from '../components/admin/YouthView';
import PinModal from '../components/admin/PinModal';
import LinkModal from '../components/admin/LinkModal';

export default function AdminPage() {
    const [view, setView] = useState('attendance');
    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinParentId, setPinParentId] = useState(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const { userInfo, loading: userLoading } = useTerrainUser();
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [sectionFilter, setSectionFilter] = useState('');


    useEffect(() => {
        if (!userLoading && userInfo) {
            if (userInfo.role === 'superadmin') {
                // Fetch all groups for the dropdown
                supabase.from('groups').select('id, name').then(({ data }) => {
                    setGroups(data || []);
                    if (data?.length) {
                        setActiveGroupId(String(data[0].id));
                    }
                });
            } else if (userInfo.group_id) {
                // Fetch only the user's group and still show it in dropdown
                supabase.from('groups').select('id, name').eq('id', userInfo.group_id).then(({ data }) => {
                    setGroups(data || []);
                    setActiveGroupId(String(userInfo.group_id));
                });
            }
        }
    }, [userInfo, userLoading]);

    const renderContent = () => {
        if (userLoading || !userInfo) return <p>Loading user info...</p>;
        if (!activeGroupId) return <p>Loading group data...</p>;

        switch (view) {
            case 'attendance':
                return (
                    <AttendanceView
                        activeGroupId={activeGroupId}
                        selectedDate={selectedDate}
                        sectionFilter={sectionFilter}
                        onDateChange={setSelectedDate}
                        onSectionChange={setSectionFilter}
                    />
                );

            case 'add-parent':
                return (
                    <ParentView
                        groupId={activeGroupId}
                        onOpenPinModal={(id) => {
                            setPinParentId(id);
                            setShowPinModal(true);
                        }}
                        onOpenLinkModal={(id) => {
                            setSelectedParentId(id);
                            setLinkModalOpen(true);
                        }}
                    />
                );
            case 'add-youth':
                return <YouthView groupId={activeGroupId} />;
case 'user-management':
  return <UserManagementView activeGroupId={activeGroupId} />;
            default:
                return <p>Coming soon...</p>;
        }
    };


    return (
        <RequireAuth>
            {showPinModal && (
                <PinModal
                    parentId={pinParentId}
                    groupId={activeGroupId}
                    onClose={() => {
                        setShowPinModal(false);
                        setPinParentId(null);
                    }}
                    
                />
            )}

            {linkModalOpen && (
                <LinkModal
                    parentId={selectedParentId}
                    onClose={() => setLinkModalOpen(false)}
                    groupId={activeGroupId}
                />
            )}

            <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
                {/* Header */}
                <div
                    style={{
                        backgroundColor: '#0F5BA4',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} alt="ScoutBase Logo" style={{ maxWidth: '40px' }} />
                        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Admin</h1>
                    </div>
                    <div style={{ fontSize: '0.9rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        Logged in as: <strong>{userLoading ? 'Loading...' : userInfo?.name || 'Unknown User'}</strong>
                        {groups.length > 0 && (
                            <select
                                value={activeGroupId}
                                onChange={(e) => setActiveGroupId(e.target.value)}
                                disabled={userInfo?.role !== 'superadmin'} // disable for regular admins
                            >
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexGrow: 1 }}>
                    <Sidebar onNavigate={setView} userInfo={userInfo} />
                    <div className="scout-container">{renderContent()}</div>
                </div>
            </div>
        </RequireAuth>
    );
}
