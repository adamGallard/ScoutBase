import { useState, useEffect } from "react";

export const useActingGroup = () => {
    const [actingAsGroupId, setActingAsGroupIdState] = useState(
        () => localStorage.getItem("actingAsGroupId") || null
    );

    const setActingAsGroupId = (id) => {
        if (id) {
            localStorage.setItem("actingAsGroupId", id);
        } else {
            localStorage.removeItem("actingAsGroupId");
        }
        setActingAsGroupIdState(id);
    };

    return { actingAsGroupId, setActingAsGroupId };
};
