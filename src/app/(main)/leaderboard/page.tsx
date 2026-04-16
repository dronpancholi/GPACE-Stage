import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, reputation, role")
    .order("reputation", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8 border-b-2 border-black pb-6">
        <div className="w-16 h-16 bg-primary-600 border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-serif uppercase tracking-tighter text-text">Global Leaderboard</h1>
          <p className="text-sm font-bold font-sans text-text-muted mt-1 uppercase tracking-widest">TOP SCHOLARS OF THE ACADEMY</p>
        </div>
      </div>

      <div className="card bg-white divide-y-2 divide-black">
        <div className="flex px-6 py-4 bg-gray-100 text-xs font-black uppercase tracking-widest text-text-muted">
          <div className="w-16 text-center">RANK</div>
          <div className="flex-1">SCHOLAR</div>
          <div className="w-24 text-right">REP</div>
        </div>

        {users?.map((scholar, index) => (
          <div key={scholar.id} className="flex px-6 py-4 items-center hover:bg-surface-hover transition-colors group">
            <div className={`w-16 text-center font-black font-serif text-xl ${index < 3 ? 'text-primary-600' : 'text-text-muted'}`}>
              #{index + 1}
            </div>
            <div className="flex-1">
              <Link href={`/profile/${scholar.id}`} className="font-bold text-lg text-text group-hover:underline">
                {scholar.display_name}
              </Link>
              {scholar.role !== 'user' && (
                <span className="ml-3 text-[10px] font-black uppercase tracking-widest bg-black text-white px-1.5 py-0.5">
                  {scholar.role}
                </span>
              )}
            </div>
            <div className="w-24 text-right font-black font-serif text-xl text-text">
              {scholar.reputation}
            </div>
          </div>
        ))}

        {(!users || users.length === 0) && (
          <div className="px-6 py-12 text-center text-text-muted font-bold uppercase tracking-wider">
            No scholars registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
