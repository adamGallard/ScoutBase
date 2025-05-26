import { useEffect, useState, useCallback } from "react";
import {
    Mail,
    RefreshCcw,
    Award,
    CheckCircleIcon,
    ArrowRightCircle
} from "lucide-react";

import { getTerrainProfiles } from "@/helpers/terrainSyncHelper";
import {
    // terrain helpers
    getPendingAwardSubmissions,
    getSIAAchievementsForMember,
    createBadgeOrderRequests,
    getOrderedBadgesForGroup,
    updateBadgeOrderStatus,
    awardInTerrain,
    getBadgeHistoryForGroup,
} from "@/helpers/terrainBadgesHelper";

import {
    PageTitle,
    PrimaryButton,
    AdminTable
} from "@/components/common/SharedStyles";
import { sections } from "@/components/common/Lookups";
import OrderPreviewModal from "@/components/admin/OrderPreviewModal";

/* ------------------------------------------------------------------ */
// helper look‑ups
const codeToSectionLabel = c =>
    sections.find(s => s.code === c)?.label ?? c;

function formatBadge(type, meta = {}) {
    switch (type) {
        case "special_interest_area":
            return `SIA – ${meta.sia_area?.replace("sia_", "").replace(/_/g, " ")}`;
        case "outdoor_adventure_skill":
            return `OAS – ${meta.stream} Stage ${meta.stage}`;
        case "course_reflection":
            return `Course Reflection${meta.course_type ? ` – ${meta.course_type}` : ""}`;
        case "personal_reflection":
            return "Personal Reflection";
        case "intro_section":
            return `Intro to ${meta.section ?? "Section"}`;
        case "intro_scouting":
            return "Intro to Scouting";
        case "adventurous_journey":
            return "Adventurous Journey";
        case "milestone":
            return `Milestone Stage ${meta.stage ?? "?"}`;
        case "peak_award":
            return `Peak Award${meta.award_name ? ` – ${meta.award_name}` : ""}`;
        default:
            return "Unknown badge";
    }
}

/* ------------------------------------------------------------------ */
export default function BadgeOrderView({ groupId, userInfo }) {
    /* ─────────────────── state ─────────────────── */
    const [pending, setPending] = useState([]); // straight from Terrain
    const [orders, setOrders] = useState([]);   // rows from badge_orders
    const [loading, setLoading] = useState(true);

    const [filterText, setFilterText] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [selected, setSelected] = useState({}); // submissionId → bool for whichever table is showing

    const [page, setPage] = useState(1);
    const itemsPerPage = 12;
    const [showPreview, setShowPreview] = useState(false);
    const [history, setHistory] = useState([]);  


    const groupName = userInfo?.group_name ?? "Unknown";
    const leaderName = userInfo?.name ?? "Unknown";
    const isGL = userInfo?.role === "Group Leader";
    const isSL = userInfo?.role === "Section Leader";



    /* ─────────────── fetch Terrain pending ─────────────── */
    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("scoutbase-terrain-idtoken");
            if (!token) throw new Error("No Terrain token – please log in.");

            const units = JSON.parse(
                localStorage.getItem("scoutbase-terrain-units") ||
                JSON.stringify(await getTerrainProfiles(token))
            );

            const results = [];
            for (const u of units) {
                const rows = await getPendingAwardSubmissions(token, u.unitId);
                rows.forEach(r => results.push({ ...r, section: u.section }));
            }
			//console.log("✅ Fetched pending badges from Terrain:", results);
            /* SIA enrichment */
            const siaRows = results.filter(r => r.badgeType === "special_interest_area");
            const memberIds = [...new Set(siaRows.map(r => r.memberId))];
            for (const mId of memberIds) {
                const achievements = await getSIAAchievementsForMember(token, mId);
                const lookup = Object.fromEntries(achievements.map(a => [a.id, a]));
                siaRows
                    .filter(r => r.memberId === mId)
                    .forEach(r => {
                        const ach = lookup[r.badgeId];
                        if (!ach) return;
                        r.projectName = ach.answers?.project_name?.trim() || ach.answers?.project_title?.trim() || "";
                        r.approvedDate = ach.status_updated || "";
                        r.approvedBy = ach.approval?.actioned_by?.[0]
                            ? `${ach.approval.actioned_by[0].member_first_name} ${ach.approval.actioned_by[0].member_last_name}`
                            : "";
                    });
            }

            setPending(results);
        } catch (err) {
            console.error("Badge fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ───────────── fetch badge_orders table ───────────── */
    const fetchOrders = useCallback(async () => {
        if (!groupId) return;
        const rows = await getOrderedBadgesForGroup(groupId);
        console.log("raw orders:", rows);
        if (rows.length) console.log("keys on an order:", Object.keys(rows[0]));
        setOrders(rows);
    }, [groupId]);

    /* initial */
    useEffect(() => {
        fetchPending();
    }, [fetchPending]);
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);


    useEffect(() => {
        if (!groupId) return;
        getBadgeHistoryForGroup(groupId)
            .then(h => setHistory(h))
            .catch(console.error);
    }, [groupId]);
    /* ─────────────── derived buckets ─────────────── */
	//console.log("Orders:", orders);
    const readyRows = orders.filter(r => r.status === "ready_to_order");
	console.log("Ready rows:", readyRows);
    const orderedRows = orders.filter(r => r.status === "ordered");
	    /* Pending list to display (filter out those already copied) */
    const pendingFiltered = pending
        .filter(b => b.youthName.toLowerCase().includes(filterText.toLowerCase()))
        .filter(b => !sectionFilter || codeToSectionLabel(b.section) === codeToSectionLabel(sectionFilter))
        .filter(b => !typeFilter || b.badgeType === typeFilter)
        .filter(b => !orders.some(o => o.submission_id === b.submissionId));

    const pagedPending = pendingFiltered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    /* ─────────────── helpers ─────────────── */
    const resetSelected = () => setSelected({});
    const toggle = id => setSelected(s => ({ ...s, [id]: !s[id] }));
    const toAusDate = iso => (iso ? new Date(iso).toLocaleDateString("en-AU") : "TBC");

    const sectionList = [...new Set(Object.keys(selected))]
        .map(id => {
            const row = pending.find(r => r.submissionId === id) || orders.find(r => r.id === id);
            return codeToSectionLabel(row?.section);
        })
        .filter(Boolean)
        .join(", ") || "All Sections";

    /* build email body for GL */
    const buildEmailBody = rows => {
        const header = `Badge Order Request\nGroup : ${groupName}\nSection: ${sectionList}\nLeader: ${leaderName}\n\n`;
        const lines = rows.map(b => {
            const badge = formatBadge(b.badgeType || b.badge_type, b.badgeMeta || b.badge_meta);
            const section = codeToSectionLabel(b.section);
            const proj = b.projectName ? ` – “${b.projectName}”` : "";
            const when = b.approvedDate ? ` – approved ${toAusDate(b.approvedDate)}` : "";
            const youth = b.youthName || b.youth_name;
            return `• ${youth} (${section}) – ${badge}${proj}${when}`;
        });
        return header + lines.join("\n");
    };

    /* ─────────────── actions ─────────────── */
    // 1️⃣ Section leader adds pending rows to internal queue
    async function addToOrder() {
        const rows = pagedPending.filter(b => selected[b.submissionId]);
        if (!rows.length) return alert("Select at least one badge.");
        await createBadgeOrderRequests(rows, userInfo.user_id, groupId);
        resetSelected();
        await fetchOrders();
    }

    // 2️⃣ GL marks ready rows as ordered
    async function markOrdered() {
        const ids = readyRows.filter(r => selected[r.id]).map(r => r.id);
        if (!ids.length) return alert("Select at least one row.");
        await updateBadgeOrderStatus(ids, "ordered", "ordered_date");
        resetSelected();
        await fetchOrders();
    }

    // 3️⃣ SL marks ordered rows as awarded → Terrain + DB
    async function markAwarded() {
        const rows = orderedRows.filter(r => selected[r.id]);
        if (!rows.length) return alert("Select at least one row.");

        const token = localStorage.getItem("scoutbase-terrain-idtoken");
        await Promise.all(rows.map(r => awardInTerrain(token, r.submission_id)));
        await updateBadgeOrderStatus(rows.map(r => r.id), "awarded", "awarded_date");
        resetSelected();
        await fetchOrders();
    }

    /* ─────────────── reusable row render ─────────────── */
    function Row({ row, idKey = "submissionId" }) {
        const id = row[idKey];
        return (
            <tr key={id}>
                <td>
                    <input type="checkbox" checked={!!selected[id]} onChange={() => toggle(id)} />
                </td>
                <td>{row.youthName || row.youth_name}</td>
                <td>{codeToSectionLabel(row.section)}</td>
                <td>{formatBadge(row.badgeType || row.badge_type, row.badgeMeta || row.badge_meta)}</td>
                <td>{row.projectName || row.project_name || "—"}</td>
                {row.status && <td>{row.status}</td>}
                {row.approvedBy && <td>{row.approvedBy}</td>}
                {row.approvedDate && <td>{toAusDate(row.approvedDate)}</td>}
                <td>{toAusDate(row.dateSubmitted || row.ordered_date)}</td>
            </tr>
        );
    }
    function selectAll(rows, idKey, checked) {
           setSelected(sel => {
                const next = { ...sel };
                 rows.forEach(r => { next[r[idKey]] = checked; });
                 return next;
               });
    }


     const allPendingSelected = pagedPending.length > 0
          && pagedPending.every(r => selected[r.submissionId]);
     const allReadySelected = readyRows.length > 0
           && readyRows.every(r => selected[r.id]);
     const allOrderedSelected = orderedRows.length > 0
           && orderedRows.every(r => selected[r.id]);
    /* ------------------------------------------------------------------ */
    return (
        <div className="content-box">
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", gap: "5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <PageTitle>
                    <Award size={25} style={{ marginRight: 8 }} /> Badge Order Workflow
                </PageTitle>
                <PrimaryButton onClick={fetchPending}>
                    <RefreshCcw size={18} style={{ marginRight: 4 }} /> Refresh Terrain
                </PrimaryButton>
            </div>

            {/* filters (only affect Terrain list) */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Search youth" />
                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                    <option value="">All sections</option>
                    {sections.map(s => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All badges</option>
                    <option value="special_interest_area">SIA</option>
                    <option value="outdoor_adventure_skill">OAS</option>
                    <option value="course_reflection">Course Reflection</option>
                    <option value="personal_reflection">Personal Reflection</option>
                    <option value="intro_section">Intro to Section</option>
                    <option value="intro_scouting">Intro to Scouting</option>
                    <option value="adventurous_journey">Adventurous Journey</option>
                    <option value="milestone">Milestone</option>
                    <option value="peak_award">Peak Award</option>
                </select>
                <button onClick={() => { setFilterText(""); setSectionFilter(""); setTypeFilter(""); }}>Clear</button>
            </div>

            {/* STEP 1 ---------------------------------------------------------- */}
            <h3>Step 1 – Pending from Terrain</h3>
            {loading ? <p>Loading…</p> : (
                    <AdminTable>
                           <thead>
                                <tr>
                                       <th>
                                             <input
               type="checkbox"
                                               checked={allPendingSelected}
                                               onChange={e => selectAll(pagedPending, "submissionId", e.target.checked)}
             />
                                          </th>
                            <th>Youth</th><th>Section</th><th>Badge</th><th>Project</th><th>Status</th><th>Approved by</th><th>Approved on</th><th>Submitted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedPending.map(b => <Row key={b.submissionId} row={b} />)}
                    </tbody>
                </AdminTable>
            )}
            <div style={{ margin: "0.5rem 0" }}>
                <PrimaryButton onClick={addToOrder}><ArrowRightCircle size={16} style={{ marginRight: 4 }} /> Add to Order Queue</PrimaryButton>
            </div>

            {/* STEP 2 ---------------------------------------------------------- */}
            {readyRows.length > 0 && (
                <>
                    <h3 style={{ marginTop: "2rem" }}>Step 2 – Badges ready to order (GL)</h3>
                    <AdminTable>
                        <thead>
                            <tr>                <input
                  type="checkbox"
                                                 checked={allReadySelected}
                                                  onChange={e => selectAll(readyRows, "id", e.target.checked)}
                />
                                <th />
                                <th>Youth</th><th>Section</th><th>Badge</th><th>Project</th><th>Requested</th>
                            </tr>
                        </thead>
                        <tbody>
                            {readyRows.map(r => <Row key={r.id} row={r} idKey="id" />)}
                        </tbody>
                    </AdminTable>
                    {isGL && (
                        <div style={{ margin: "0.5rem 0" }}>
                            <PrimaryButton onClick={markOrdered}><CheckCircleIcon size={16} style={{ marginRight: 4 }} /> Badges ordered</PrimaryButton>
                        </div>
                    )}
                </>
            )}

            {/* STEP 3 ---------------------------------------------------------- */}
            {orderedRows.length > 0 && (
                <>
                    <h3 style={{ marginTop: "2rem" }}>Step 3 – Ordered badges (mark awarded)</h3>
                    <AdminTable>
                        <thead>
                            <tr> <input
                  type="checkbox"
                                                  checked={allOrderedSelected}
                                                  onChange={e => selectAll(orderedRows, "id", e.target.checked)}
                />
                                <th />
                                <th>Youth</th><th>Section</th><th>Badge</th><th>Project</th><th>Ordered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderedRows.map(r => <Row key={r.id} row={r} idKey="id" />)}
                        </tbody>
                    </AdminTable>
                    {(isSL || isGL) && (
                        <div style={{ margin: "0.5rem 0" }}>
                            <PrimaryButton onClick={markAwarded}><CheckCircleIcon size={16} style={{ marginRight: 4 }} /> Mark awarded</PrimaryButton>
                        </div>
                    )}
                </>
            )}
                 {/* STEP 4 – full history */}
                 {history.length > 0 && (
                       <>
                             <h3 style={{ marginTop: '2rem' }}>Step 4 – All badge-order history</h3>
                             <AdminTable>
                                   <thead>
                                         <tr>
                                               <th>Youth</th>
                                               <th>Badge</th>
                                              <th>Status</th>
                                              <th>Ordered</th>
                                               <th>Awarded</th>
                                             </tr>
                                       </thead>
                                   <tbody>
                                         {history.map(r => (
                                               <tr key={r.id}>
                                                     <td>{r.youth_name}</td>
                                                     <td>{formatBadge(r.badge_type, r.badge_meta)}</td>
                                                     <td>{r.status.replace(/_/g, ' ')}</td>
                                                     <td>{r.ordered_date && new Date(r.ordered_date).toLocaleDateString()}</td>
                                                     <td>{r.awarded_date && new Date(r.awarded_date).toLocaleDateString()}</td>
                                                   </tr>
                                             ))}
                                      </tbody>
                                 </AdminTable>
                           </>
                     )}
            {/* email preview for GL if you still want the email flow */}
            {showPreview && (
                <OrderPreviewModal
                    emailBody={buildEmailBody(selectedRows)}
                    groupName={groupName}
                    leaderName={leaderName}
                    section={sectionList}
                    onConfirm={handleConfirmOrder}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
