import { useState, useEffect } from "react";

export const useActingGroup = () => {
    const [actingAsGroupId, setActingAsGroupIdState] = useState(() => localStorage.getItem("actingAsGroupId") || null);
    const [actingAsAdmin, setActingAsAdminState] = useState(() => localStorage.getItem("actingAsAdmin") === 'true');

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

    return {
        actingAsGroupId,
        setActingAsGroupId,
        actingAsAdmin,
        setActingAsAdmin,
    };
};