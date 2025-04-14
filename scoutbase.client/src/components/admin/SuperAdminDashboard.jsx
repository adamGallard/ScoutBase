import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useActingGroup } from "@/hooks/useActingGroup";

const SuperAdminDashboard = () => {
    const [groupCount, setGroupCount] = useState(0);
    const [userStats, setUserStats] = useState({});
    const [groups, setGroups] = useState([]);
    const { actingAsGroupId, setActingAsGroupId } = useActingGroup();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const { data: groupData } = await supabase.from("groups").select("*");
            const { data: userData } = await supabase.from("users").select("role");

            setGroupCount(groupData?.length || 0);
            setGroups(groupData || []);

            const stats = userData?.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {}) || {};

            setUserStats(stats);
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Superadmin Dashboard</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded shadow p-4">
                    <h3 className="text-lg font-semibold">Total Groups</h3>
                    <p className="text-3xl font-bold">{groupCount}</p>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h3 className="text-lg font-semibold">User Roles</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                        {Object.entries(userStats).map(([role, count]) => (
                            <li key={role}>
                                <strong>{role}</strong>: {count}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h3 className="text-lg font-semibold">Quick Links</h3>
                    <div className="space-y-2 mt-2">
                        <button onClick={() => navigate("/admin/user-management")} className="btn w-full">
                            Manage Users
                        </button>
                        <button onClick={() => navigate("/admin/group-management")} className="btn w-full">
                            Manage Groups
                        </button>
                    </div>
                </div>
            </div>

       
        </div>
    );
};

export default SuperAdminDashboard;
