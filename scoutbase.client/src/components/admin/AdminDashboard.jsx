const AdminDashboard = ({ userInfo }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Welcome, {userInfo?.name || 'Leader'} 👋</h2>

            <p className="text-lg">
                You are logged in as a <strong>Group Admin</strong>. From here, you can:
            </p>

            <ul className="list-disc list-inside space-y-2">
                <li>Manage youth and parent records for your group</li>
                <li>Assign and manage PINs and links</li>
                <li>Record and review attendance</li>
                <li>Access group-specific reports like:
                    <ul className="list-disc list-inside pl-6">
                        <li>Youth by section</li>
                        <li>Age breakdown</li>
                        <li>Transition history</li>
                        <li>Parent engagement</li>
                    </ul>
                </li>
            </ul>

            <p className="text-sm text-gray-600">
                Use the sidebar to get started.
            </p>
        </div>
    );
};

export default AdminDashboard;