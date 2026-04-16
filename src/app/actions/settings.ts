"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const displayName = formData.get("display_name") as string;
  const handle = formData.get("handle") as string;
  const bio = formData.get("bio") as string;
  const feedSort = formData.get("feed_sort") as string || 'hot';
  const notifyReplies = formData.get("notify_replies") === "on";
  const notifyApprovals = formData.get("notify_approvals") === "on";
  const allowAnonymous = formData.get("allow_anonymous") === "on";
  const profileVisibility = formData.get("profile_visibility") === "on";

  if (displayName && displayName.length >= 3) {
    const { error } = await supabase
      .from("users")
      .upsert({ 
        id: user.id, 
        display_name: displayName,
        handle: handle || null,
        bio: bio || null,
        feed_sort: feedSort,
        notify_replies: notifyReplies,
        notify_approvals: notifyApprovals,
        allow_anonymous: allowAnonymous,
        profile_visibility: profileVisibility,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error("Error updating profile", error);
      return redirect(`/settings?error=DB_ERROR: ${error.message}`);
    }
  } else {
    return redirect(`/settings?error=Display name must be at least 3 characters.`);
  }

  revalidatePath("/", "layout"); // Update all layouts recursively
  return redirect("/settings?success=Profile safely updated.");
}
