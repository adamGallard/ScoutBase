import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useTerrainUser } from "@/hooks/useTerrainUser";
import { PageTitle, HighlightNote, PrimaryButton } from "@/components/common/SharedStyles";
import { ShieldCheck, Users, FileText, ClipboardCheck, UserPlus } from "lucide-react";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
    const { userInfo } = useTerrainUser();
    const navigate = useNavigate();
    const [youthBySection, setYouthBySection] = useState({});
    const [selectedSection, setSelectedSection] = useState("");
    const [stats, setStats] = useState({
        youthCount: 0,
        parentCount: 0,
        todayAttendance: 0,
        stageCounts: {},
        stageAttendanceCounts: {},
        unlinkedParents: 0,
        unlinkedYouth: 0,
        youthNoTransitions: 0,
        parentsMissingContact: 0
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

            const { data: allYouth } = await supabase
                .from("youth")
                .select("id, section, linking_section, membership_stage")
                .eq("group_id", groupId);

            let youthData = allYouth || [];
            if (userInfo?.role === 'Section Leader' && userInfo?.section) {
                youthData = youthData.filter(
                    y => y.section === userInfo.section || y.linking_section === userInfo.section
                );
            }

            const youthIds = youthData.map(y => y.id);

            const { data: linksData } = await supabase
                .from("parent_youth")
                .select("parent_id")
                .in("youth_id", youthIds);

            const uniqueParentIds = new Set((linksData || []).map(link => link.parent_id));

            const { data: attendanceRaw } = await supabase
                .from("attendance")
                .select("id, youth_id")
                .eq("group_id", groupId)
                .eq("event_date", today);

            const filteredAttendance = userInfo?.role === 'Section Leader' && userInfo?.section
                ? (attendanceRaw || []).filter(entry => youthIds.includes(entry.youth_id))
                : attendanceRaw || [];

            const uniqueAttendance = Array.from(new Set(filteredAttendance.map(a => a.youth_id)));
            const attendedIds = new Set(uniqueAttendance);

            const stageAttendanceCounts = youthData.reduce((acc, youth) => {
                if (attendedIds.has(youth.id)) {
                    const stage = youth.membership_stage || 'Unknown';
                    const section = youth.section || 'Unknown';

                    // Overall counts
                    acc[stage] = (acc[stage] || 0) + 1;

                    // Section-specific counts
                    const sectionKey = `${section}_${stage}`;
                    acc[sectionKey] = (acc[sectionKey] || 0) + 1;
                }
                return acc;
            }, {});

            const sectionCounts = youthData.reduce((acc, youth) => {
                const section = youth.section || "Unknown";
                const stage = youth.membership_stage || "Unknown";
                if (!acc[section]) {
                    acc[section] = { total: 0, Invested: 0, 'Have a Go': 0, Linking: 0 };
                }
                acc[section].total += 1;
                if (acc[section][stage] !== undefined) acc[section][stage] += 1;
                return acc;
            }, {});
            setYouthBySection(sectionCounts);

            const stageCounts = youthData.reduce((acc, youth) => {
                const stage = youth.membership_stage || "Unknown";
                acc[stage] = (acc[stage] || 0) + 1;
                return acc;
            }, {});

            const allYouthIds = youthData.map(y => y.id);

            const { data: parentsData } = await supabase
                .from("parent")
                .select("id, email, phone")
                .eq("group_id", groupId);

            const allParentIds = (parentsData || []).map(p => p.id);
            const unlinkedParentIds = allParentIds.filter(id =>
                !linksData?.some(link => link.parent_id === id)
            );

            const { data: primaryLinks } = await supabase
                .from("parent_youth")
                .select("youth_id")
                .eq("is_primary", true);

            const youthWithPrimary = new Set((primaryLinks || []).map(link => link.youth_id));
            const unlinkedYouthIds = allYouthIds.filter(id => !youthWithPrimary.has(id));

            const { data: transitionsData } = await supabase
                .from("youth_transitions")
                .select("youth_id");

            const transitionedYouthIds = new Set(transitionsData.map(t => t.youth_id));
            const youthNoTransitions = allYouthIds.filter(id => !transitionedYouthIds.has(id));

            const parentsMissingContact = (parentsData || []).filter(p => !p.email && !p.phone);

            setStats({
                youthCount: youthData.length,
                parentCount: uniqueParentIds.size,
                todayAttendance: uniqueAttendance.length,
                stageCounts,
                stageAttendanceCounts,
                unlinkedParents: unlinkedParentIds.length,
                unlinkedYouth: unlinkedYouthIds.length,
                youthNoTransitions: youthNoTransitions.length,
                parentsMissingContact: parentsMissingContact.length
            });
        };

        if (userInfo?.group_id) fetchStats();
    }, [userInfo]);

    const getRoleLabel = () => {
        if (userInfo?.role === "Group Leader") return "Group Leader";
        if (userInfo?.role === "Section Leader") return "Section Leader";
        return "Admin";
    };

    const getSectionLabel = () => {
        if (userInfo?.role === "Group Leader") return "";
        if (userInfo?.role === "Section Leader") return userInfo?.section;
        return "Admin";
    };

    const isSectionLeader = userInfo?.role === "Section Leader";
    const isGroupLeader = userInfo?.role === "Group Leader";
    const sectionsToShow = isSectionLeader && userInfo?.section
        ? [userInfo.section]
        : ["Joeys", "Cubs", "Scouts", "Venturers"];
    // Calculate filtered counts for pie summary
    const presentInSection = selectedSection
        ? ['Invested', 'Have a Go', 'Linking'].reduce((sum, stage) => {
            const key = `${selectedSection}_${stage}`;
            return sum + (stats.stageAttendanceCounts?.[key] || 0);
        }, 0)
        : stats.todayAttendance;

    const totalInSection = selectedSection
        ? youthBySection[selectedSection]?.total || 0
        : stats.youthCount;


    const pieData = ['Invested', 'Have a Go', 'Linking'].map(stage => {
        let value = 0;

        if (selectedSection && stats.stageAttendanceCounts) {
            const sectionStageKey = `${selectedSection}_${stage}`;
            value = stats.stageAttendanceCounts[sectionStageKey] || 0;
        } else {
            value = stats.stageAttendanceCounts?.[stage] || 0;
        }

        return { name: stage, value };
    }).concat([{
        name: 'Not Signed In',
        value: selectedSection
            ? (youthBySection[selectedSection]?.total || 0) -
            (['Invested', 'Have a Go', 'Linking'].reduce((sum, stage) => {
                const key = `${selectedSection}_${stage}`;
                return sum + (stats.stageAttendanceCounts[key] || 0);
            }, 0))
            : stats.youthCount - stats.todayAttendance
    }]);

    return (
        <div>
            <PageTitle>
                <ShieldCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                {getRoleLabel()} Dashboard
            </PageTitle>

            <HighlightNote>
                Welcome, <strong>{userInfo?.name || "Leader"}</strong>! You are logged in as <strong>{getSectionLabel()} {getRoleLabel()}</strong>.
            </HighlightNote>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                {/* Section Breakdown */}
                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3>Youth by Section</h3>
                    <ul>
                        {sectionsToShow.map((section) => {
                            const data = youthBySection[section] || {};
                            return (
                                <li key={section} style={{ marginBottom: "0.75rem" }}>
                                    <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            backgroundColor: sectionColors[section],
                                            display: "inline-block"
                                        }}></span>
                                        {section}: {data.total || 0}
                                    </strong>
                                    <ul>
                                        <li>Invested: {data.Invested || 0}</li>
                                        <li>Have a Go: {data['Have a Go'] || 0}</li>
                                        <li>Linking: {data.Linking || 0}</li>
                                    </ul>
                                </li>
                            );
                        })}
                    </ul>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Youth w/ No Transitions</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.youthNoTransitions}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Unlinked Youth</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.unlinkedYouth}</p>
                </div>
                {/* Parents */}
                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Linked Parents</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentCount}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Unlinked Parents</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.unlinkedParents}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Parents Missing Contact</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentsMissingContact}</p>
                </div>
                {/* Attendance Pie */}

                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    {isGroupLeader && (
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="sectionSelect">Filter by Section:</label>{' '}
                            <select
                                id="sectionSelect"
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                style={{ marginLeft: "0.5rem" }}
                            >
                                <option value="">-- Select --</option>
                                {sectionsToShow.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <h3>Attendance Today</h3>
                    <Doughnut
                        data={{
                            labels: pieData.map(d => d.name),
                            datasets: [{
                                data: pieData.map(d => d.value),
                                backgroundColor: pieData.map(d =>
                                    d.name === 'Not Signed In' ? '#d1d5db' :
                                        d.name === 'Have a Go' ? '#FACC15' :
                                            d.name === 'Linking' ? '#38BDF8' :
                                                '#0F5BA4'
                                ),
                                borderWidth: 1
                            }]
                        }}
                        options={{
                            cutout: '70%',
                            plugins: {
                                legend: { position: 'bottom', labels: { boxWidth: 12 } }
                            }
                        }}
                    />
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        {presentInSection} / {totalInSection} Present
                    </div>
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
                        <PrimaryButton onClick={() => navigate("/admin/report-attendance")}>
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
