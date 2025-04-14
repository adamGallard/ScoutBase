import { supabase } from "@/lib/supabaseClient";

export const logAuditEvent = async ({
    userId,
    groupId,
    role,
    action,
    targetType,
    targetId = null,
    metadata = null,
}) => {
    try {
        const insertData = {
            group_id: groupId,
            role,
            action,
            target_type: targetType,
            target_id: targetId,
            metadata,
        };

        // Assign user ID to the correct field based on role
        if (role === 'parent') {
            insertData.user_parent_id = userId;
        } else {
            insertData.user_admin_id = userId;
        }

        await supabase.from('audit_logs').insert([insertData]);
    } catch (error) {
        console.error("❌ Failed to log audit event:", error.message);
    }
};