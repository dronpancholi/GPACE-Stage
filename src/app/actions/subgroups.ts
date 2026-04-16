"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSubgroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?error=Must be logged in to create a space.");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = (formData.get("type") as string) || "open";
  const require_approval = formData.get("require_approval") === "on";

  if (!name || name.length < 3) {
    return redirect("/create-space?error=Name must be at least 3 characters.");
  }

  // Generate a very clean, URL-safe slug from the name
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Append randomness if empty or too short
  if (slug.length < 2) slug += `-${Math.floor(Math.random() * 1000)}`;

  const { error } = await supabase.from("subgroups").insert([
    {
      name,
      slug,
      description,
      require_approval,
      type
    }
  ]);

  if (error) {
    console.error("Subgroup creation error:", error);
    // Unique constraint violation (23505) means slug/name is taken
    if (error.code === '23505') {
       return redirect("/create-space?error=A space with a highly similar name already exists.");
    }
    return redirect(`/create-space?error=DB_ERROR: ${error.message}`);
  }

  // Also implicitly add the creator as a member of their own group (since they created it)
  // Not strictly required for MVP to view the group, but good practice.
  const { data: createdGroup } = await supabase.from("subgroups").select("id").eq("slug", slug).single();
  if (createdGroup) {
      await supabase.from("subgroup_members").insert([
        { user_id: user.id, subgroup_id: createdGroup.id, role: 'admin' } // The creator is admin
      ]);
  }

  // Revalidate the global layouts so the new Subgroup appears in the Left nav sidebar
  revalidatePath("/", "layout");
  
  return redirect(`/s/${slug}?success=Space successfully created.`);
}
