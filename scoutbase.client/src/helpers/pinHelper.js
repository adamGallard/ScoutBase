import { getParentSupabaseClient } from "@/lib/parentSupabaseClient";
import bcrypt from "bcryptjs";

const supabase = getParentSupabaseClient();

export async function resetParentPin(parentId, rawPin) {
    const hashedPin = await bcrypt.hash(rawPin, 10); // 10 salt rounds is secure and fast

    const { error } = await supabase
        .from("parent")
        .update({ pin_hash: hashedPin })
        .eq("id", parentId);

    return error ? { success: false, error } : { success: true };
}
