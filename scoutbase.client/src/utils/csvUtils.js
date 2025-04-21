export const exportToCSV = (data, filename = 'export') => {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
