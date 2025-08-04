// ✅ React & React Router
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ✅ Supabase & Custom Hooks
import { supabase } from '@/lib/supabaseClient';
import { useTerrainUser } from '@/hooks/useTerrainUser';
import { checkTokenValidity } from '@/helpers/authHelper';

// ✅ Security & Role Management
import { can } from '@/utils/roleUtils';               // ⬅️  new import
import { useActingGroup } from '@/hooks/useActingGroup';


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
import AdminNoticeForm from '@/components/admin/messages/AdminNoticeForm'; 
import ParentHeaderLinks from '@/components/admin/ParentHeaderLinks';
import MessageSMSPage from '@/components/admin/messages/MessageSMSPage';
import MessageEmailPage from '@/components/admin/messages/MessageEmailPage';
import SettingsPage from '@/components/admin/SettingsPage';
import BadgeOrder from '@/components/admin/BadgeOrder';
import RegistrationsPage from '@/components/admin/RegistrationsPage';
import Members from '@/components/admin/Members';
import Messages from '@/components/admin/Messages';
import Reference from '@/components/admin/Reference';

// ✅ Report Views
import ReportParentEmails from '@/components/admin/reports/ReportParentEmails';
import ReportYouthBySection from '@/components/admin/reports/ReportYouthBySection';
import ReportAge from '@/components/admin/reports/ReportAge';
import ReportAttendanceView from '@/components/admin/reports/ReportAttendanceView';
import ReportAttendanceAdult from '@/components/admin/reports/ReportLeaderAttendance';
import InspectionPage from '@/components/admin/inspections/InspectionPage';
import GroupQRCode from '@/components/admin/GroupQRCode';
import ReportTransitionHistory from '@/components/admin/reports/ReportTransitionHistory';
import ReportDataQuality from '@/components/admin/reports/ReportDataQuality';
import ReportAttendancePeriod from '@/components/admin/reports/ReportAttendancePeriod';
import ReportOAS from '../components/admin/reports/RefOAS';
import BadgeOrderView from '../components/admin/BadgeOrder';
import ReportYouthProjection from '../components/admin/reports/ReportYouthProjection';
import AdminTools from '../components/admin/AdminTools';
import GroupRoles from '../components/admin/GroupRoles';


// ───────────────────────────────────────────────────────────
// 1. ONE registry of pages → permission keys
//    Add rows here instead of inside the switch‑case.
// ───────────────────────────────────────────────────────────
const PAGE_DEFINITIONS = {
    'report-attendance': {
        component: ReportAttendanceView,
        permission: 'reportAttendanceDaily',   // add to roleUtils
        passProps: (ctx) => ({
            activeGroupId: ctx.activeGroupId,
            selectedDate: ctx.selectedDate,
            sectionFilter: ctx.sectionFilter,
            onDateChange: ctx.setSelectedDate,
            onSectionChange: ctx.setSectionFilter,
            userInfo: ctx.userInfo,
        }),
    },
    'report-attendance-adult': {
        component: ReportAttendanceAdult,
        permission: 'reportAttendanceAdult',   // add to roleUtils
        passProps: (ctx) => ({
            activeGroupId: ctx.activeGroupId,
            selectedDate: ctx.selectedDate,
            sectionFilter: ctx.sectionFilter,
            onDateChange: ctx.setSelectedDate,
            onSectionChange: ctx.setSectionFilter,
            userInfo: ctx.userInfo,
        }),
    },


    'report-attendance-period': {
        component: ReportAttendancePeriod,
        permission: 'reportAttendancePeriod',  // add to roleUtils
        passProps: (ctx) => ({
            groupId: ctx.activeGroupId,
            userInfo: ctx.userInfo,
        }),
    },
    'add-parent': {
        component: ParentView,
        permission: 'parentCRUD',
        passProps: (ctx) => ({
            groupId: ctx.activeGroupId,
            userInfo: ctx.userInfo,
            onOpenPinModal: ctx.openPinModal,
            onOpenLinkModal: ctx.openLinkModal,
        }),
    },
    'registrations': {
        component: RegistrationsPage,
        permission: 'parentCRUD', // or 'youthCRUD' if you want; or a custom permission!
        passProps: (ctx) => ({
            groupId: ctx.activeGroupId,
            userInfo: ctx.userInfo,
        }),
    },
    'message-sms': { component: MessageSMSPage, permission: 'smsSend', passProps: (c) => ({ groupId: c.activeGroupId }) },
    'message-email': { component: MessageEmailPage, permission: 'emailSend', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'add-youth': { component: YouthView, permission: 'youthCRUD', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'user-management': { component: UserManagementView, permission: 'userAdmin', passProps: (c) => ({ activeGroupId: c.activeGroupId, userInfo: c.userInfo }) },
    'group-management': { component: GroupManagementView, permission: 'groupAdmin' },
    'reports': { component: Reports, permission: 'reportParentEmails' /* just to gate the menu page */ },
	'people': { component: Members, permission: 'youthCRUD' },
    'report-parent-emails': { component: ReportParentEmails, permission: 'reportParentEmails', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'report-youth-by-section': { component: ReportYouthBySection, permission: 'reportYouthBySection', passProps: (c) => ({ groupId: c.userInfo.group_id }) },
    'report-age': { component: ReportAge, permission: 'reportAge', passProps: (c) => ({ groupId: c.userInfo.group_id }) },
    'audit-log': { component: AuditLogViewer, permission: 'auditLog', passProps: (c) => ({ activeGroupId: c.activeGroupId }) },
    'oas-ref': { component: ReportOAS, permission: 'oasCRUD', passProps: (c) => ({ groupId: c.userInfo.group_id }) }, 
    'qr-code': { component: GroupQRCode, permission: 'qrCheckin', passProps: (c) => ({ groupStub: c.group?.slug }) },
    'patrol-management': { component: PatrolManagementView, permission: 'patrolCRUD', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'inspection': { component: InspectionPage, permission: 'inspection', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'notices': { component: AdminNoticeForm, permission: 'noticeCRUD', passProps: (c) => ({ groupId: c.activeGroupId, userInfo: c.userInfo }) },
    'parent-header-links': { component: ParentHeaderLinks, permission: 'settings', passProps: (c) => ({ groupId: c.activeGroupId }) },
    'report-transitions': { component: ReportTransitionHistory, permission: 'reportLinkingHistory', passProps: (c) => ({ groupId: c.userInfo.group_id, userInfo: c.userInfo }) },
    'report-data-quality': { component: ReportDataQuality, permission: 'reportDataQuality', passProps: (c) => ({ groupId: c.userInfo.group_id, userInfo: c.userInfo }) },
    'settings': { component: SettingsPage, permission: 'settings', passProps: (c) => ({ groupId: c.userInfo.group_id }) },
    'badge-order': { component: BadgeOrder, permission: 'badgeOrder', passProps: (c) => ({ groupId: c.userInfo.group_id, userInfo: c.userInfo }) },
    'report-projections': { component: ReportYouthProjection, permission: 'reportLinkingHistory', passProps: (c) => ({ groupId: c.userInfo.group_id, userInfo: c.userInfo }) },
    'messages-group': { component: Messages, permission: 'smsSend' },
    'Ref-group': { component: Reference, permission: 'settings' },
    'admin': { component: AdminTools, permission: 'settings' },
    'group-roles': { component: GroupRoles, permission: 'groupRoles' },
    // add more pages here…
};

// ───────────────────────────────────────────────────────────
// 2. Helper that wraps roleUtils.can with acting‑as flags
// ───────────────────────────────────────────────────────────
const hasAccess = (user, perm, actingAsAdmin, actingAsGroupId, targetSection) =>
    can(user.role, perm, {
        actingAsAdmin,
        actingAsGroupId,
        userSection: user.section,
        targetSection,
    });

// ───────────────────────────────────────────────────────────

export default function AdminPage() {
    /* … all your existing state & hooks, unchanged … */
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

    // keep these callbacks so registry rows can reference them
    const openPinModal = (id) => {
        setPinParentId(id);
        setShowPinModal(true);
    };
    const openLinkModal = (id) => {
        setSelectedParentId(id);
        setLinkModalOpen(true);
    };

    /* ------------  renderContent now only ≈20 lines  ------------ */
    const renderContent = () => {
        if (userLoading || !userInfo) return <p>Loading user info…</p>;
        if (!activeGroupId) return <p>Loading group data…</p>;
        
        // 1. Dashboard fall‑throughs first
        if (!subPath || subPath === 'admindashboard') {
            if (userInfo.role === 'Super Admin')
                return <SuperAdminDashboard key={`${actingAsAdmin}-${activeGroupId}`} />;
            if (userInfo.role === 'Group Leader' || userInfo.role === 'Section Leader')
                return <AdminDashboard userInfo={userInfo} />;
            if (userInfo.role === 'Section User')
                return <UserDashboard userInfo={userInfo} />;
        }

        // 2. Look up route in registry
        const def = PAGE_DEFINITIONS[subPath];
        if (!def) return <p>Page not found</p>;

        // 3. Permission check
        const targetSection =
            ['youthCRUD', 'parentCRUD', 'parentLinks', 'patrolCRUD'].includes(def.permission)
                     ? sectionFilter || userInfo.section
                     : null;
        
             if (!hasAccess(userInfo, def.permission, actingAsAdmin, actingAsGroupId, targetSection))
            return <p>Access denied</p>;

        // 4. Render
        const Comp = def.component;
        const extra = def.passProps ? def.passProps({
            activeGroupId,
            selectedDate,
            sectionFilter,
            setSelectedDate,
            setSectionFilter,
            userInfo,
            openPinModal,
            openLinkModal,
            group,
        }) : {};
        return <Comp {...extra} />;
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
                    <Sidebar
                        onNavigate={(path) => navigate(`/admin/${path}`)}
                        userInfo={userInfo}
                        selectedKey={subPath || 'admindashboard'} 
                        actingAsGroupId={actingAsGroupId}
                        actingAsAdmin={actingAsAdmin}
                    />
                    <Content style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', minHeight: 0 }}>
                        {renderContent()}
                    </Content>
                </div>

                <Footer />
            </PageWrapper>
        </RequireAuth>
    );
}
