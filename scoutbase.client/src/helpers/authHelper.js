// src/helpers/authHelper.js

const SESSION_KEY = 'parentSession';

/**
 * Calls your backend API to verify a parent and PIN, returning a group-scoped JWT and parent info.
 * @param {string} identifier - Name or phone (as entered by user)
 * @param {string} enteredPin - The PIN entered by the parent
 * @param {string} groupId    - The group id (from group slug, etc)
 * @returns {Object} { success, token, parent, error }
 */
export const verifyParentByIdentifierAndPin = async (identifier, enteredPin, groupId) => {
    try {
        const res = await fetch('/api/loginParent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, enteredPin, groupId }),
        });
        const data = await res.json();

        if (!res.ok || !data.token || !data.parent) {
            return { success: false, error: data.error || 'Invalid name or PIN' };
        }

        return { success: true, token: data.token, parent: data.parent };
    } catch (err) {
        console.error('Parent login API error:', err);
        return { success: false, error: 'Network or server error. Please try again.' };
    }
};

/**
 * Stores parent session (token, parent object, groupId) as a single object.
 */
export function setParentSession(token, parent, groupId) {
    if (!token || !parent || !groupId) return;
    const session = { token, parent, groupId };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Returns { token, parent, groupId } if set, else {}.
 */
export function getParentSession() {
    try {
        const sessionRaw = sessionStorage.getItem(SESSION_KEY);
        if (!sessionRaw) return {};
        const session = JSON.parse(sessionRaw);
        if (!session.token || !session.parent || !session.groupId) return {};
        return session;
    } catch {
        return {};
    }
}

/**
 * Removes parent session (on logout).
 */
export function clearParentSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('parent_token');
    localStorage.removeItem('parent_info');
    localStorage.removeItem('parent_group');
}

/**
 * Checks if the current session JWT is valid (not expired).
 */
export function isParentTokenValid() {
    const { token } = getParentSession();
    if (!token) return false;
    try {
        const [, payload] = token.split('.');
        if (!payload) return false;
        const decoded = JSON.parse(atob(payload));
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp > now;
    } catch {
        return false;
    }
}
