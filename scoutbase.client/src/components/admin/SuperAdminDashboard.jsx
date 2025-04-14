import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useActingGroup } from "@/hooks/useActingGroup";
import { PageTitle, HighlightNote, PrimaryButton } from "@/components/SharedStyles";
import { Users, MapPin, FileText, Settings, ShieldCheck } from "lucide-react";

const SuperAdminDashboard = () => {
    const [groupCount, setGroupCount] = useState(0);
    const [userStats, setUserStats] = useState({});
    const { actingAsGroupId, actingAsAdmin } = useActingGroup();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const { data: groupData } = await supabase.from("groups").select("*");
            const { data: userData } = await supabase.from("users").select("role");

            setGroupCount(groupData?.length || 0);

            const stats =
                userData?.reduce((acc, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {}) || {};

            setUserStats(stats);
        };

        fetchData();
    }, []);

    return (
        <div>
            <PageTitle>
                <ShieldCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Superadmin Dashboard
            </PageTitle>

            {actingAsAdmin && actingAsGroupId && (
                <HighlightNote>
                    ⚠️ You are currently <strong>acting as admin</strong> for group ID:{" "}
                    <strong>{actingAsGroupId}</strong>
                </HighlightNote>
            )}

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                {/* Group count card */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Total Groups</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{groupCount}</p>
                </div>

                {/* User roles card */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>User Roles</h3>
                    <ul style={{ paddingLeft: "1rem", marginTop: "0.5rem" }}>
                        {Object.entries(userStats).map(([role, count]) => (
                            <li key={role} style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                                <strong>{role}</strong>: {count}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Quick links card */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Quick Links</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                        <PrimaryButton onClick={() => navigate("/admin/user-management")}>
                            <Users size={16} style={{ marginRight: "0.5rem" }} />
                            Manage Users
                        </PrimaryButton>

                        <PrimaryButton onClick={() => navigate("/admin/group-management")}>
                            <MapPin size={16} style={{ marginRight: "0.5rem" }} />
                            Manage Groups
                        </PrimaryButton>

                        <PrimaryButton onClick={() => navigate("/admin/audit-log")}>
                            <FileText size={16} style={{ marginRight: "0.5rem" }} />
                            View Audit Logs
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
