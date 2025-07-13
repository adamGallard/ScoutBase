import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Key, Edit2, UserCircle } from "lucide-react";
import { PrimaryButton, ModalOverlay, ModalBox, ButtonRow, PageWrapperParent, PageTitle } from "@/components/common/SharedStyles";
import { supabase } from "@/lib/supabaseClient";
import { resetParentPin } from "@/helpers/authHelper"; // Adjust import path as needed

export default function ParentProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    // Try to get parent & groupId from location state
    const parentFromState = location.state?.parent;
    const groupId = location.state?.groupId;

    // Local states
    const [parent, setParent] = useState(parentFromState || null);
    const [editMode, setEditMode] = useState(false);
    const [editValues, setEditValues] = useState(parentFromState || {});
    const [loading, setLoading] = useState(!parentFromState);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinSuccess, setPinSuccess] = useState(false);

    // Fetch parent from DB if not in state, or after updates
    useEffect(() => {
        async function fetchParent(id) {
            setLoading(true);
            const { data } = await supabase.from("parent").select("*").eq("id", id).single();
            setParent(data);
            setEditValues(data || {});
            setLoading(false);
        }
        if (!parentFromState && location.state?.parentId) {
            fetchParent(location.state.parentId);
        } else if (parentFromState) {
            setParent(parentFromState);
            setEditValues(parentFromState);
            setLoading(false);
        }
    }, [parentFromState, location.state]);

    // Save profile changes
    async function handleSave() {
        setLoading(true);
        const toUpdate = filterEditableFields(editValues);

        const { error } = await supabase
            .from("parent")
            .update(toUpdate)
            .eq("id", parent.id);
        console.log("Updating parent with payload:", toUpdate);
        if (!error) {
            setParent({ ...parent, ...toUpdate });
            setEditMode(false);
        } else {
            alert("Failed to update profile.");
        }
        setLoading(false);
    }
    function filterEditableFields(obj) {
        const editable = [
            "name",
            "phone",
            "email",
            "skills",
            "interests_hobbies",
            "comments"
        ];
        const out = {};
        for (const k of editable) {
            if (obj[k] !== undefined) out[k] = obj[k];
        }
        return out;
    }

    function handleChange(e) {
        setEditValues({ ...editValues, [e.target.name]: e.target.value });
    }

    // Pin change logic
    async function handleChangePin(newPin) {
        // Example: save hashed pin, adjust logic for real use
        await supabase
            .from("parent")
            .update({ pin: newPin }) // hash if needed
            .eq("id", parentId);
        alert("PIN changed!");
        setShowPinModal(false);
    }

    function handleSignOut() {
        // Your real sign-out/auth logic here
        navigate("/parent/signin", { replace: true });
    }

    if (loading) return <div>Loading...</div>;
    if (!parent) return <div>No profile found.</div>;

    if (loading) return <div>Loading...</div>;
    if (!parent) return <div>No profile found.</div>;
    return (
        <PageWrapperParent style={{ padding: '0rem', paddingBottom: '20px' }}>
            <PageTitle><UserCircle /> Profile</PageTitle>
            {pinSuccess && (
                <div style={{
                    background: "#e0fbe4",
                    color: "#217a39",
                    padding: "12px 20px",
                    borderRadius: 8,
                    margin: "16px 0",
                    textAlign: "center",
                    fontWeight: "bold"
                }}>
                    PIN changed successfully!
                </div>
            )}
            
            {!editMode ? (
                <>
                    <ProfileRow label="Name" value={parent.name} />
                    <ProfileRow label="Email" value={parent.email} />
                    <ProfileRow label="Phone" value={parent.phone} />
                    <ProfileRow label="Skills" value={parent.skills} />
                    <ProfileRow label="Hobbies" value={parent.interests_hobbies} />
                    <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                        <PrimaryButton onClick={() => setEditMode(true)}>
                            <Edit2 size={18} style={{ marginRight: 6 }} /> Edit Details
                        </PrimaryButton>
                        <PrimaryButton onClick={() => setShowPinModal(true)}>
                            <Key size={18} style={{ marginRight: 6 }} /> Change PIN
                        </PrimaryButton>
                        <PrimaryButton onClick={handleSignOut} style={{ background: "#eee", color: "#b91c1c" }}>
                            <LogOut size={18} style={{ marginRight: 6 }} /> Sign Out
                        </PrimaryButton>
                    </div>
                </>
            ) : (
                    <>
                        <ProfileRow label="Name" value={parent.name} />
                    <EditField label="Email" name="email" value={editValues.email || ""} onChange={handleChange} />
                        <EditField label="Phone" name="phone" value={editValues.phone || ""} onChange={handleChange} />
                        <p style={{ fontSize: "0.92em", color: "#555", marginBottom: 8 }}>
                            Tip: List multiple skills or hobbies by using commas, e.g. <em>"First Aid, Cooking, Gardening"</em>
                        </p>
                    <EditField label="Skills" name="skills" value={editValues.skills || ""} onChange={handleChange} />
                        <EditField label="Hobbies" name="interests_hobbies" value={editValues.interests_hobbies || ""} onChange={handleChange} />
                    <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                        <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
                        <button onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                </>
            )}

            {showPinModal && (
                <PinChangeModal
                    parentId={parent.id}
                    onSave={() => {
                        setShowPinModal(false);
                        setPinSuccess(true); // show the success message
                    }}
                    onCancel={() => setShowPinModal(false)}
                />
            )}
        </PageWrapperParent>
    );
}

function ProfileRow({ label, value }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <strong style={{ width: 80, display: "inline-block" }}>{label}:</strong>
            <span style={{ marginLeft: 8 }}>{value || <span style={{ color: "#aaa" }}>Not set</span>}</span>
        </div>
    );
}

function EditField({ label, name, value, onChange }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 4 }}>{label}:</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ddd"
                }}
            />
        </div>
    );
}

// Modal logic reused from previous example
function PinChangeModal({ parentId, onSave, onCancel }) {
    const [pin, setPin] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSave() {
        setSaving(true);
        setError("");
        const result = await resetParentPin(parentId, pin);
        setSaving(false);
        if (result.success) {
            onSave(pin);
        } else {
            setError(result.error || "Failed to update PIN.");
        }
    }

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Change PIN</h3>
                <div style={{ margin: "16px 0" }}>
                    <label>New PIN:</label>
                    <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", marginTop: 6 }}
                        maxLength={6}
                    />
                </div>
                {error && <div style={{ color: "red" }}>{error}</div>}
                <ButtonRow>
                    <PrimaryButton onClick={handleSave} disabled={saving}>Save</PrimaryButton>
                    <button onClick={onCancel} style={{ marginLeft: 12 }}>Cancel</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}