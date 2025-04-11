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