import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Compass, Trophy, LogOut, Settings, User as UserIcon, AlertTriangle } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth check failed or no user:", authError);
      return redirect("/login");
    }

    // Fetch navigation data safely
    const { data: subgroups } = await supabase.from("subgroups").select("id, name, slug").order('name');
    const { data: profile } = await supabase.from("users").select("display_name, reputation").eq('id', user.id).maybeSingle();
    const { data: topScholars } = await supabase.from("users").select("id, display_name, reputation").order("reputation", { ascending: false }).limit(5);

    return (
      <div className="flex min-h-screen bg-background">
        <aside className="w-64 fixed inset-y-0 left-0 border-r-2 border-black bg-surface flex flex-col hidden md:flex">
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 flex items-center justify-center text-white font-serif font-black text-xl border-2 border-black shadow-[2px_2px_0_0_#000]">G</div>
              <h1 className="text-xl font-black font-serif text-text tracking-tighter uppercase">GPACE Stage</h1>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            <div className="border-b-2 border-black">
              <Link href="/" className="flex items-center gap-3 px-6 py-4 font-bold tracking-wide border-b-2 border-black hover:bg-surface-hover transition-colors"><Home className="w-5 h-5" /> HOME</Link>
              <Link href="/explore" className="flex items-center gap-3 px-6 py-4 font-bold tracking-wide border-b-2 border-black hover:bg-surface-hover transition-colors"><Compass className="w-5 h-5" /> EXPLORE</Link>
              <Link href="/leaderboard" className="flex items-center gap-3 px-6 py-4 font-bold tracking-wide border-b-2 border-black hover:bg-surface-hover transition-colors"><Trophy className="w-5 h-5" /> LEADERBOARD</Link>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <span className="text-xs font-black uppercase tracking-widest text-text-muted">SPACES</span>
                <Link href="/create-space" className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 tracking-widest">+ NEW</Link>
              </div>
              <div className="space-y-1">
                {subgroups?.map(sub => (
                  <Link key={sub.id} href={`/s/${sub.slug}`} className="block px-3 py-2 text-sm font-bold border-2 border-transparent hover:border-black transition-all">s/{sub.slug}</Link>
                ))}
              </div>
            </div>
          </nav>
          <div className="border-t-2 border-black bg-white p-4">
             <div className="bg-gray-50 border-2 border-black p-3 flex justify-between items-center mb-2">
               <div className="truncate"><div className="font-black text-xs uppercase">{profile?.display_name || "Scholar"}</div></div>
               <form action={signOut}><button className="p-1 hover:bg-black hover:text-white transition-colors"><LogOut className="w-4 h-4" /></button></form>
             </div>
             <div className="flex gap-2">
               <Link href={`/profile/${user.id}`} className="flex-1 py-1 text-[10px] font-black uppercase text-center border-2 border-black hover:bg-black hover:text-white">Profile</Link>
               <Link href="/settings" className="flex-1 py-1 text-[10px] font-black uppercase text-center border-2 border-black hover:bg-black hover:text-white">Settings</Link>
             </div>
          </div>
        </aside>
        <main className="flex-1 md:ml-64 mr-0 lg:mr-80 min-h-screen border-r-2 border-black">{children}</main>
        <aside className="w-80 fixed inset-y-0 right-0 hidden lg:flex flex-col bg-surface p-8 overflow-y-auto">
          <div className="border-2 border-black shadow-[4px_4px_0_0_#000] bg-white p-6">
             <h2 className="font-black font-serif text-xl border-b-2 border-black pb-4 mb-6 uppercase">Top Scholars</h2>
             <div className="space-y-4">
               {topScholars?.map((s, i) => (
                 <Link key={s.id} href={`/profile/${s.id}`} className="flex justify-between items-center font-bold text-xs truncate">
                    <span>#{i+1} {s.display_name}</span>
                    <span className="bg-gray-100 border-2 border-black px-1.5">{s.reputation}</span>
                 </Link>
               ))}
             </div>
          </div>
        </aside>
      </div>
    );
  } catch (error: any) {
    // If the error is a Next.js redirect or notFound, we must re-throw it 
    // so Next.js can handle the navigation logic.
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.digest?.startsWith('NEXT_NOT_FOUND')) {
      throw error;
    }

    console.error("FATAL: MainLayout Render Crash", error);
    return (
      <div className="p-20 text-center font-mono">
        <AlertTriangle className="mx-auto w-12 h-12 mb-4 text-red-600" />
        <h1 className="text-xl font-bold mb-2">Layout Rendering Exception</h1>
        <p className="text-sm text-gray-600 mb-8">The main structural component encountered a fatal error during generation.</p>
        <div className="p-4 bg-gray-50 border border-black inline-block text-left text-xs max-w-sm overflow-auto">
          <code>{String(error)}</code>
        </div>
      </div>
    );
  }
}
