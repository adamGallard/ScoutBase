// src/components/common/FooterNav.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Bell, MessageCircle, Calendar, Link as LinkIcon, UserCircle, UserCheck } from 'lucide-react';
import { useNotificationContext } from '@/helpers/NotificationContext';
import './FooterNav.css';

export default function FooterNav() {
    const { unreadCount } = useNotificationContext();
    const location = useLocation();
    const search = location.search;    // preserve ?group=…
    const items = [
        { to: `/parent/signin${search}`, Icon: UserCheck, label: 'Sign In/Out' },
        { to: `/parent/notifications${search}`, Icon: Bell, label: 'Notices', badge: unreadCount },
        { to: `/parent/calendar${search}`, Icon: Calendar, label: 'Calendar' },
        { to: `/parent/links${search}`, Icon: LinkIcon, label: 'Links' },
        { to: `/parent/profile${search}`, Icon: UserCircle, label: 'Profile' },
    ];

    return (
        <footer className="footer-nav">
            {items.map(({ to, Icon, label, badge }) => (
                <NavLink
                    key={to}
                    to={to}
                    state={location.state}          // if you’re using location.state for auth
                    className={({ isActive }) =>
                        `footer-nav-link${isActive ? ' active' : ''}`
                    }
                    end={to === `/parent${location.pathname}`}
                    aria-label={label}
                >
                    {({ isActive }) => (
                        <div className="footer-nav-item">
                            <div className="icon-wrapper">
                                <Icon size={isActive ? 32 : 24} />
                                {badge > 0 && <span className="footer-nav-badge">{badge}</span>}
                            </div>
                            <span className="footer-nav-label">{label}</span>
                        </div>
                    )}
                </NavLink>
            ))}
        </footer>
    );
}
