import { useState } from 'react';
import {
    FileText,
    UserPlus,
    Users,
    Link2,
    BarChart2,
    Menu,
    ArrowLeft,
    LogOut,
    User,
    MapPin,
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

export default function Sidebar({ onNavigate, userInfo }) {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { key: 'attendance', label: 'Attendance', icon: <FileText size={16} /> },
        { key: 'add-parent', label: 'Parent', icon: <UserPlus size={16} /> },
        { key: 'add-youth', label: 'Youth', icon: <Users size={16} /> },
        { key: 'link', label: 'Link Parent/Youth', icon: <Link2 size={16} /> },
        { key: 'reports', label: 'Reports', icon: <BarChart2 size={16} /> },
    ];

    if (userInfo?.role === 'superadmin') {
        navItems.push({ key: 'user-management', label: 'Users', icon: <User size={16} /> });
        navItems.push({ key: 'group-management', label: 'Groups', icon: <MapPin size={16} /> });
    }

    const handleLogout = () => {
        localStorage.removeItem('scoutbase-admin-authed');
        localStorage.removeItem('scoutbase-terrain-idtoken');
        localStorage.removeItem('scoutbase-terrain-token');
        localStorage.removeItem('scoutbase-role');
        localStorage.removeItem('scoutbase-group-id');
        localStorage.removeItem('scoutbase-client-id');
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
                        <button onClick={() => onNavigate(item.key)} style={btnStyle}>
                            <span>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    </li>
                ))}

                <li style={{ marginTop: 'auto', width: '100%' }}>
                    <button onClick={handleLogout} style={{ ...btnStyle, color: '#b00' }}>
                        {!collapsed ? (
                            <>
                                <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                            </>
                        ) : (
                            <LogOut size={16} />
                        )}
                    </button>
                </li>
            </ul>
        </div>
    );
}
