"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Checks if the current user has the required role to perform admin actions.
 */
async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

export async function updateUserRole(formData: FormData) {
  const admin = await checkAdminAccess();
  if (!admin) return { error: "Forbidden" };

  const supabase = await createClient();
  const targetUserId = formData.get("user_id") as string;
  const newRole = formData.get("role") as string;

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserBan(formData: FormData) {
  const admin = await checkAdminAccess();
  if (!admin) return { error: "Forbidden" };

  const supabase = await createClient();
  const targetUserId = formData.get("user_id") as string;
  const isCurrentlyBanned = formData.get("is_banned") === "true";
  const reason = formData.get("reason") as string;

  const { error } = await supabase
    .from("users")
    .update({ 
      is_banned: !isCurrentlyBanned,
      ban_reason: !isCurrentlyBanned ? reason : null 
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function resolveReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Allow both admins and moderators for reports
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return { error: "Forbidden" };
  }

  const reportId = formData.get("report_id") as string;
  const status = formData.get("status") as string; // 'resolved' or 'dismissed'

  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function submitReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to report content.");

  const postId = formData.get("post_id") as string;
  const commentId = formData.get("comment_id") as string;
  const reason = formData.get("reason") as string;

  const { error } = await supabase.from("reports").insert([{
    reporter_id: user.id,
    post_id: postId || null,
    comment_id: commentId || null,
    reason,
    status: 'open'
  }]);

  if (error) throw new Error(error.message);
}
