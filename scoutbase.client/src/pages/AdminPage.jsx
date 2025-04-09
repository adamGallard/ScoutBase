import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTerrainUser } from '../hooks/useTerrainUser';

import RequireAuth from '../components/RequireAuth';
import Sidebar from '../components/admin/Sidebar';
import AttendanceView from '../components/admin/AttendanceView';
import ParentView from '../components/admin/ParentView';
import YouthView from '../components/admin/YouthView';
import UserManagementView from '../components/admin/UserManagementView';
import GroupManagementView from '../components/admin/GroupManagementView';
import PinModal from '../components/admin/PinModal';
import LinkModal from '../components/admin/LinkModal';
import Footer from '../components/Footer';

import {
    PageWrapper,
    Header,
    TitleGroup,
    Nav,
    Content
} from '../components/SharedStyles';

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
                supabase.from('groups').select('id, name').then(({ data }) => {
                    setGroups(data || []);
                    if (data?.length) setActiveGroupId(String(data[0].id));
                });
            } else if (userInfo.group_id) {
                supabase
                    .from('groups')
                    .select('id, name')
                    .eq('id', userInfo.group_id)
                    .then(({ data }) => {
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
            case 'group-management':
                return <GroupManagementView />;
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

            <PageWrapper style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header>
                    <TitleGroup>
                        <span style={{ width: '12px', height: '12px', backgroundColor: '#facc15', borderRadius: '9999px' }}></span>
                        <strong>ScoutBase</strong>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>Admin Area</span>
                    </TitleGroup>
                    <Nav>
                        <a href="/">Home</a>
                        <a href="mailto:281959@scoutsqld.com.au">Contact</a>
                        <a href="/privacy">Privacy</a>
                    </Nav>
                </Header>

                <div style={{ display: 'flex', flex: 1 }}>
                    <Sidebar onNavigate={setView} userInfo={userInfo} />
                    <Content style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            {groups.length > 0 && (
                                <select
                                    value={activeGroupId}
                                    onChange={(e) => setActiveGroupId(e.target.value)}
                                    disabled={userInfo?.role !== 'superadmin'}
                                >
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div style={{ fontWeight: 'bold', color: '#0F5BA4' }}>
                                Logged in as: {userLoading ? 'Loading...' : userInfo?.name || 'Unknown User'}
                            </div>
                        </div>

                        {renderContent()}
                    </Content>
                </div>

                <Footer />
            </PageWrapper>
        </RequireAuth>
    );
}
