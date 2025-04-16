// src/utils/roleUtils.js

const rolePermissions = {
    'Super Admin': ['manageGroupsAndUsers', 'setupSystem', 'manageUsers'],
    'Group Leader': ['viewYouthParentTabs', 'viewReports', 'accessAttendance', 'manageUsers'],
    'Section Leader': ['viewYouthParentTabs', 'viewReports', 'accessAttendance'],
    'Section User': ['viewReports']
};

export const can = (role, permission, options = {}) => {
    const { actingAsGroupId, actingAsAdmin, userSection, targetSection } = options;

    const permissions = rolePermissions[role] || [];
    const hasPermission = permissions.includes(permission);

    // Section Leader restriction to their section
    if (role === 'Section Leader' && hasPermission && permission !== 'viewReports') {
        if (!targetSection || userSection === targetSection) {
            return true;
        }
        return false;
    }

    // Allow SuperAdmin to act as admin if toggled
    if (
        role === 'Super Admin' &&
        actingAsGroupId &&
        actingAsAdmin &&
        ['viewYouthParentTabs', 'accessAttendance', 'viewReports'].includes(permission)
    ) {
        return true;
    }

    return hasPermission;
};
export const normalizeRole = (role) => {
    if (!role) return '';
    return role.toLowerCase().replace(/\s+/g, '_'); // "Super Admin" -> "super_admin"
};