import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key || !url.startsWith("http")) {
    console.error("DIAGNOSTIC: Supabase environment variables are missing or malformed!", { 
      hasUrl: !!url, 
      hasKey: !!key,
      isValidUrl: url?.startsWith("http") 
    });
    // We return a client that will fail on individual calls but won't crash the whole JS instantiation phase
    return createServerClient("https://missing.supabase.co", "missing", { cookies: { getAll: () => [], setAll: () => {} } });
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handled in middleware
        }
      },
    },
  });
}
