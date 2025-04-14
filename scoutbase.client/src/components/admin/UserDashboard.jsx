const ReportingUserDashboard = ({ userInfo }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Welcome, {userInfo?.name || 'User'} 👋</h2>

            <p className="text-lg">
                You are logged in as a <strong>Reporting User</strong>. From here, you can:
            </p>

            <ul className="list-disc list-inside space-y-2">
                <li>Access read-only reports for your Scout group</li>
                <li>View data like youth by section, age breakdown, and transitions</li>
                <li>Export summary data for use in your reporting</li>
            </ul>

            <p className="text-sm text-gray-600">
                Use the sidebar to browse available reports.
            </p>
        </div>
    );
};

export default ReportingUserDashboard;