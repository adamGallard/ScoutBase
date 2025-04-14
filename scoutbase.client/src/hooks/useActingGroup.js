import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export const useActingGroup = () => {
    const [actingAsGroupId, setActingAsGroupIdState] = useState(() => localStorage.getItem("actingAsGroupId") || null);
    const [actingAsAdmin, setActingAsAdminState] = useState(() => localStorage.getItem("actingAsAdmin") === 'true');
    const [actingGroupName, setActingGroupName] = useState(null);

    const setActingAsGroupId = (id) => {
        if (id) {
            localStorage.setItem("actingAsGroupId", id);
        } else {
            localStorage.removeItem("actingAsGroupId");
        }
        setActingAsGroupIdState(id);
    };

    const setActingAsAdmin = (flag) => {
        localStorage.setItem("actingAsAdmin", flag);
        setActingAsAdminState(flag);
    };

    useEffect(() => {
        const fetchGroupName = async () => {
            if (!actingAsGroupId) {
                setActingGroupName(null);
                return;
            }

            const { data, error } = await supabase
                .from("groups")
                .select("name")
                .eq("id", actingAsGroupId)
                .single();

            if (error) {
                console.error("Failed to fetch group name:", error.message);
                setActingGroupName(null);
            } else {
                setActingGroupName(data.name);
            }
        };

        fetchGroupName();
    }, [actingAsGroupId]);

    return {
        actingAsGroupId,
        setActingAsGroupId,
        actingAsAdmin,
        setActingAsAdmin,
        actingGroupName
    };
};
