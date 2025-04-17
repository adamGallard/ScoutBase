import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PageTitle, HighlightNote } from "@/components/common/SharedStyles";
import { FileText } from "lucide-react";
import styled from "styled-components";

// Optional shared style extensions
const StyledList = styled.ul`
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 1.5rem;

  li {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    color: #1f2937;
  }
`;

const Paragraph = styled.p`
  font-size: 1rem;
  color: #374151;
  margin-bottom: 1.25rem;
`;

const StatCard = styled.div`
  flex: 1 1 250px;
  background: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 2rem;
    font-weight: 700;
  }
`;

const ReportingUserDashboard = ({ userInfo }) => {
    const [todayAttendance, setTodayAttendance] = useState(0);

    useEffect(() => {
        const fetchAttendance = async () => {
            const today = new Date().toISOString().split("T")[0];

            const { data, error } = await supabase
                .from("attendance")
                .select("id")
                .eq("group_id", userInfo?.group_id)
                .eq("event_date", today);

            if (error) {
                console.error("Failed to fetch attendance:", error.message);
                return;
            }

            setTodayAttendance(data?.length || 0);
        };

        if (userInfo?.group_id) fetchAttendance();
    }, [userInfo]);

    return (
        <div>
            <PageTitle>
                <FileText size={22} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Reporting Dashboard
            </PageTitle>

            <HighlightNote>
                Welcome, <strong>{userInfo?.name || "User"}</strong>! You are logged in as a{" "}
                <strong>Reporting User</strong>.
            </HighlightNote>

            <Paragraph>From here, you can:</Paragraph>

            <StyledList>
                <li>Access read-only reports for your Scout group</li>
                <li>View data like youth by section, age breakdown, and transitions</li>
                <li>Export summary data for use in your reporting</li>
            </StyledList>

            <Paragraph style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Use the sidebar to browse available reports.
            </Paragraph>

            <div style={{ marginTop: "2rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <StatCard>
                    <h3>Attendance Today</h3>
                    <p>{todayAttendance}</p>
                </StatCard>
            </div>
        </div>
    );
};

export default ReportingUserDashboard;
