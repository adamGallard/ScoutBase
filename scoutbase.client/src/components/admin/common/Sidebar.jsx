// src/components/admin/common/Sidebar.jsx
import { useState } from 'react';
import {
    FileText, UserPlus, Users, BarChart2, ChevronRight, ChevronDown, Mail,
    FolderKanban, Cake, Repeat, Download, User, MapPin, Menu, ArrowLeft,
    LogOut, Home, CalendarCheck, QrCode, Flag, BookOpenCheck, Shield,
    Megaphone, FolderSymlink, FileCheck2, CalendarClock, MessageCircle,
    MessageSquare, Settings, BookOpen, Tent, Award
} from 'lucide-react';

import { can } from '@/utils/roleUtils';

const btnStyle = {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    padding: '0.75rem 1rem',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#333',
    transition: 'background 0.2s',
};

export default function Sidebar({ onNavigate, userInfo, actingAsGroupId, actingAsAdmin }) {
    const [collapsed, setCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState(new Set());

    const allow = perm => can(userInfo?.role, perm, { actingAsGroupId, actingAsAdmin });

    const toggleSection = key =>
        setExpandedSections(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });

    /** ------------ NAV DEFINITIONS ------------ **/
    const navItems = [
        { key: 'admindashboard', label: 'Home', icon: <Home size={16} /> },

        /* 👥  People  (parents, youth, patrols) */
        (allow('parentCRUD') || allow('youthCRUD') || allow('patrolCRUD')) && {
            key: 'people',
            label: 'People',
            icon: <Users size={16} />,
            expandable: true,
            children: [
                allow('parentCRUD') && { key: 'add-parent', label: 'Parents', icon: <UserPlus size={16} /> },
                allow('youthCRUD') && { key: 'add-youth', label: 'Youth', icon: <Users size={16} /> },
                allow('patrolCRUD') && { key: 'patrol-management', label: 'Patrols', icon: <Flag size={16} /> },
            ].filter(Boolean),
        },

        /* 📊  Reports */
        (allow('reportAttendanceDaily') || allow('reportYouthBySection')) && {
            key: 'reports',
            label: 'Reports',
            icon: <BarChart2 size={16} />,
            expandable: true,
            children: [
                allow('reportAttendanceDaily') && { key: 'report-attendance', label: 'Attendance', icon: <CalendarCheck size={16} /> },
                allow('reportAttendancePeriod') && { key: 'report-attendance-period', label: 'Attendance Period', icon: <CalendarClock size={16} /> },
                allow('inspection') && { key: 'inspection', label: 'Inspections', icon: <BookOpenCheck size={16} /> },
                allow('badgeOrder') && { key: 'badge-order', label: 'Badge Order', icon: <Award size={16} /> }, 
                allow('reportParentEmails') && { key: 'report-parent-emails', label: 'Parent Emails', icon: <Mail size={16} /> },
                allow('reportYouthBySection') && { key: 'report-youth-by-section', label: 'Youth by Section', icon: <FolderKanban size={16} /> },
                allow('reportAge') && { key: 'report-age', label: 'Age Report', icon: <Cake size={16} /> },
                allow('reportLinkingHistory') && { key: 'report-transitions', label: 'Linking History', icon: <Repeat size={16} /> },
                allow('reportFullExport') && { key: 'report-full-export', label: 'Full Export', icon: <Download size={16} /> },
                allow('reportDataQuality') && { key: 'report-data-quality', label: 'Data Quality', icon: <FileCheck2 size={16} /> },
            ].filter(Boolean),
        },

        /* 💬  Messaging */
        (allow('noticeCRUD') || allow('smsSend') || allow('emailSend')) && {
            key: 'messages-group',
            label: 'Messages',
            icon: <MessageSquare size={16} />,
            expandable: true,
            children: [
                allow('noticeCRUD') && { key: 'notices', label: 'Notices', icon: <Megaphone size={16} /> },
                allow('smsSend') && { key: 'message-sms', label: 'SMS', icon: <MessageCircle size={16} /> },
                allow('emailSend') && { key: 'message-email', label: 'Email', icon: <Mail size={16} /> },
            ].filter(Boolean),
        },

        /* 📚  Resources */
        {
            key: 'Ref-group',
            label: 'Reference',
            icon: <BookOpen size={16} />,
            expandable: true,
            children: [
                allow('qrCheckin') && { key: 'qr-code', label: 'QR Code', icon: <QrCode size={16} /> },
                allow('oasCRUD') && { key: 'oas-ref', label: 'OAS', icon: <Tent size={16} /> },
            ].filter(Boolean),
        },
        /* 🔐  Admin Tools */
        {
            key: 'admin',
            label: 'Admin Tools',
            icon: <Shield size={16} />,
            expandable: true,
            children: [
                /* Users / Settings (GL + up) */
                allow('userAdmin') && { key: 'user-management', label: 'Users', icon: <User size={16} /> },
                allow('settings') && { key: 'settings', label: 'Group Settings', icon: <Settings size={16} /> },

                /* Parent Links editable if group settings perm */
                allow('settings') && { key: 'parent-header-links', label: 'Parent Links', icon: <FolderSymlink size={16} /> },

                /* Governance (Super Admin only) */
                allow('groupAdmin') && { key: 'group-management', label: 'Groups', icon: <MapPin size={16} /> },
                allow('auditLog') && { key: 'audit-log', label: 'Audit Log', icon: <FileText size={16} /> },
            ].filter(Boolean),
        },

        { key: 'logout', label: 'Logout', icon: <LogOut size={16} /> },
    ].filter(Boolean);

    /** ------------ RENDER ------------ **/
    return (
        <div
            style={{
                width: collapsed ? '60px' : '200px',
                transition: 'width 0.3s ease',
                backgroundColor: '#f5f5f5',
                padding: '1rem 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: collapsed ? 'center' : 'flex-start',
                borderRight: '1px solid #ddd',
            }}
        >
            <button onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar" style={btnStyle}>
                {collapsed ? <Menu size={16} /> : <ArrowLeft size={16} />}
            </button>

            <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                {navItems.map(item => (
                    <li key={item.key} style={{ width: '100%' }}>
                        <button
                            onClick={() => {
                                if (item.expandable) toggleSection(item.key);
                                else onNavigate(item.key);
                            }}
                            style={btnStyle}
                        >
                            <span>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && item.expandable && (
                                expandedSections.has(item.key)
                                    ? <ChevronDown size={16} />
                                    : <ChevronRight size={16} />
                            )}
                        </button>

                        {/* Child list */}
                        {!collapsed && item.expandable && expandedSections.has(item.key) && (
                            <ul style={{ listStyle: 'none', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                {item.children.map(child => (
                                    <li key={child.key}>
                                        <button onClick={() => onNavigate(child.key)} style={btnStyle}>
                                            <span>{child.icon}</span>
                                            {!collapsed && <span>{child.label}</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
