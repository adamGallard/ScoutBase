import { useEffect, useState } from "react";
import { ModalOverlay, ModalBox, ButtonRow, PrimaryButton } from "@/components/common/SharedStyles";
import { createManualBadgeOrder } from "@/helpers/terrainBadgesHelper";
import { supabase } from "@/lib/supabaseClient";
import { sections } from "@/components/common/Lookups";

export default function ManualAddBadgeModal({ groupId, userInfo, onClose, onSuccess }) {
    const [youthList, setYouthList] = useState([]);
    const [badgeList, setBadgeList] = useState([]);
    const [sectionFilter, setSectionFilter] = useState("");
    const [selectedYouth, setSelectedYouth] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState("");
    const [badgeTypeFilter, setBadgeTypeFilter] = useState("");
    const [projectName, setProjectName] = useState("");
    const [approvedDate, setApprovedDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: youth, error: yErr } = await supabase
                .from("youth")
                .select("id, name, section")
                .eq("group_id", groupId);

            const { data: badges, error: bErr } = await supabase
                .from("badges_catalog")
                .select("id, label, type")
                .eq("active", true)
                .order("label");

            if (yErr || bErr) {
                console.error("Error loading dropdown data", { yErr, bErr });
            }

            setYouthList((youth || []).sort((a, b) => a.name.localeCompare(b.name)));
            setBadgeList(badges || []);
        };

        fetchData();
    }, [groupId]);

    const handleSubmit = async () => {
        if (!selectedYouth.length || !selectedBadge) return alert("Please select at least one youth and a badge.");

        setLoading(true);
        try {
            await Promise.all(selectedYouth.map(youthId =>
                createManualBadgeOrder({
                    youthId,
                    badgeId: selectedBadge,
                    userId: userInfo.user_id,
                    groupId,
                    projectName,
                    approvedDate,
                    badgeList,   // NEW: Pass in the loaded lists!
                    youthList
                })
            ));
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("Manual badge add failed", err);
            alert("Something went wrong adding the badge.");
        }
        setLoading(false);
    };

    const filteredYouth = youthList.filter(y => !sectionFilter || y.section === sectionFilter);
    const filteredBadges = badgeList.filter(b => !badgeTypeFilter || b.type === badgeTypeFilter);
    const badgeTypes = [...new Set(badgeList.map(b => b.type))];

    return (
        <ModalOverlay>
            <ModalBox>
                <h3 style={{ marginBottom: "1rem" }}>Manually Add Badge</h3>

                {/* Section Filter */}
                <label>Filter Youth by Section</label>
                <select
                    value={sectionFilter}
                    onChange={e => {
                        setSectionFilter(e.target.value);
                        setSelectedYouth([]); // Reset selection when section changes
                    }}
                    style={inputStyle}
                >
                    <option value="">-- All Sections --</option>
                    {sections.map(sec => (
                        <option key={sec.code} value={sec.code}>{sec.label}</option>
                    ))}
                </select>

                {/* Youth Multi-Select */}
                <label style={{ marginTop: "1rem" }}>Youth (select one or more)</label>
                <select
                    multiple
                    value={selectedYouth}
                    onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setSelectedYouth(options);
                    }}
                    style={{ ...inputStyle, height: Math.max(48, 24 * Math.min(5, filteredYouth.length)) }}
                >
                    {filteredYouth.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                </select>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple
                </div>

                {/* Badge Filter */}
                <label style={{ marginTop: "1rem" }}>Filter by Badge Type</label>
                <select
                    value={badgeTypeFilter}
                    onChange={e => {
                        setBadgeTypeFilter(e.target.value);
                        setSelectedBadge("");
                    }}
                    style={inputStyle}
                >
                    <option value="">-- All Types --</option>
                    {badgeTypes.map(type => (
                        <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                    ))}
                </select>

                {/* Badge Dropdown */}
                <label style={{ marginTop: "1rem" }}>Badge</label>
                <select value={selectedBadge} onChange={e => setSelectedBadge(e.target.value)} style={inputStyle}>
                    <option value="">-- select --</option>
                    {filteredBadges.map(b => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                </select>

                {/* Optional Fields */}
                <label style={{ marginTop: "1rem" }}>Project Name (optional)</label>
                <input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g., Environmental Action"
                    style={inputStyle}
                />

                <label style={{ marginTop: "1rem" }}>Approved Date (optional)</label>
                <input
                    type="date"
                    value={approvedDate}
                    onChange={e => setApprovedDate(e.target.value)}
                    style={inputStyle}
                />

                {/* Actions */}
                <ButtonRow>
                    <PrimaryButton onClick={handleSubmit} disabled={loading}>
                        {loading ? "Adding..." : "Add to Queue"}
                    </PrimaryButton>
                    <button type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem'
};
