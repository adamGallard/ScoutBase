import { useState } from 'react';
import {
    FileText, UserPlus, Users, BarChart2, ChevronRight, ChevronDown, Mail,
    FolderKanban, Cake, Repeat, Download, User, MapPin, Menu, ArrowLeft,
    LogOut, Home, CalendarCheck, QrCode, Flag, BookOpenCheck, Shield, Megaphone,
    FolderSymlink, FileCheck2, CalendarClock, MessageCircle, MessageSquare
} from 'lucide-react';

import { can } from "@/utils/roleUtils";

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
    const [reportsExpanded, setReportsExpanded] = useState(false);
    const [expandedSections, setExpandedSections] = useState(new Set());

    const toggleSection = (key) => {
        setExpandedSections(prev => {
            const updated = new Set(prev);
            updated.has(key) ? updated.delete(key) : updated.add(key);
            return updated;
        });
    };

    const navItems = [
        { key: 'admindashboard', label: 'Home', icon: <Home size={16} /> },

        // 👥 People
        can(userInfo?.role, 'viewYouthParentTabs', { actingAsGroupId, actingAsAdmin }) && {
            key: 'people',
            label: 'People',
            icon: <Users size={16} />,
            expandable: true,
            children: [
                { key: 'add-parent', label: 'Parents', icon: <UserPlus size={16} /> },
                { key: 'add-youth', label: 'Youth', icon: <Users size={16} /> },
                { key: 'patrol-management', label: 'Patrols', icon: <Flag size={16} /> }
            ]
        },

        // 📊 Reports
        can(userInfo?.role, 'viewReports', { actingAsGroupId, actingAsAdmin }) && {
            key: 'reports',
            label: 'Reports',
            icon: <BarChart2 size={16} />,
            expandable: true,
            children: [
                { key: 'report-attendance', label: 'Attendance', icon: <CalendarCheck size={16} /> },
				{ key: 'report-attendance-period', label: 'Attendance Period', icon: <CalendarClock size={16} /> },
                { key: 'inspection', label: 'Inspections', icon: <BookOpenCheck size={16} /> },
                { key: 'report-parent-engagement', label: 'Parent Engagement', icon: <Users size={16} /> },
                { key: 'report-parent-emails', label: 'Parent Emails', icon: <Mail size={16} /> },
                { key: 'report-youth-by-section', label: 'Youth by Section', icon: <FolderKanban size={16} /> },
                { key: 'report-age', label: 'Age Report', icon: <Cake size={16} /> },
                { key: 'report-transitions', label: 'Linking History', icon: <Repeat size={16} /> },
                { key: 'report-full-export', label: 'Full Export', icon: <Download size={16} /> },
                { key: 'report-data-quality', label: 'Data Quality', icon: <FileCheck2 size={16} /> }
            ]
        },

        // Messaging
        can(userInfo?.role, 'viewReports', { actingAsGroupId, actingAsAdmin }) && {
            key: 'Messages-group',
            label: 'Messages',
            icon: <MessageSquare size={16} />,
            expandable: true,
            children: [
                { key: 'notices', label: 'Notices', icon: <Megaphone size={16} /> },
                { key: 'message-sms', label: 'SMS', icon: <MessageCircle size={16} /> },
                { key: 'message-email', label: 'Email', icon: <Mail size={16} /> }
            ]
        },
                

        can(userInfo?.role, 'viewReports', { actingAsGroupId, actingAsAdmin }) && {
            key: 'qr-code',
            label: 'QR Code',
            icon: <QrCode size={16} />
        },


        // 🔐 Admin Tools
        {
            key: 'admin',
            label: 'Admin Tools',
            icon: <Shield size={16} />,
            expandable: true,
            children: [
                // 👤 All roles that can manage users (Group Leaders and up)
                can(userInfo?.role, 'manageUsers', { actingAsGroupId, actingAsAdmin }) && {
                    key: 'user-management',
                    label: 'Users',
                    icon: <User size={16} />
                },
                can(userInfo?.role, 'manageGroupsAndUsers', { actingAsGroupId, actingAsAdmin }) && {
                    key: 'parent-header-links',
                    label: 'Parent Header',
                    icon: <FolderSymlink size={16} />
                },


                // 🗺 Only roles with full access (Super Admin)
                can(userInfo?.role, 'manageGroupsAndUsers', { actingAsGroupId, actingAsAdmin }) && {
                    key: 'group-management',
                    label: 'Groups',
                    icon: <MapPin size={16} />
                },
                can(userInfo?.role, 'manageGroupsAndUsers', { actingAsGroupId, actingAsAdmin }) && {
                    key: 'audit-log',
                    label: 'Audit Log',
                    icon: <FileText size={16} />
                }
            ].filter(Boolean) // 🧼 removes any false/null values
        },

        { key: 'logout', label: 'Logout', icon: <LogOut size={16} /> }
    ].filter(Boolean);
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
                {navItems.map((item) => (
                    <li key={item.key} style={{ width: '100%' }}>
                        <button
                            onClick={() => {
                                if (item.expandable) {
                                    toggleSection(item.key);
                                } else {
                                    onNavigate(item.key);
                                }
                            }}
                            style={btnStyle}
                        >
                            <span>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && item.expandable && (
                                expandedSections.has(item.key) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                            )}
                        </button>

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

