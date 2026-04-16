"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function castVote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return; // Silent fail if not logged in

  const targetId = formData.get("target_id") as string;
  const targetType = formData.get("target_type") as string; // 'post' or 'comment'
  const voteType = formData.get("vote_type") as string; // 'upvote' or 'downvote'
  const pathname = formData.get("pathname") as string;

  // Check existing vote
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id, vote_type")
    .eq("user_id", user.id)
    .eq(targetType === 'post' ? 'post_id' : 'comment_id', targetId)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Toggle off
      await supabase.from("votes").delete().eq("id", existingVote.id);
    } else {
      // Switch vote
      await supabase.from("votes").update({ vote_type: voteType }).eq("id", existingVote.id);
    }
  } else {
    // New vote
    await supabase.from("votes").insert([{
      user_id: user.id,
      post_id: targetType === 'post' ? targetId : null,
      comment_id: targetType === 'comment' ? targetId : null,
      vote_type: voteType
    }]);
  }

  // The DB triggers should handle the actual upvote/downvote counts on the posts/comments table.
  // For the MVP, we assume triggers exist.
  
  if (pathname) {
    revalidatePath(pathname);
  } else {
    revalidatePath("/");
  }
}
