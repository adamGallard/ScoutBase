import { useState } from 'react';
import {
    FileText,
    UserPlus,
    Users,
    BarChart2,
    ChevronRight,
    ChevronDown,
    Mail,
    FolderKanban,
    Cake,
    Repeat,
    Download,
    User,
    MapPin,
    Menu,
    ArrowLeft,
    LogOut,
    Home
} from 'lucide-react';

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

import {
    can
} from "@/utils/roleUtils";
import { signout } from '../../helpers/supabaseHelpers';

export default function Sidebar({ onNavigate, userInfo }) {
    const [collapsed, setCollapsed] = useState(false);
    const [reportsExpanded, setReportsExpanded] = useState(false);
    const navItems = [
        { key: 'admindashboard', label: 'Home', icon: <Home size={16} /> },
    ];

    if (can(userInfo?.role, 'viewYouthParentTabs')) {
        navItems.push(
            { key: 'attendance', label: 'Attendance', icon: <FileText size={16} /> },
            { key: 'add-parent', label: 'Parent', icon: <UserPlus size={16} /> },
            { key: 'add-youth', label: 'Youth', icon: <Users size={16} /> }
        );
    }

    if (can(userInfo?.role, 'viewReports')) {
        navItems.push({
            key: 'reports',
            label: 'Reports',
            icon: <BarChart2 size={16} />,
            expandable: true,
            children: [
                { key: 'report-parent-emails', label: 'Parent Emails', icon: <Mail size={16} /> },
                { key: 'report-youth-by-section', label: 'Youth by Section', icon: <FolderKanban size={16} /> },
                { key: 'report-age', label: 'Age Report', icon: <Cake size={16} /> },
                { key: 'report-transitions', label: 'Transition History', icon: <Repeat size={16} /> },
                { key: 'report-parent-engagement', label: 'Parent Engagement', icon: <Users size={16} /> },
                { key: 'report-full-export', label: 'Full Youth Export', icon: <Download size={16} /> }
            ]
        });
    }

    if (can(userInfo?.role, 'manageGroupsAndUsers')) {
        navItems.push(
            { key: 'user-management', label: 'Users', icon: <User size={16} /> },
            { key: 'group-management', label: 'Groups', icon: <MapPin size={16} /> }
        );
    };
    navItems.push({
        key: 'logout',
        label: 'Logout',
        icon: <LogOut size={16} />,
        onClick: async () => {
            handleLogout;
        }
    });

    const handleLogout = () => {
    signout 
    localStorage.clear();
    window.location.href = '/admin-login';
};

    return (
        <div
            style={{
                width: collapsed ? '60px' : '200px',
                transition: 'width 0.3s ease',
                backgroundColor: '#f5f5f5',
                height: '100vh',
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
                                    setReportsExpanded(!reportsExpanded);
                                    onNavigate(item.key); // also go to /reports
                                } else {
                                    onNavigate(item.key);
                                }
                            }}
                            style={btnStyle}
                        >
                            <span>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && item.expandable && (
                                reportsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                            )}
                        </button>

                        {/* Render children if expandable and expanded */}
                        {!collapsed && item.expandable && reportsExpanded && (
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
