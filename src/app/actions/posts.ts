"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?error=Must be logged in to post.");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const subgroup_id = formData.get("subgroup_id") as string;

  if (content.length < 10) {
    return redirect("/submit?error=Content must be at least 10 characters long.");
  }

  if (title) {
    const { data: duplicates } = await supabase
      .from("posts")
      .select("id")
      .ilike("title", title)
      .limit(1);
    
    if (duplicates && duplicates.length > 0) {
      return redirect("/submit?error=A post with a very similar title already exists.");
    }
  }

  const is_anonymous = formData.get("is_anonymous") === "true";

  const { data: subgroup } = await supabase
    .from("subgroups")
    .select("require_approval")
    .eq("id", subgroup_id)
    .single();

  const status = subgroup?.require_approval ? 'pending' : 'approved';

  const { data, error } = await supabase.from("posts").insert([
    {
      author_id: user.id,
      subgroup_id,
      title,
      content,
      type,
      status,
      is_anonymous
    }
  ]).select('id, subgroups(slug)').single();

  if (error) {
    console.error("Post creation error", error);
    return redirect("/submit?error=Failed to create post. Internal server error.");
  }
  
  if (data?.subgroups) {
    const slug = Array.isArray(data.subgroups) ? data.subgroups[0].slug : (data.subgroups as any).slug;
    revalidatePath(`/s/${slug}`);
  }
  
  revalidatePath("/");
  
  return redirect(status === 'pending' ? "/?message=Post submitted for approval" : "/");
}
