"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  return redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  // Sign up using Supabase Auth
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/login?message=${error.message}`);
  }

  // Because users table is linked by trigger or manual insert, we can manually insert the user profile
  // or let Supabase triggers handle it. For this schema, we need to insert the display_name manually if we don't have a trigger set up.
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").insert([
      { id: authData.user.id, display_name: displayName }
    ]);
    if (profileError) {
      console.error("Profile creation error:", profileError);
    }
  }

  return redirect("/login?message=Check email to continue sign in process");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
