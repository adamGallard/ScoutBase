import { useEffect } from "react";
import { signout } from "@/helpers/supabaseHelpers";

const Logout = () => {
    useEffect(() => {
        const performLogout = async () => {
            try {
                await signout();
                localStorage.clear();

                // Optional: add audit log here
                // await logAuditEvent({ ... });

                window.location.href = "/admin-login";
            } catch (err) {
                console.error("Logout error:", err);
                // Fallback redirect
                window.location.href = "/admin-login";
            }
        };

        performLogout();
    }, []);

    return <p style={{ padding: "2rem", textAlign: "center" }}>Logging you out...</p>;
};

export default Logout;
