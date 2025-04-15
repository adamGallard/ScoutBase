// ✅ React & React Router
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ✅ Supabase & Custom Hooks
import { supabase } from '@/lib/supabaseClient';
import { useTerrainUser } from '@/hooks/useTerrainUser';
import { checkTokenValidity } from '@/helpers/authHelper';
import { logAuditEvent } from '@/helpers/auditHelper';

// ✅ Layout Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/admin/Sidebar';
import RequireAuth from '@/components/RequireAuth';

// ✅ Shared UI Styles
import {
    PageWrapper, Content, ToggleSwitchWrapper, AdminDropdownContainer,
    AdminDropdownMenu,
    AdminDropdownToggle, Label, StyledSelect, AdminHeaderRow,
    AdminWarningLabel
} from '@/components/SharedStyles';
import { Settings, LogOut, MapPin,User } from 'lucide-react';

// ✅ Admin Functionality
import PinModal from '@/components/admin/PinModal';
import LinkModal from '@/components/admin/LinkModal';
import AttendanceView from '@/components/admin/AttendanceView';
import ParentView from '@/components/admin/ParentView';
import YouthView from '@/components/admin/YouthView';
import UserManagementView from '@/components/admin/UserManagementView';
import GroupManagementView from '@/components/admin/GroupManagementView';
import Reports from '@/components/admin/Reports';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import UserDashboard from '@/components/admin/UserDashboard';
import AuditLogViewer from '@/components/admin/AuditLogViewer'; 
import PatrolManagementView from '@/components/admin/PatrolManagementView';

// ✅ Report Views
import ReportParentEmails from '@/components/admin/reports/ReportParentEmails';
import ReportYouthBySection from '@/components/admin/reports/ReportYouthBySection';
import ReportAge from '@/components/admin/reports/ReportAge';
import { useActingGroup } from "@/hooks/useActingGroup";

import GroupQRCode from '@/components/admin/GroupQRCode';




export default function AdminPage() {
    const [groups, setGroups] = useState([]);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinParentId, setPinParentId] = useState(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const { userInfo, loading: userLoading } = useTerrainUser();
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [sectionFilter, setSectionFilter] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const subPath = location.pathname.split('/admin/')[1];
    const { actingAsGroupId, setActingAsGroupId, actingAsAdmin, setActingAsAdmin } = useActingGroup();
    const [showDropdown, setShowDropdown] = useState(false);


    useEffect(() => {
        if (!checkTokenValidity()) {
			navigate('/Logout');
        }
    }, []);

    useEffect(() => {
        const restrictedPaths = ['attendance', 'add-parent', 'add-youth'];

        if (
            userInfo?.role === 'superadmin' &&
            !actingAsAdmin &&
            restrictedPaths.includes(subPath)
        ) {
            navigate('/admin/admindashboard');
        }
    }, [actingAsAdmin, subPath, userInfo?.role, navigate]);

    useEffect(() => {
        if (!userLoading && userInfo) {
            if (userInfo?.role === 'superadmin') {
                supabase.from('groups').select('id, name,slug').then(({ data }) => {
                    setGroups(data || []);
                    if (data?.length) setActiveGroupId(String(data[0].id));
                });
            } else if (userInfo.group_id) {
                supabase
                    .from('groups')
                    .select('id, name, slug')
                    .eq('id', userInfo.group_id)
                    .then(({ data }) => {
                        setGroups(data || []);
                        setActiveGroupId(String(userInfo.group_id));
                    });
            }
        }
    }, [userInfo, userLoading]);


    const group = groups.find((g) => g.id === userInfo?.group_id);

    const renderContent = () => {
        if (userLoading || !userInfo) return <p>Loading user info...</p>;
        if (!activeGroupId) return <p>Loading group data...</p>;

        switch (subPath) {
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
            case 'reports':
                return <Reports />;
            case 'report-parent-emails':
                return <ReportParentEmails groupId={userInfo.group_id} />;
            case 'report-youth-by-section':
                return <ReportYouthBySection groupId={userInfo.group_id} />;
            case 'report-age':
                return <ReportAge groupId={userInfo.group_id} />;
            case 'audit-log':
                return <AuditLogViewer activeGroupId={activeGroupId} />;
            case 'qr-code':
                return <GroupQRCode groupStub={group?.slug} />;
            case 'patrol-management':
                return <PatrolManagementView groupId={activeGroupId} />;
            default:
                if (userInfo?.role === 'superadmin') return <SuperAdminDashboard />;
                if (userInfo?.role === 'admin') return <AdminDashboard userInfo={userInfo} />;
                if (userInfo?.role === 'user') return <UserDashboard userInfo={userInfo} />;
                return <p>Access denied</p>;
        }

    };

    const handleLogout = () => {
        // Add logout logic here if needed
        navigate('/Logout');
    };


    return (
        <RequireAuth>
            {showPinModal && (
                <PinModal
                    parentId={pinParentId}
                    groupId={activeGroupId}
                    userInfo={userInfo}
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
                <Header />
                    

                <div style={{ display: 'flex', flex: 1 }}>
                    <Sidebar onNavigate={(path) => navigate(`/admin/${path}`)}
                        userInfo={userInfo}
                        actingAsGroupId={actingAsGroupId}
                        actingAsAdmin={actingAsAdmin} />

                    <Content style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

                            {groups.length > 0 && (
                                <>
                                    <AdminHeaderRow isWarning={userInfo?.role === 'superadmin' && actingAsAdmin}>
                                        {userInfo?.role === 'superadmin' && actingAsAdmin && (
                                            <AdminWarningLabel>⚠️ Acting as Admin</AdminWarningLabel>
                                        )}
                                    <AdminDropdownContainer>
                                        <AdminDropdownToggle onClick={() => setShowDropdown((prev) => !prev)}>
                                            <Settings size={18} />
                                        </AdminDropdownToggle>

                                        {showDropdown && (
                                            <AdminDropdownMenu>
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                                    <User size={16}/> {userInfo?.name} ({userInfo?.role})
                                                </div>
                                                    <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <MapPin size={16} />
                                                        {groups.find((g) => g.id === userInfo?.group_id)?.name || 'Unknown Group'}
                                                    </Label>
                                                

                                                {userInfo?.role === 'superadmin' && (
                                                    <>
                                                        <Label>Group:</Label>
                                                        <StyledSelect
                                                            value={activeGroupId}
                                                            onChange={(e) => setActiveGroupId(e.target.value)}
                                                        >
                                                            {groups.map((g) => (
                                                                <option key={g.id} value={g.id}>{g.name}</option>
                                                            ))}
                                                        </StyledSelect>

                                                        <ToggleSwitchWrapper>
                                                            <span className="text-sm">Act as Admin</span>
                                                            <label className="toggle-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={actingAsAdmin}
                                                                    onChange={async (e) => {
                                                                        const checked = e.target.checked;
                                                                        setActingAsAdmin(checked);
                                                                        setActingAsGroupId(checked ? activeGroupId : null);

                                                                        await logAuditEvent({
                                                                            userId: userInfo.id,
                                                                            groupId: activeGroupId,
                                                                            role: 'superadmin',
                                                                            action: 'toggle_acting_as_admin',
                                                                            targetType: 'group',
                                                                            targetId: activeGroupId,
                                                                            metadata: { enabled: checked }
                                                                        });
                                                                    }}
                                                                />
                                                                <span className="toggle-slider"></span>
                                                            </label>
                                                        </ToggleSwitchWrapper>
                                                    </>
                                                )}

                                                <button
                                                    onClick={handleLogout}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        color: '#dc2626',
                                                        fontSize: '1rem',
                                                        fontWeight: 300,
                                                        border: 'none',
                                                        background: 'none',
                                                        cursor: 'pointer',
                                                        marginTop: '0.5rem'
                                                    }}
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </AdminDropdownMenu>
                                        )}
                                        </AdminDropdownContainer>
                                    </AdminHeaderRow>
                                </>
                            )}



                        {renderContent()}
                    </Content>
                </div>

                <Footer />
            </PageWrapper>
        </RequireAuth>
    );
}
