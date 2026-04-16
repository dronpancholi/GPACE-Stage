"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be logged in to comment.");
  }

  const postId = formData.get("post_id") as string;
  const content = formData.get("content") as string;
  const slug = formData.get("slug") as string;

  if (!content || content.length < 2) {
    throw new Error("Comment is too short.");
  }

  const { data: comment, error } = await supabase.from("comments").insert([
    {
      post_id: postId,
      author_id: user.id,
      content,
    }
  ]).select('id').single();

  if (error) {
    console.error("Comment error", error);
    throw new Error("Failed to post comment.");
  }

  // Notify post author
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, title")
    .eq("id", postId)
    .single();

  if (post && post.author_id !== user.id) {
    await supabase.from("notifications").insert([{
      user_id: post.author_id,
      type: 'comment_reply',
      post_id: postId,
      message: `Someone commented on your post: "${post.title}"`
    }]);
  }

  revalidatePath(`/s/${slug}/${postId}`);
  revalidatePath("/notifications");
}
