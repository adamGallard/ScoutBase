// src/utils/roleUtils.js

const rolePermissions = {
    admin: ['viewYouthParentTabs', 'viewReports', 'accessAttendance'],
    user: ['viewReports'],
    superadmin: ['manageGroupsAndUsers', 'setupSystem'],
};

export const can = (role, permission, options) => {
    const { actingAsGroupId, actingAsAdmin } = options ?? {};

    if (rolePermissions[role]?.includes(permission)) return true;

    if (
        role === 'superadmin' &&
        actingAsGroupId &&
        actingAsAdmin &&
        ['viewYouthParentTabs', 'accessAttendance','viewReports'].includes(permission)
    ) {
        return true;
    }

    return false;
};