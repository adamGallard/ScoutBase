// src/components/admin/reports/ReportYouthProjection.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PageTitle } from "@/components/common/SharedStyles";

const SECTIONS = [
    { key: "joeys", label: "Joeys", min: 5, link: 8, max: 8, next: "cubs" },
    { key: "cubs", label: "Cubs", min: 8, link: 11, max: 11, next: "scouts" },
    { key: "scouts", label: "Scouts", min: 11, link: 15, max: 15, next: "venturers" },
    { key: "venturers", label: "Venturers", min: 15, link: 18, max: 18, next: null }
];
const STAGES = [
    { key: "invested", label: "Invested" },
    { key: "linking", label: "Linking" },
    { key: "have_a_go", label: "Have a Go" },
    { key: "retiring", label: "Retiring" }
];

function getTermDates(startDate, termCount = 8) {
    const terms = [];
    let d = new Date(startDate);
    for (let i = 0; i < termCount; i++) {
        const label = `Term ${((d.getMonth() / 3 | 0) + 1)} ${d.getFullYear()}`;
        terms.push({ idx: i, label, date: new Date(d) });
        d.setMonth(d.getMonth() + 3);
    }
    return terms;
}

export default function ReportYouthProjection({ groupId }) {
    const [allTermStarts, setAllTermStarts] = useState([]);
    const [startTermIdx, setStartTermIdx] = useState(0);
    const [termCount, setTermCount] = useState(8);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manual, setManual] = useState({});
    const [termProj, setTermProj] = useState([]);

    // Dynamically build possible start terms based on earliest data
    useEffect(() => {
        async function setupTerms() {
            setLoading(true);
            // Fetch earliest transition date
            const { data: transitions = [], error } = await supabase
                .from("youth_transitions")
                .select("transition_date")
                .order("transition_date", { ascending: true })
                .limit(1);

            let minDate = new Date();
            if (!error && transitions.length) {
                minDate = new Date(transitions[0].transition_date);
            }
            // Align to term start (Jan, Apr, Jul, Oct 25)
            let firstTerm = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 3) * 3, 25);
            // Build term list up to 2 years ahead of now
            let now = new Date();
            let termList = [];
            let d = new Date(firstTerm);
            while (d < now || termList.length < 8) {
                const label = `Term ${((d.getMonth() / 3 | 0) + 1)} ${d.getFullYear()}`;
                termList.push({ label, date: new Date(d) });
                d.setMonth(d.getMonth() + 3);
            }
            setAllTermStarts(termList);
            setStartTermIdx(termList.length - 8 >= 0 ? termList.length - 8 : 0);
            setTerms(getTermDates(termList[termList.length - 8 >= 0 ? termList.length - 8 : 0].date, termCount));
            setLoading(false);
        }
        setupTerms();
        // eslint-disable-next-line
    }, []);

    // Update terms when startTermIdx or termCount changes
    useEffect(() => {
        if (allTermStarts.length > 0) {
            setTerms(getTermDates(allTermStarts[startTermIdx].date, termCount));
        }
    }, [startTermIdx, termCount, allTermStarts]);

    // Manual override handler
    const handleManual = (sec, stage, idx, val) => {
        setManual(prev => ({
            ...prev,
            [sec]: {
                ...(prev[sec] || {}),
                [stage]: {
                    ...(prev[sec]?.[stage] || {}),
                    [idx]: val,
                },
            },
        }));
    };

    // Main projection effect (cohort-based, supports manual overrides)
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setTermProj([]);
            // Fetch all youth
            const { data: youthData = [], error: youthErr } = await supabase
                .from("youth")
                .select("id, name, dob");
            if (youthErr) {
                setLoading(false);
                alert("Failed to load youth data");
                return;
            }
            // Fetch all transitions
            const { data: transitions = [], error: transErr } = await supabase
                .from("youth_transitions")
                .select("youth_id, transition_type, section, transition_date");
            if (transErr) {
                setLoading(false);
                alert("Failed to load transitions");
                return;
            }
            const startTermDate = terms[0].date;

            // 1. Build initial cohort as at startTermDate
            let cohorts = [];
            for (const youth of youthData) {
                const hisTrans = transitions
                    .filter(t => t.youth_id === youth.id && new Date(t.transition_date) <= startTermDate)
                    .sort((a, b) => new Date(a.transition_date) - new Date(b.transition_date));
                if (hisTrans.length === 0) continue;
                const last = hisTrans[hisTrans.length - 1];
                if (last.transition_type === "retired" || last.transition_type === "left") continue;
                let stageKey = "invested";
                if (["join", "joined", "have_a_go"].includes(last.transition_type)) stageKey = "have_a_go";
                else if (last.transition_type === "linking") stageKey = "linking";
                else if (last.transition_type === "retiring") stageKey = "retiring";
                // Age at term 0
                const dob = new Date(youth.dob);
                let ageAtTerm0 = (startTermDate.getFullYear() - dob.getFullYear()) +
                    (startTermDate.getMonth() - dob.getMonth()) / 12;
                if (
                    startTermDate.getMonth() < dob.getMonth() ||
                    (startTermDate.getMonth() === dob.getMonth() && startTermDate.getDate() < dob.getDate())
                ) {
                    ageAtTerm0 -= 1;
                }
                cohorts.push({
                    id: youth.id,
                    section: last.section.toLowerCase(),
                    stage: stageKey,
                    age: ageAtTerm0,
                    active: true
                });
            }

            // We'll build term projections: per-section, per-stage counts
            const tempTermProj = Array.from({ length: terms.length }, () =>
                SECTIONS.reduce((acc, s) => {
                    acc[s.key] = { invested: 0, linking: 0, have_a_go: 0, retiring: 0 };
                    return acc;
                }, {})
            );

            // 2. For each term, process cohorts (apply aging, linking, retiring, have_a_go, and manual overrides)
            let futureCohorts = cohorts.map(c => ({ ...c }));
            for (let t = 0; t < terms.length; t++) {
                // --- Tally counts (using overrides for editable fields) ---
                // Always apply manual numbers for linking/have_a_go/retiring if present, else tally by cohort
                SECTIONS.forEach(sec => {
                    // Count by default from the cohort for invested
                    tempTermProj[t][sec.key].invested =
                        futureCohorts.filter(c => c.active && c.section === sec.key && c.stage === "invested").length;

                    // Editable stages: Use manual override if present
                    ["have_a_go", "linking", "retiring"].forEach(stage => {
                        const val = manual?.[sec.key]?.[stage]?.[t];
                        if (val !== undefined && val !== "" && !isNaN(Number(val))) {
                            tempTermProj[t][sec.key][stage] = Number(val);
                        } else {
                            tempTermProj[t][sec.key][stage] =
                                futureCohorts.filter(c => c.active && c.section === sec.key && c.stage === stage).length;
                        }
                    });
                });

                // Skip forward logic after last term
                if (t === terms.length - 1) break;

                // --- Apply retirements for next term (manual trumps cohort) ---
                SECTIONS.forEach(sec => {
                    // Get all invested, sort oldest first
                    let investedCohorts = futureCohorts.filter(
                        c => c.active && c.section === sec.key && c.stage === "invested"
                    );
                    let retireCount = manual?.[sec.key]?.["retiring"]?.[t];
                    if (retireCount !== undefined && retireCount !== "" && !isNaN(Number(retireCount))) {
                        retireCount = Number(retireCount);
                    } else {
                        retireCount = investedCohorts.filter(
                            c => {
                                // Could have auto-retire by age here if wanted
                                return false; // default, none auto-retire
                            }
                        ).length;
                    }
                    // Retire N
                    investedCohorts.slice(0, retireCount).forEach(c => {
                        c.active = false;
                    });
                });

                // --- Linking for next term (manual trumps cohort, 1 term only) ---
                SECTIONS.forEach(sec => {
                    // All eligible invested for linking
                    let investedCohorts = futureCohorts.filter(
                        c => c.active && c.section === sec.key && c.stage === "invested"
                    );
                    let linkCount = manual?.[sec.key]?.["linking"]?.[t];
                    if (linkCount !== undefined && linkCount !== "" && !isNaN(Number(linkCount))) {
                        linkCount = Number(linkCount);
                    } else {
                        // Default: based on age, anyone >= section.link
                        const secObj = SECTIONS.find(s => s.key === sec.key);
                        linkCount = investedCohorts.filter(c => c.age >= secObj.link).length;
                    }
                    // Move N to linking, and into next section if any
                    investedCohorts.slice(0, linkCount).forEach(c => {
                        c.stage = "linking";
                        const secObj = SECTIONS.find(s => s.key === sec.key);
                        if (secObj && secObj.next) {
                            c.section = secObj.next;
                        }
                    });
                });

                // --- Have a Go for next term (manual trumps cohort) ---
                SECTIONS.forEach(sec => {
                    let hagCount = manual?.[sec.key]?.["have_a_go"]?.[t];
                    if (hagCount !== undefined && hagCount !== "" && !isNaN(Number(hagCount))) {
                        hagCount = Number(hagCount);
                    } else {
                        hagCount = futureCohorts.filter(
                            c => c.active && c.section === sec.key && c.stage === "have_a_go"
                        ).length;
                    }
                    // All have_a_go youth become invested next term (in this section)
                    let hagCohorts = futureCohorts.filter(
                        c => c.active && c.section === sec.key && c.stage === "have_a_go"
                    );
                    hagCohorts.slice(0, hagCount).forEach(c => {
                        c.stage = "invested";
                    });
                });

                // --- Age everyone up ---
                futureCohorts.forEach(c => {
                    if (!c.active) return;
                    c.age += 0.25;
                    // Linking only lasts one term, then becomes invested
                    if (c.stage === "linking") c.stage = "invested";
                });
            }
            setTermProj(tempTermProj);
            setLoading(false);
        }
        if (terms.length > 0) fetchData();
        // eslint-disable-next-line
    }, [groupId, terms.length, terms[0]?.date, manual]);

    function getInputValue(sec, stage, idx) {
        // Show manual value if present (even 0!), else fallback to projection (for inputs)
        const manualVal = manual?.[sec]?.[stage]?.[idx];
        if (manualVal !== undefined && manualVal !== "") {
            return manualVal;
        }
        // For inputs, fallback to projection
        return termProj[idx]?.[sec]?.[stage] ?? "";
    }
    function getCell(sec, stage, idx) {
        // Use manual override if present, else the projected count
        return manual?.[sec]?.[stage]?.[idx] !== undefined && manual[sec][stage][idx] !== ""
            ? manual[sec][stage][idx]
            : termProj[idx]?.[sec]?.[stage] ?? 0;
    }

    return (
        <div className="content-box">
            <PageTitle>Youth Section Projections</PageTitle> 
            <div style={{ background: "#ffe3e3", color: "#b91c1c", padding: "12px 16px", borderRadius: 6, marginBottom: 16, fontWeight: 600 }}>
                ⚠️ This report is a work in progress and may not reflect actual projections.
            </div>
            {loading ? (
                <p>Loading…</p>
            ) : (
                <>
                    <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
                        <label>
                            Start Term:{" "}
                            <select
                                value={startTermIdx}
                                onChange={e => setStartTermIdx(Number(e.target.value))}
                            >
                                {allTermStarts.map((t, idx) => (
                                    <option key={t.label} value={idx}>{t.label}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Number of Terms:{" "}
                            <select
                                value={termCount}
                                onChange={e => setTermCount(Number(e.target.value))}
                            >
                                {[4, 8, 12, 16, 20].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <table style={{ borderCollapse: "collapse", width: "100%", background: "#fff", fontSize: 15 }}>
                        <thead>
                            <tr>
                                <th style={{ padding: 8, border: "1px solid #eee" }}>Section</th>
                                <th style={{ padding: 8, border: "1px solid #eee" }}>Stage</th>
                                {terms.map((t) => (
                                    <th key={t.idx} style={{ padding: 8, border: "1px solid #eee" }}>
                                        {t.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SECTIONS.map((sec) => (
                                <React.Fragment key={sec.key}>
                                    <tr style={{ background: "#f1f5f9" }}>
                                        <td
                                            style={{
                                                padding: 8,
                                                border: "1px solid #eee",
                                                fontWeight: "bold",
                                                verticalAlign: "top",
                                            }}
                                            rowSpan={STAGES.length}
                                        >
                                            {sec.label}
                                        </td>
                                        <td style={{ padding: 8, border: "1px solid #eee" }}>{STAGES[0].label}</td>
                                        {terms.map((t, idx) => (
                                            <td key={idx} style={{ padding: 8, border: "1px solid #eee" }}>
                                                {getCell(sec.key, "invested", idx)}
                                            </td>
                                        ))}
                                    </tr>
                                    {STAGES.slice(1).map((stage) => (
                                        <tr key={stage.key}>
                                            <td style={{ padding: 8, border: "1px solid #eee" }}>{stage.label}</td>
                                            {terms.map((t, idx) => (
                                                <td key={idx} style={{ padding: 8, border: "1px solid #eee" }}>
                                                    {["have_a_go", "retiring", "linking"].includes(stage.key) ? (
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            style={{ width: 48 }}
                                                            value={getInputValue(sec.key, stage.key, idx)}
                                                            onChange={e => handleManual(sec.key, stage.key, idx, e.target.value)}
                                                        />
                                                    ) : (
                                                        getCell(sec.key, stage.key, idx)
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
