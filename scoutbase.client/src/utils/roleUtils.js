// src/utils/roleUtils.js

// Define roles and their allowed features
const rolePermissions = {
    admin: [
        'viewYouthParentTabs',
        'viewReports',
        'accessAttendance',
    ],
    reports_user: [
        'viewReports',
    ],
    superadmin: [
        'manageGroupsAndUsers',
        'setupSystem',
    ]
};

// Generic checker
export const can = (role, permission) => {
    return rolePermissions[role]?.includes(permission) ?? false;
};