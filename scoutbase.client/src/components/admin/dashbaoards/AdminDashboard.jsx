import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useTerrainUser } from "@/hooks/useTerrainUser";
import {
    stages,
    sections,
    stageMap,
    sectionMap
} from "@/components/common/Lookups";
import {
    PageTitle,
    HighlightNote,
    PrimaryButton
} from "@/components/common/SharedStyles";
import {
    ShieldCheck,
    Users,
    FileText,
    ClipboardCheck,
    UserPlus
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { getTerrainProfiles } from "@/helpers/terrainSyncHelper";
import { getPendingAwardSubmissions } from "@/helpers/terrainBadgesHelper";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
    const { userInfo } = useTerrainUser();
    const navigate = useNavigate();

    const [youthBySection, setYouthBySection] = useState({});
    const [selectedSection, setSelectedSection] = useState("");

    const [stats, setStats] = useState({
        youthCount: 0,
        parentCount: 0,
        todayAttendance: 0,
        stageAttendanceCounts: {},
        unlinkedParents: 0,
        unlinkedYouth: 0,
        youthNoTransitions: 0,
        parentsMissingContact: 0,
        pendingFamiliesCount: 0,
        parentsLockedOut: 0,
    });

    const isSectionLeader = userInfo?.role === "Section Leader";
    const isGroupLeader = userInfo?.role === "Group Leader";

    const [pendingTerrainCount, setPendingTerrainCount] = useState(0);

    // Determine which sections to display
    const sectionsToShow = isSectionLeader && userInfo.section
        ? [userInfo.section]
        : sections.map(s => s.code);

    // Default selectedSection when static sections load
    useEffect(() => {
        if (sections.length && !selectedSection) {
            setSelectedSection(sections[0].code);
        }
    }, [sections, selectedSection]);

    useEffect(() => {
    async function fetchTerrainPending() {
        try {
            const token = localStorage.getItem("scoutbase-terrain-idtoken");
            if (!token) return;
            const units = JSON.parse(
                localStorage.getItem("scoutbase-terrain-units") ||
                JSON.stringify(await getTerrainProfiles(token))
            );
            let results = [];
            for (const u of units) {
                const rows = await getPendingAwardSubmissions(token, u.unitId);
                results = results.concat(rows.map(r => ({ ...r, section: u.section })));
            }
            setPendingTerrainCount(results.length);
        } catch (e) {
            setPendingTerrainCount(0); // fallback
        }
    }
    fetchTerrainPending();
}, []);

    // Fetch dynamic stats
    useEffect(() => {
        async function fetchStats() {
            const groupId = userInfo?.group_id;
            if (!groupId) return;

            const today = new Date().toISOString().slice(0, 10);

            // 1) Youth data
            let { data: allYouth = [], error: youthErr } = await supabase
                .from("youth")
                .select("id, section, linking_section, membership_stage")
                .eq("group_id", groupId);

            if (isSectionLeader) {
                allYouth = allYouth.filter(y =>
                    y.section === userInfo.section || y.linking_section === userInfo.section
                );
            }
            allYouth = allYouth.filter(y => (y.membership_stage || '').toLowerCase() !== 'retired');

            const youthIds = allYouth.map(y => y.id);

            // 2) Parent links
            let { data: linksData = [] } = await supabase
                .from("parent_youth")
                .select("parent_id")
                .in("youth_id", youthIds);
            const uniqueParentIds = new Set(linksData.map(l => l.parent_id));

            // 3) Today's attendance
            let { data: attendanceRaw = [] } = await supabase
                .from("attendance")
                .select("youth_id")
                .eq("group_id", groupId)
                .eq("event_date", today);
            if (isSectionLeader) {
                attendanceRaw = attendanceRaw.filter(a => youthIds.includes(a.youth_id));
            }
            const attendedIds = new Set(attendanceRaw.map(a => a.youth_id));



            // 4) Stage attendance counts
            const stageAttendanceCounts = {};
            allYouth.forEach(y => {
                const stage = y.membership_stage || "Unknown";
                const section = y.section || "Unknown";
                if (attendedIds.has(y.id)) {
                    stageAttendanceCounts[stage] = (stageAttendanceCounts[stage] || 0) + 1;
                    const key = `${section}_${stage}`;
                    stageAttendanceCounts[key] = (stageAttendanceCounts[key] || 0) + 1;
                }
            });

            // 5) Youth-by-section totals
            const youthBySec = {};
            allYouth.forEach(y => {
                const section = y.section || "Unknown";
                const stage = y.membership_stage || "Unknown";
                if (!youthBySec[section]) {
                    youthBySec[section] = Object.fromEntries(
                        stages.map(({ code }) => [code, 0])
                    );
                    youthBySec[section].total = 0;
                }
                youthBySec[section].total += 1;
                youthBySec[section][stage] += 1;
            });
            setYouthBySection(youthBySec);



            // 6) Parent counts & unlinked
            let { data: parentsData = [] } = await supabase
                .from("parent")
                .select("id, email, phone, is_locked, failed_pin_attempts")
                .eq("group_id", groupId);

            const allParentIds = parentsData.map(p => p.id);
            const unlinkedParents = allParentIds.filter(
                id => !linksData.some(l => l.parent_id === id)
            );

            // Parents locked out: (use whatever field/logic you use for lockout)
            const parentsLockedOut = parentsData.filter(
                p => p.is_locked || (p.failed_pin_attempts && p.failed_pin_attempts >= 5)
            );

            // 7) Primary links & unlinked youth
            let { data: primaryLinks = [] } = await supabase
                .from("parent_youth")
                .select("youth_id")
                .eq("is_primary", true);
            const youthWithPrimary = new Set(primaryLinks.map(l => l.youth_id));
            const unlinkedYouth = youthIds.filter(id => !youthWithPrimary.has(id));

            // 8) Transitions
            let { data: transitionsData = [] } = await supabase
                .from("youth_transitions")
                .select("youth_id");
            const transitioned = new Set(transitionsData.map(t => t.youth_id));
            const noTransitions = youthIds.filter(id => !transitioned.has(id));

            // 9) Parents missing contact
            const parentsMissingContact = parentsData.filter(p => !p.email && !p.phone);
            // 10) Pending families count
            let pendingFamiliesCount = 0;
            {
                const { count, error } = await supabase
                    .from("pending_family")
                    .select("id", { count: "exact", head: true })
                    .eq("group_id", groupId)
                    .eq("status", "pending");
                pendingFamiliesCount = count || 0;
            }


            // 11) Badge order process stats
            let badgeOrderStats = {
                readyToOrder: 0,
                orderedNotReceived: 0,
                totalOrders: 0,
            };

            {
                const { data: badgeOrders = [], error: badgeOrderErr } = await supabase
                    .from("badge_orders")
                    .select("id, status, ordered_date, awarded_date, group_id")
                    .eq("group_id", groupId);
                if (badgeOrderErr) {
                    console.error("Error fetching badge_orders:", badgeOrderErr);
                } 
                badgeOrderStats.totalOrders = badgeOrders.filter(
                    b => b.status !== 'awarded'
                ).length;

                // Ready to Order: status = 'ready_to_order'
                badgeOrderStats.readyToOrder = badgeOrders.filter(b => b.status === 'ready_to_order').length;

                // Ordered but not yet received/awarded: status = 'ordered'
                badgeOrderStats.orderedNotReceived = badgeOrders.filter(
                    b => b.status === 'ordered'
                ).length;
                const now = new Date();
                badgeOrderStats.overdueOrders = badgeOrders.filter(
                    b => b.status === 'ordered' &&
                        b.ordered_date &&
                        (now - new Date(b.ordered_date)) / (1000 * 60 * 60 * 24) > 21
                ).length;
            };

            // 12) Update stats
            setStats({
                youthCount: allYouth.length,
                parentCount: uniqueParentIds.size,
                todayAttendance: attendedIds.size,
                stageAttendanceCounts,
                unlinkedParents: unlinkedParents.length,
                unlinkedYouth: unlinkedYouth.length,
                youthNoTransitions: noTransitions.length,
                parentsMissingContact: parentsMissingContact.length,
                pendingFamiliesCount, // ← add this
                badgeOrderStats,
                parentsLockedOutCount: parentsLockedOut.length,
            });
            
        }
        fetchStats();
    }, [userInfo, isSectionLeader]);

    // Prepare chart and counts
    const sectionData = youthBySection[selectedSection] || { total: 0 };
    const presentInSection = selectedSection
        ? stages.reduce(
            (sum, { code }) => sum + (stats.stageAttendanceCounts?.[`${selectedSection}_${code}`] || 0),
            0
        )
        : stats.todayAttendance;
    const totalInSection = selectedSection ? sectionData.total : stats.youthCount;
    const pieData = [
        ...stages.map(({ code, label }) => ({
            code, name: label,
            value: selectedSection
                ? stats.stageAttendanceCounts?.[`${selectedSection}_${code}`] || 0
                : stats.stageAttendanceCounts?.[code] || 0
        })),
        {
            code: "not_signed_in",
            name: "Not Signed In",
            value: selectedSection
                ? sectionData.total - stages.reduce(
                    (sum, { code }) => sum + (stats.stageAttendanceCounts?.[`${selectedSection}_${code}`] || 0),
                    0
                )
                : stats.youthCount - stats.todayAttendance
        }
    ];

    return (
        <div>
            <PageTitle>
                <ShieldCheck size={25} style={{ marginRight: "0.5rem" }} />
                {isGroupLeader ? "Group Leader" : isSectionLeader ? "Section Leader" : "Admin"} Dashboard
            </PageTitle>

            <HighlightNote>
                Welcome, <strong>{userInfo?.name}</strong>! You are logged in as <strong>
                    {isSectionLeader ? sectionMap[userInfo.section].label : ""} {userInfo?.role}
                </strong>.
            </HighlightNote>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                {/* Section Breakdown */}
                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3>Youth by Section</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {sectionsToShow.map(secCode => {
                            const { label, color } = sectionMap[secCode];
                            const data = youthBySection[secCode] || { total: 0 };
                            return (
                                <li key={secCode} style={{ marginBottom: "0.75rem" }}>
                                    <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                                        {label}: {data.total}
                                    </strong>
                                    <ul style={{ marginLeft: "1.5rem" }}>
                                        {stages
                                            .filter(({ code }) => code.toLowerCase() !== "retired")
                                            .map(({ code: stgCode, label: stgLabel }) => (
                                            <li key={stgCode}>
                                                {stgLabel}: {data[stgCode] || 0}
                                            </li>
                                        ))}
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

                {/* Parents Panel */}
                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Pending Family Registrations</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.pendingFamiliesCount}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Linked Adults</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentCount}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Unlinked Adults</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.unlinkedParents}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Adults Missing Contact</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentsMissingContact}</p>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Adults Locked Out</h3>
                    <p style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.parentsLockedOutCount}</p>
                </div>
                {/* Badge Orders Panel */}
                <div style={{
                    flex: "1 1 250px",
                    background: "#fff",
                    padding: "1rem",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}>

                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        Badge Orders
                    </h3>

                    <p>
                        <b>Pending from Terrain:</b> {pendingTerrainCount}
					</p>
                    <p>
                        <b>Ready to Order:</b> {stats.badgeOrderStats?.readyToOrder ?? 0}
                    </p>
                    <p>
                        <b>Ordered (not received):</b> {stats.badgeOrderStats?.orderedNotReceived ?? 0}
                    </p>

                    {stats.badgeOrderStats?.overdueOrders > 0 && (
                        <div style={{
                            color: '#b91c1c',
                            fontWeight: 'bold',
                            margin: '0.5rem 0'
                        }}>
                            {stats.badgeOrderStats.overdueOrders} badge order(s) overdue!
                        </div>
                    )}
                    <PrimaryButton
                        style={{ marginTop: "1rem", width: "100%" }}
                        onClick={() => navigate("/admin/badge-order")}
                    >
                        Manage Badge Orders
                    </PrimaryButton>
                </div>
                {/* Attendance Pie */}
                <div style={{ flex: "1 1 250px", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    {isGroupLeader && (
                        <div style={{ marginTop: "1rem" }}>
                            <label htmlFor="sectionSelect">Filter by Section:</label> <select
                                id="sectionSelect"
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                                style={{ marginLeft: "0.5rem" }}
                            >
                                <option value="">-- All Sections --</option>
                                {sectionsToShow.map(code => (
                                    <option key={code} value={code}>{sectionMap[code].label}</option>
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
                                    stageMap[d.code]?.color || "#d1d5db"
                                ),
                                borderWidth: 1
                            }]
                        }}
                        options={{
                            cutout: "70%",
                            plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } }
                        }}
                    />
                    <div style={{ textAlign: "center", marginTop: "0.5rem", fontWeight: "bold" }}>
                        {presentInSection} / {totalInSection} Present
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ flex: "1 1 300px", background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                        <PrimaryButton onClick={() => navigate("/admin/add-youth")}><Users size={16} style={{ marginRight: "0.5rem" }} />Manage Youth</PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/add-parent")}><UserPlus size={16} style={{ marginRight: "0.5rem" }} />Manage Parents</PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/report-attendance")}><ClipboardCheck size={16} style={{ marginRight: "0.5rem" }} />Record Attendance</PrimaryButton>
                        <PrimaryButton onClick={() => navigate("/admin/reports")}><FileText size={16} style={{ marginRight: "0.5rem" }} />View Reports</PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}