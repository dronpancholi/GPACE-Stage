"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function moderatePost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login?error=Unauthorized");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return redirect("/mod?error=Forbidden: Not a moderator");
  }

  const postId = formData.get("post_id") as string;
  const action = formData.get("action") as string; // 'approve' or 'reject'
  const reason = formData.get("rejection_reason") as string;

  if (action === 'approve') {
    await supabase.from("posts").update({ status: 'approved' }).eq("id", postId);
    
    // Notify user optionally
    const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", postId).single();
    if (post) {
      await supabase.from("notifications").insert([{
        user_id: post.author_id,
        type: 'post_approved',
        post_id: postId,
        message: `Your post "${post.title}" was approved.`
      }]);
    }

  } else if (action === 'reject') {
    await supabase.from("posts").update({ 
      status: 'rejected',
      rejection_reason: reason || "Did not meet guidelines."
    }).eq("id", postId);

    // Notify user
    const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", postId).single();
    if (post) {
      await supabase.from("notifications").insert([{
        user_id: post.author_id,
        type: 'post_rejected',
        post_id: postId,
        message: `Your post "${post.title}" was rejected. Reason: ${reason}`
      }]);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/");
}
