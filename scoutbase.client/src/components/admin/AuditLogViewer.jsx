import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { FileText } from "lucide-react";


const AuditLogViewer = ({ activeGroupId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("audit_logs")
                .select(`
          *,
          users:user_admin_id(name),
          parents:user_parent_id(name)
        `)
                .eq("group_id", activeGroupId)
                .order("timestamp", { ascending: false });

            if (error) {
                console.error("Failed to fetch audit logs:", error.message);
                setLogs([]);
            } else {
                setLogs(data);
            }

            setLoading(false);
        };

        if (activeGroupId) fetchLogs();
    }, [activeGroupId]);

    return (
        <div>
            <PageTitle>
                <FileText size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Audit Log
            </PageTitle>

            {loading ? (
                <p>Loading logs...</p>
            ) : logs.length === 0 ? (
                <p>No activity recorded for this group.</p>
            ) : (
                        <AdminTable>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Target Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>
                                            {log.users?.name ||
                                                log.parents?.name ||
                                                log.user_admin_id ||
                                                log.user_parent_id ||
                                                "Unknown"}
                                        </td>
                                        <td>{log.role}</td>
                                        <td>{log.action}</td>
                                        <td>{log.target_type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </AdminTable>
            )}
        </div>
    );
};

export default AuditLogViewer;
