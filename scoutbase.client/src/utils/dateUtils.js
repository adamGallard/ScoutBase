// utils/dateAndAge.ts

import {
    stages,
    sections,
    stageMap,
    sectionMap
} from "@/components/common/Lookups";

const thresholdMap = sections.reduce((map, sec) => {
    map[sec.code] = sec.threshold;
    return map;
}, {});

export const getTodayDate = () =>
    new Date().toISOString().split('T')[0];

export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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

    return `${years} year${years !== 1 ? 's' : ''} ` +
        `${months} month${months !== 1 ? 's' : ''}`;
}

export function getLinkingThreshold(sectionCode) {
    return thresholdMap[sectionCode] || null;
}

export function getLinkingStatus(dob, sectionCode, membershipStage) {
    const limit = thresholdMap[sectionCode];
    if (limit == null) return '';

    const birth = new Date(dob);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let monthDiff = now.getMonth() - birth.getMonth();
    let dayDiff = now.getDate() - birth.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        years--;
    }

    if (years >= limit && membershipStage === 'invested') {
        return 'Overdue';
    }
    if (years === limit - 1) {
        return 'Approaching';
    }
    return '';
}