// src/components/admin/SuperadminDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useActingGroup } from "@/hooks/useActingGroup";
import { useNavigate } from "react-router-dom";

const SuperadminDashboard = () => {
    const [groupCount, setGroupCount] = useState(0);
    const [userStats, setUserStats] = useState({});
    const { actingAsGroupId, setActingAsGroupId } = useActingGroup();
    const [groups, setGroups] = useState([]);
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
                    <h3 className="text-lg font-semibold">Total Users</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                        {Object.entries(userStats).map(([role, count]) => (
                            <li key={role}>
                                <strong>{role}</strong>: {count}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <div className="space-y-2 mt-2">
                        <button onClick={() => navigate("/admin/group-management")} className="btn btn-primary w-full">
                            Manage Groups
                        </button>
                        <button onClick={() => navigate("/admin/user-management")} className="btn btn-secondary w-full">
                            Manage Users
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
                <label className="font-medium">View as group:</label>
                <select
                    className="block mt-1 border rounded p-2 w-full"
                    value={actingAsGroupId || ''}
                    onChange={(e) => setActingAsGroupId(e.target.value || null)}
                >
                    <option value="">— Not Acting As Admin —</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default SuperadminDashboard;
