"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect(`/login?message=${encodeURIComponent(error.message)}`);
    }
  } catch (err: any) {
    console.error("DIAGNOSTIC: Login Fetch Failure:", err);
    if (err?.message?.includes('fetch failed')) {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return redirect(`/login?message=${encodeURIComponent(`Fetch Failed: The Vercel server cannot reach Supabase. Check Vercel Env Vars: URL(${hasUrl}), KEY(${hasKey})`)}`);
    }
    // If it's a redirect, we must re-throw it
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    return redirect(`/login?message=${encodeURIComponent(err.message || 'Unknown Error')}`);
  }

  revalidatePath("/", "layout");
  return redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Sign up using Supabase Auth
  let authData, authError;
  try {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
        emailRedirectTo: `${SITE_URL}/api/auth/callback`,
      },
    });
    authData = res.data;
    authError = res.error;
  } catch (err: any) {
    if (err?.message?.includes('fetch failed')) {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return redirect(`/login?message=${encodeURIComponent(`Fetch Failed: The Vercel server cannot reach Supabase. Check Vercel Env Vars: URL(${hasUrl}), KEY(${hasKey})`)}`);
    }
    return redirect(`/login?message=${encodeURIComponent(err.message || 'Signup Fetch Crash')}`);
  }

  if (authError) {
    return redirect(`/login?message=${encodeURIComponent(authError.message)}`);
  }

  // Resilient profile creation:
  // If the MASTER_SETUP.sql triggers are active, they will handle this automatically.
  // We use upsert here as a fallback in case triggers haven't matched yet.
  if (authData.user) {
    try {
      await supabase.from("users").upsert({ 
        id: authData.user.id, 
        display_name: displayName || email.split('@')[0] 
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Suppressible sync warning:", e);
    }
  }

  return redirect("/login?message=Verification email sent. Please check your inbox (and spam).");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
