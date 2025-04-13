export default function AdminDashboard() {
    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Dashboard</h2>
            <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                Welcome to the ScoutBase Admin Panel. Here you can manage your group's youth, parents, attendance, and reporting tools. Use the sidebar to navigate to different sections of the admin system.
            </p>

            <div style={{ lineHeight: 1.6 }}>
                <ul style={{ paddingLeft: '1.25rem' }}>
                    <li><strong>Attendance</strong>: Record and track who attended each night.</li>
                    <li><strong>Parent</strong>: Add or update parent contact info and link them to youth.</li>
                    <li><strong>Youth</strong>: Add, edit, or transition youth members between sections.</li>
                    <li><strong>Reports</strong>: Download CSVs of youth by section, parent contact lists, ages, and more.</li>
                    <li><strong>Linking & PINs</strong>: Manage who can sign youth in/out and generate PINs for secure check-ins.</li>
                </ul>
            </div>

            <p style={{ marginTop: '2rem', fontStyle: 'italic', fontSize: '0.9rem', color: '#666' }}>
                Need a custom feature or report? Let us know and we'll be happy to help.
            </p>
        </div>
    );
}