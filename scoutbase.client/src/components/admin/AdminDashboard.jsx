import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useTerrainUser } from "@/hooks/useTerrainUser";
import { PageTitle, HighlightNote, PrimaryButton } from "@/components/SharedStyles";
import { ShieldCheck, Users, FileText, ClipboardCheck, UserPlus } from "lucide-react";

const AdminDashboard = () => {
    const { userInfo } = useTerrainUser();
    const navigate = useNavigate();
    const [youthBySection, setYouthBySection] = useState({});
    const [stats, setStats] = useState({
        youthCount: 0,
        parentCount: 0,
        todayAttendance: 0,
    });
    const sectionColors = {
        Joeys: "#b65518",
        Cubs: "#ffc82e",
        Scouts: "#00ae42",
        Venturers: "#9e1b32",
    };

    useEffect(() => {
        const fetchStats = async () => {
            const groupId = userInfo?.group_id;
            if (!groupId) return;

            const today = new Date().toISOString().split("T")[0];

            const { data: youthData } = await supabase
                .from("youth")
                .select("id, section")
                .eq("group_id", groupId);

            const youthIds = (youthData || []).map(y => y.id);

            let parentLinks = [];
            if (youthIds.length > 0) {
                const { data: linksData } = await supabase
                    .from("parent_youth")
                    .select("parent_id")
                    .in("youth_id", youthIds);

                parentLinks = linksData || [];
            }

            const uniqueParentIds = new Set(parentLinks.map(link => link.parent_id));



            const { data: attendance } = await supabase
                .from("attendance")
                .select("id")
                .eq("group_id", groupId)
                .eq("event_date", today);

            const sectionCounts = youthData?.reduce((acc, youth) => {
                const section = youth.section || "Unknown";
                acc[section] = (acc[section] || 0) + 1;
                return acc;
            }, {}) || {};

            setYouthBySection(sectionCounts);


            setStats({
                youthCount: youthData?.length || 0,
                parentCount: uniqueParentIds.size || 0,
                todayAttendance: attendance?.length || 0,
            });
        };

        if (userInfo?.group_id) fetchStats();
    }, [userInfo]);

    return (
        <div>
            <PageTitle>
                <ShieldCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Admin Dashboard
            </PageTitle>

            <HighlightNote>
                Welcome, <strong>{userInfo?.name || "Leader"}</strong>! You are logged in as a <strong>Group Admin</strong>.
            </HighlightNote>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                {/* Stats Cards */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Youth by Section</h3>
                    <ul style={{ fontSize: "0.95rem", paddingLeft: "1rem" }}>
                        {["Joeys", "Cubs", "Scouts", "Venturers"].map((section) => (
                            <li key={section} style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        backgroundColor: sectionColors[section],
                                        display: "inline-block"
                                    }}
                                ></span>
                                <strong>{section}</strong>: {youthBySection[section] || 0}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ flex: "1 1 200px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Linked Parents</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentCount}</p>
                </div>

                <div style={{ flex: "1 1 200px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Attendance Today</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.todayAttendance}</p>
                </div>

                {/* Quick Links */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                        <PrimaryButton onClick={() => navigate("/admin/add-youth")}>
                            <Users size={16} style={{ marginRight: "0.5rem" }} />
                            Manage Youth
                        </PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/add-parent")}>
                            <UserPlus size={16} style={{ marginRight: "0.5rem" }} />
                            Manage Parents
                        </PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/attendance")}>
                            <ClipboardCheck size={16} style={{ marginRight: "0.5rem" }} />
                            Record Attendance
                        </PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/reports")}>
                            <FileText size={16} style={{ marginRight: "0.5rem" }} />
                            View Reports
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
