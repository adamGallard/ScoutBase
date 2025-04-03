import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import './App.css';

export default function AdminPage() {
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*, youth (name, section)')
      .eq('event_date', selectedDate)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error loading attendance:', error);
    } else {
      setRecords(data);
    }
    setLoading(false);
  };

  return (
    <div className="scout-container">
      <h1>Admin - Attendance Records</h1>

      <label style={{ marginTop: '1rem' }}>
        Select Date:
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        />
      </label>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          {records.length === 0 ? (
            <p>No attendance records for this date.</p>
          ) : (
            <ul style={{ paddingLeft: 0 }}>
              {records.map((r, i) => (
                <li
                  key={i}
                  style={{
                    listStyle: 'none',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid #ccc',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <strong>{r.youth.name}</strong> ({r.youth.section})<br />
                  {r.action} at {new Date(r.timestamp).toLocaleTimeString()} by {r.signed_by}
                  {r.comment && (
                    <div style={{ fontStyle: 'italic', color: '#555' }}>Comment: {r.comment}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
