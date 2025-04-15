// src/components/admin/ImportYouthModal.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/SharedStyles';

export default function ImportYouthModal({ onClose, onImport }) {
    const [previewData, setPreviewData] = useState([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setFileName(file.name);
        setError(null);

        const isCSV = file.name.endsWith('.csv');
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            if (isCSV) {
                Papa.parse(content, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => processData(results.data),
                    error: (err) => setError(err.message),
                });
            } else {
                const workbook = XLSX.read(content, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const headers = raw[4];
                const rows = raw.slice(5); // from the row *after* headers

                const cleanedHeaders = headers.map((h) => h?.toString().trim());

                const json = rows.map((row) => {
                    const obj = {};
                    cleanedHeaders.forEach((key, i) => {
                        obj[key] = row[i];
                    });
                    return obj;
                });
                processData(json);
            }
        };

        if (isCSV) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    };

    const processData = (data) => {

        const getValue = (row, possibleKeys) => {
            for (const key of possibleKeys) {
                if (row[key] !== undefined) {
                    return row[key];
                }
            }
            return '';
        };
        const cleaned = data.map((row) => ({
            name: getValue(row, ['Cub', 'Name']),
            member_number: getValue(row, ['Membership #']),
            dob: getValue(row, ['DOB']),
            status: getValue(row, ['Membership Status']),
            joined_joeys: getValue(row, ['Date Joined Joeys']),
            joined_cubs: getValue(row, ['Date Joined Cubs']),
            joined_scouts: getValue(row, ['Date Joined Scouts']),
            joined_venturers: getValue(row, ['Date Joined Venturers']),
            joined_rovers: getValue(row, ['Date Joined Rovers']),
            resigned: getValue(row, ['Date Resigned']),
            parent1_name: getValue(row, ['Mother']),
            parent2_name: getValue(row, ['Father']),
            parent1_email: getValue(row, ['Email 1 (mother)']),
            parent2_email: getValue(row, ['Email 2 (father)']),
            parent1_phone: getValue(row, ['Mobile (Mother)']),
            parent2_phone: getValue(row, ['Mobile (Father)']),
        }));

               setPreviewData(cleaned);
    };

    const handleConfirmImport = () => {
        onImport(previewData, fileName);
        onClose();
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Import Youth Data</h3>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                {fileName && <p>Loaded file: <strong>{fileName}</strong></p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {previewData.length > 0 && (
                    <>
                        <p><strong>{previewData.length}</strong> records ready to import</p>
                        <pre style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            background: '#f9f9f9',
                            padding: '1rem',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            textAlign: 'left'
                        }}>
                            {JSON.stringify(previewData.slice(0, 10), null, 2)}
                        </pre>
                        {previewData.length > 10 && <p>...and more</p>}
                    </>
                )}

                <ButtonRow>
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleConfirmImport} disabled={!previewData.length}>Import</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}