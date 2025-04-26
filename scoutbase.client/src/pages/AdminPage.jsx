// ✅ React & React Router
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ✅ Supabase & Custom Hooks
import { supabase } from '@/lib/supabaseClient';
import { useTerrainUser } from '@/hooks/useTerrainUser';
import { checkTokenValidity } from '@/helpers/authHelper';


// ✅ Layout Components
import AdminHeader from '@/components/admin/common/AdminHeader';
import Footer from '@/components/common/Footer';
import Sidebar from '@/components/admin/common/Sidebar';
import RequireAuth from '@/components/RequireAuth';

// ✅ Shared UI Styles
import {
    PageWrapper, Content, ToggleSwitchWrapper, AdminDropdownContainer,
    AdminDropdownMenu,
    AdminDropdownToggle, Label, StyledSelect, AdminHeaderRow,
    AdminWarningLabel
} from '@/components/common/SharedStyles';
import { Settings, LogOut, MapPin,User } from 'lucide-react';

// ✅ Admin Functionality
import PinModal from '@/components/admin/parentManagement/PinModal';
import LinkModal from '@/components/admin/parentManagement/LinkModal';
import ParentView from '@/components/admin/parentManagement/ParentView';
import YouthView from '@/components/admin/youthManagement/YouthView';
import UserManagementView from '@/components/admin/userManagement/UserManagementView';
import GroupManagementView from '@/components/admin/GroupManagementView';
import Reports from '@/components/admin/reports/Reports';
import AdminDashboard from '@/components/admin/dashbaoards/AdminDashboard';
import SuperAdminDashboard from '@/components/admin/dashbaoards/SuperAdminDashboard';
import UserDashboard from '@/components/admin/dashbaoards/UserDashboard';
import AuditLogViewer from '@/components/admin/AuditLogViewer'; 
import PatrolManagementView from '@/components/admin/patrolManagement/PatrolManagementView';
import AdminNoticeForm from '@/components/admin/AdminNoticeForm'; 
import ParentHeaderLinks from '@/components/admin/ParentHeaderLinks';
import MessageParentsPage from '../components/admin/MessageParentsPage';

// ✅ Report Views
import ReportParentEmails from '@/components/admin/reports/ReportParentEmails';
import ReportYouthBySection from '@/components/admin/reports/ReportYouthBySection';
import ReportAge from '@/components/admin/reports/ReportAge';
import { useActingGroup } from "@/hooks/useActingGroup";
import ReportAttendanceView from '@/components/admin/reports/ReportAttendanceView';
import InspectionPage from '@/components/admin/inspections/InspectionPage';
import GroupQRCode from '@/components/admin/GroupQRCode';
import ReportTransitionHistory from '@/components/admin/reports/ReportTransitionHistory';
import ReportDataQuality from '@/components/admin/reports/ReportDataQuality';
import ReportAttendancePeriod from '@/components/admin/reports/ReportAttendancePeriod';


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

    const handleLogout = () => {
        localStorage.clear(); // Optional: clear saved tokens/role overrides
        navigate('/Logout');
    };
    useEffect(() => {
        if (!checkTokenValidity()) {
			navigate('/Logout');
        }
    }, []);

    useEffect(() => {
        const restrictedPaths = ['attendance', 'add-parent', 'add-youth'];

        if (
            userInfo?.role === 'Super Admin' &&
            !actingAsAdmin &&
            restrictedPaths.includes(subPath)
        ) {
            navigate('/admin/admindashboard');
        }
    }, [actingAsAdmin, subPath, userInfo?.role, navigate]);

    useEffect(() => {
        if (!userLoading && userInfo) {
            if (userInfo?.role === 'Super Admin') {
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
            case 'report-attendance':
                return (
                    <ReportAttendanceView
                        activeGroupId={activeGroupId}
                        selectedDate={selectedDate}
                        sectionFilter={sectionFilter}
                        onDateChange={setSelectedDate}
                        onSectionChange={setSectionFilter}
                        userInfo={userInfo}
                    />
                );
            case 'report-attendance-period':
                return <ReportAttendancePeriod groupId={activeGroupId} userInfo={userInfo} />;


            case 'add-parent':
                return (
                    <ParentView
                        groupId={activeGroupId} 
                        userInfo={userInfo}
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
            case 'message-parents':
                return <MessageParentsPage groupId={activeGroupId} />;
            case 'add-youth':
                return <YouthView groupId={userInfo.group_id} userInfo={userInfo} />;
            case 'user-management':
                return <UserManagementView activeGroupId={activeGroupId} userInfo={userInfo} />;
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
                return <PatrolManagementView groupId={activeGroupId} userInfo={userInfo} />;
            case 'inspection':
                return <InspectionPage groupId={activeGroupId} userInfo={userInfo} />;
            case 'logout':
                return handleLogout();
            case 'notices':
                return <AdminNoticeForm groupId={activeGroupId} userInfo={userInfo} />;
            case 'parent-header-links':
                return <ParentHeaderLinks groupId={activeGroupId} />;
            case 'report-transitions':  
                return <ReportTransitionHistory groupId={userInfo.group_id} userInfo={userInfo} />;
            case 'report-data-quality':
				return <ReportDataQuality groupId={userInfo.group_id} userInfo={userInfo} />;
            default:
                if (userInfo?.role === 'Super Admin') {
                    return <SuperAdminDashboard key={`${actingAsAdmin}-${activeGroupId}`} />;
                }
                if (userInfo?.role === 'Group Leader') return <AdminDashboard userInfo={userInfo} />;
				if (userInfo?.role === 'Section Leader') return <AdminDashboard userInfo={userInfo} />;
                if (userInfo?.role === 'Section User') return <UserDashboard userInfo={userInfo} />;
                return <p>Access denied</p>;
        }

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
					userInfo={userInfo}
                />
            )}

            <PageWrapper style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <AdminHeader
                    userInfo={userInfo}
                    groups={groups || []}
                    activeGroupId={activeGroupId}
                    setActiveGroupId={setActiveGroupId}
                    actingAsAdmin={actingAsAdmin}
                    setActingAsAdmin={setActingAsAdmin}
                    setActingAsGroupId={setActingAsGroupId}
                    handleLogout={handleLogout}
                />
                    

                <div style={{ display: 'flex', flex: 1 }}>
                    <Sidebar onNavigate={(path) => navigate(`/admin/${path}`)}
                        userInfo={userInfo}
                        actingAsGroupId={actingAsGroupId}
                        actingAsAdmin={actingAsAdmin} />

                    <Content style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', minHeight: 0 }}>

                        {renderContent()}
                    </Content>
                </div>

                <Footer />
            </PageWrapper>
        </RequireAuth>
    );
}
