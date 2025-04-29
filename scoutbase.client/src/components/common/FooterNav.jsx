// src/components/common/FooterNav.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Bell, MessageCircle, Calendar, Link as LinkIcon } from 'lucide-react';
import './FooterNav.css';

export default function FooterNav({ noticeCount = 0, messageCount = 0 }) {
    const location = useLocation();
    const search = location.search;    // preserve ?group=…
    const items = [
        { to: `/parent/signin${search}`, Icon: Home, label: 'Home' },
        { to: `/parent/notifications${search}`, Icon: Bell, label: 'Notices', badge: noticeCount },
      //  { to: `/parent/messages${search}`, Icon: MessageCircle, label: 'Messages', badge: messageCount },
        { to: `/parent/calendar${search}`, Icon: Calendar, label: 'Calendar' },
        { to: `/parent/links${search}`, Icon: LinkIcon, label: 'Links' },
    ];

    return (
        <footer className="footer-nav">
            {items.map(({ to, Icon, label, badge }) => (
                <NavLink
                    key={to}
                    to={to}
                    state={location.state}          // if you’re using location.state for auth
                    className="footer-nav-link"
                    end={to === `/parent${location.pathname}`}
                    aria-label={label}
                >
                    <div className="icon-wrapper">
                        <Icon size={24} />
                        {badge > 0 && <span className="footer-nav-badge">{badge}</span>}
                    </div>
                </NavLink>
            ))}
        </footer>
    );
}
