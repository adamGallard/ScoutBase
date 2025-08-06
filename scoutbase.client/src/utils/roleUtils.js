// src/utils/roleUtils.js
/* ────────────────────────────────────────────────────────── */
/* 1. Role list                                              */
/* ────────────────────────────────────────────────────────── */
export const roles = [
    'Super Admin',
    'Group Leader',
    'Section Leader',
    'Section User',
];

/* ────────────────────────────────────────────────────────── */
/* 2. Permission keys per role                               */
/*    (Super Admin gets ops via “Act as” toggle.)            */
/* ────────────────────────────────────────────────────────── */
const rolePermissions = {
    /* governance only */
    'Super Admin': ['groupAdmin', 'userAdmin', 'auditLog', 'groupRoles'],

    /* group level */
    'Group Leader': [
        'dashboard',
        'attendanceEdit',
        'reportAttendancePeriod',
        'reportAttendanceDaily',
        'youthCRUD',
        'parentCRUD',
        'parentLinks',
        'qrCheckin',
		'oasCRUD', 
        'patrolCRUD',
        'inspection',
        'noticeCRUD',
        'emailSend',
        'smsSend',
        'reportParentEmails',
        'reportYouthBySection',
        'reportAge',
        'reportLinkingHistory',
        'reportFullExport',
        'reportDataQuality',
        'settings',
        'userAdmin',
        'auditLog',
        'badgeOrder',
        'reportYouthProjection',
        'reportAttendanceAdult',
        'groupRoles',
       'reportParentYouthLinks'
    ],

    /* section level */
    'Section Leader': [
        'dashboard',
        'attendanceEdit',
        'youthCRUD',
        'parentCRUD',
        'parentLinks',
        'qrCheckin',
        'patrolCRUD',
        'inspection',
        'noticeCRUD',
        'emailSend',
        'smsSend',
        'reportParentEmails',
        'reportYouthBySection',
        'reportAge',
        'reportLinkingHistory',
        'reportDataQuality',
        'reportAttendanceDaily',
        'badgeOrder',
        'oasCRUD', 
        'reportAttendancePeriod',
        'reportAttendanceAdult',
        'reportParentYouthLinks'
    ],

    /* view‑only */
    'Section User': [
        'dashboard',
        'qrCheckin',
        'reportYouthBySection',
        'reportParentYouthLinks'
    ],
};

/* ────────────────────────────────────────────────────────── */
/* 3. Generic “can” helper                                    */
/* ────────────────────────────────────────────────────────── */
export const hasSectionAccess = userInfo =>
    ['Section Leader', 'Section User'].includes(userInfo.role);

export const can = (
    role,
    permission,
    { actingAsGroupId, actingAsAdmin, userSection, targetSection } = {}
) => {
    /* 3‑a native */
    const allowed = rolePermissions[role]?.includes(permission) || false;

    /* 3‑b Section Leader limited to own section */
    if (
        role === 'Section Leader' &&
        allowed &&
        ![
            'reportParentEmails',
            'reportYouthBySection',
            'reportAge',
            'reportLinkingHistory',
            'reportDataQuality',
            'reportAttendanceDaily',
        ].includes(permission)
    ) {
        return !targetSection || userSection === targetSection;
    }

    /* 3‑c Super Admin acting as Group Leader */
    if (
        role === 'Super Admin' &&
        actingAsGroupId &&
        actingAsAdmin &&
        rolePermissions['Group Leader'].includes(permission)
    ) {
        return true;
    }

    return allowed;
};

/* ────────────────────────────────────────────────────────── */
/* 4. Hierarchy helpers                                       */
/* ────────────────────────────────────────────────────────── */
const roleOrder = [
    'Section User',
    'Section Leader',
    'Group Leader',
    'Super Admin',
];

const higherThan = (a, b) => roleOrder.indexOf(a) > roleOrder.indexOf(b);

/* ────────────────────────────────────────────────────────── */
/* 5. CRUD helpers for user admin                             */
/* ────────────────────────────────────────────────────────── */
export const canEditUser = (currentUser, targetUser) =>
    higherThan(currentUser.role, targetUser.role);

export const canDeleteUser = (currentUser, targetUser) =>
    higherThan(currentUser.role, targetUser.role);

export const getAssignableRoles = currentUser => {
    const currentIdx = roleOrder.indexOf(currentUser.role);
    return roles.filter(r => roleOrder.indexOf(r) < currentIdx);
};

/* ────────────────────────────────────────────────────────── */
/* 6. Misc                                                    */
/* ────────────────────────────────────────────────────────── */
export const normalizeRole = role =>
    role ? role.toLowerCase().replace(/\s+/g, '_') : '';

export const canViewSection = (userInfo, section) => {
    if (['Super Admin', 'Group Leader'].includes(userInfo.role)) return true;
    if (['Section Leader', 'Section User'].includes(userInfo.role))
        return section === userInfo.section;
    return false;
};
