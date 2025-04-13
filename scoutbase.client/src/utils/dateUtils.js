export const getTodayDate = () => new Date().toISOString().split('T')[0];
export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

export function getAgeWithMonths(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
}

export function getLinkingThreshold(section) {
    const thresholds = {
        Joeys: 8,
        Cubs: 11,
        Scouts: 15,
        Venturers: 18
    };
    return thresholds[section] || null;
}

export function getLinkingStatus(dob, section) {
    const sectionThresholds = {
        Joeys: 8,
        Cubs: 11,
        Scouts: 15,
        Venturers: 18
    };

    const birthday = new Date(dob);
    const now = new Date();

    const age = now.getFullYear() - birthday.getFullYear();
    const monthDiff = now.getMonth() - birthday.getMonth();
    const dayDiff = now.getDate() - birthday.getDate();
    const preciseAge = age + (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? -1 : 0);

    const limit = sectionThresholds[section];
    if (!limit) return '';

    let status = '';
    if (preciseAge === limit - 1) {
        status = 'Approaching';
    } else if (preciseAge >= limit) {
        status = 'Overdue';
    }

    return status;
}