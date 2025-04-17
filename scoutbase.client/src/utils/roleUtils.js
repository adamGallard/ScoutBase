// src/utils/roleUtils.js
export const roles = ['Super Admin', 'Group Leader', 'Section Leader', 'Section User'];

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

export const canEditUser = (currentUser, targetUser) => {
    if (currentUser.role === 'Super Admin') return true;
    if (currentUser.role === 'Group Leader') return targetUser.role !== 'Super Admin';
    if (currentUser.role === 'Section Leader') {
        return targetUser.role === 'Section Leader' && targetUser.section === currentUser.section;
    }
    return false;
};

export const canDeleteUser = (currentUser, targetUser) => {
    if (targetUser.role === 'Super Admin') return false;
    if (currentUser.role === 'Super Admin') return true;
    if (currentUser.role === 'Group Leader') return targetUser.role !== 'Group Leader' && targetUser.role !== 'Super Admin';
    return false;
};

export const getAssignableRoles = (currentUser) => {
    if (currentUser.role === 'Super Admin') return roles;
    if (currentUser.role === 'Group Leader') return roles.filter(r => r !== 'Super Admin');
    if (currentUser.role === 'Section Leader') return ['Section Leader', 'Section User'];
    return [];
};