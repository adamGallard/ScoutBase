import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/common/SharedStyles";
import { createManualBadgeOrder } from "@/helpers/terrainBadgesHelper";
import { supabase } from "@/lib/supabaseClient";
import { sections } from "@/components/common/Lookups";

export default function ManualAddBadgeModal({ groupId, userInfo, onClose, onSuccess }) {
    const [youthList, setYouthList] = useState([]);
    const [badgeList, setBadgeList] = useState([]);
    const [sectionFilter, setSectionFilter] = useState("");
    const [selectedYouth, setSelectedYouth] = useState("");
    const [selectedBadge, setSelectedBadge] = useState("");
    const [badgeTypeFilter, setBadgeTypeFilter] = useState("");
    const [projectName, setProjectName] = useState("");
    const [approvedDate, setApprovedDate] = useState("");

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
        if (!selectedYouth || !selectedBadge) return alert("Please select both a youth and badge.");

        try {
            await createManualBadgeOrder({
                youthId: selectedYouth,
                badgeId: selectedBadge,
                userId: userInfo.user_id,
                groupId,
                projectName,
                approvedDate,
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("Manual badge add failed", err);
            alert("Something went wrong adding the badge.");
        }
    };

    const filteredYouth = youthList.filter(y => !sectionFilter || y.section === sectionFilter);
    const filteredBadges = badgeList.filter(b => !badgeTypeFilter || b.type === badgeTypeFilter);
    const badgeTypes = [...new Set(badgeList.map(b => b.type))];

    const sectionLabel = code => sections.find(s => s.code === code)?.label ?? code;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h2 style={{ marginBottom: "1rem" }}>Manually Add Badge</h2>

                {/* Section Filter */}
                <label>Filter Youth by Section</label>
                <select
                    value={sectionFilter}
                    onChange={e => {
                        setSectionFilter(e.target.value);
                        setSelectedYouth(""); // Reset selection when section changes
                    }}
                    style={inputStyle}
                >
                    <option value="">-- All Sections --</option>
                    {sections.map(sec => (
                        <option key={sec.code} value={sec.code}>{sec.label}</option>
                    ))}
                </select>

                {/* Youth Dropdown */}
                <label style={{ marginTop: "1rem" }}>Youth</label>
                <select value={selectedYouth} onChange={e => setSelectedYouth(e.target.value)} style={inputStyle}>
                    <option value="">-- select --</option>
                    {filteredYouth.map(y => (
                        <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                </select>

                {/* Badge Filter */}
                <label style={{ marginTop: "1rem" }}>Filter by Badge Type</label>
                <select
                    value={badgeTypeFilter}
                    onChange={e => {
                        setBadgeTypeFilter(e.target.value);
                        setSelectedBadge(""); // Reset selection when filter changes
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
                <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                    <PrimaryButton onClick={handleSubmit}>Add to Queue</PrimaryButton>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

// Styles
const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};

const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem'
};
