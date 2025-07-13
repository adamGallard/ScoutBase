import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ModalOverlay, ModalBox, ButtonRow, PrimaryButton } from "@/components/common/SharedStyles";

export default function AttendanceModal({
    open,
    data,
    groupId,
    date,
    leaderName,
    sectionFilter,
    onClose
}) {
    const [youthId, setYouthId] = useState(data?.youth?.id || "");
    const [action, setAction] = useState(data?.signIn?.action || "signed in");
    const [comment, setComment] = useState(data?.signIn?.comment || "");
    const [parentId, setParentId] = useState(data?.signIn?.signed_by || "");
    const [youthOptions, setYouthOptions] = useState([]);
    const [parentOptions, setParentOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch youth for selection, filtered by section if given
    useEffect(() => {
        async function fetchYouth() {
            let query = supabase
                .from("youth")
                .select("id, name, section")
                .eq("group_id", groupId)
				.order("name", { ascending: true });
            if (sectionFilter) query = query.eq("section", sectionFilter);

            const { data: youth } = await query;
            setYouthOptions(youth || []);
        }
        if (!data?.youth) fetchYouth();
        else setYouthOptions([data.youth]);
    }, [data, groupId, sectionFilter]);

    // Fetch only parents linked to selected youth
    useEffect(() => {
        async function fetchParents() {
            if (!youthId) {
                setParentOptions([]);
                return;
            }
            // Get parent_ids for this youth
            const { data: links } = await supabase
                .from("parent_youth")
                .select("parent_id")
                .eq("youth_id", youthId);

            const parentIds = links?.map(l => l.parent_id) || [];
            if (parentIds.length === 0) {
                setParentOptions([]);
                return;
            }
            // Get parent records
            const { data: parents } = await supabase
                .from("parent")
                .select("id, name")
                .in("id", parentIds);

            setParentOptions(parents || []);
        }
        fetchParents();
        setParentId(""); // Clear selection if youth changes
    }, [youthId, groupId]);

    // Auto-prefill comment if action changes to "signed out"
    useEffect(() => {
        if (action === "signed out" && !comment) {
            setComment(`Signed out by ${leaderName || "Leader"}`);
        }
        if (action === "signed in" && comment.startsWith("Signed out by")) {
            setComment("");
        }
        // eslint-disable-next-line
    }, [action, leaderName]);

    const handleSave = async () => {
        if (!youthId || !parentId) return alert("Youth and Marked By required.");
        setLoading(true);
        const row = {
            youth_id: youthId,
            group_id: groupId,
            event_date: date,
            action,
            signed_by: parentId,
            comment,
        };
        // Always insert (could do upsert if needed)
        await supabase.from("attendance").insert(row);
        setLoading(false);
        onClose(true);
    };

    if (!open) return null;

    return (
        <ModalOverlay>
            <ModalBox style={{ minWidth: 350 }}>
                <h3 style={{ marginBottom: 12 }}>
                    {data?.youth ? `Edit Attendance for ${data.youth.name}` : "Add Attendance"}
                </h3>
                {/* Youth select (only when adding, not editing) */}
                {!data?.youth && (
                    <div style={{ marginBottom: 10 }}>
                        <label>Youth:</label>
                        <select value={youthId} onChange={e => setYouthId(e.target.value)}>
                            <option value="">--Select--</option>
                            {youthOptions.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div style={{ marginBottom: 10 }}>
                    <label>Action:</label>
                    <select value={action} onChange={e => setAction(e.target.value)}>
                        <option value="signed in">Signed In</option>
                        <option value="signed out">Signed Out</option>
                    </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Marked By:</label>
                    <select value={parentId} onChange={e => setParentId(e.target.value)}>
                        <option value="">--Select--</option>
                        {parentOptions.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Comment:</label>
                    <input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        style={{ width: "100%" }}
                        placeholder={action === "signed out" ? `Signed out by ${leaderName || "Leader"}` : ""}
                    />
                </div>
                <ButtonRow>
                    <PrimaryButton onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </PrimaryButton>
                    <button onClick={() => onClose(false)} disabled={loading} style={{ marginLeft: 8 }}>Cancel</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}
