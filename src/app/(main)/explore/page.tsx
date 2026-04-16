import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Users, Shield, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: subgroups } = await supabase
    .from("subgroups")
    .select("*")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black font-serif text-text mb-1 uppercase tracking-tighter">Directory</h1>
            <p className="text-sm font-bold font-sans tracking-wide text-text-muted uppercase">Discover structural academic domains</p>
          </div>
        </div>
        
        <Link href="/create-space" className="btn-primary gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> 
          <span className="hidden sm:inline uppercase tracking-widest font-bold">FOUND DOMAIN</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subgroups?.map((sub) => (
          <div key={sub.id} className="card p-6 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] bg-white transition-all flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-3">
                 <Link href={`/s/${sub.slug}`} className="text-xl font-black font-serif text-text uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4">
                    s/{sub.slug}
                 </Link>
                 {sub.type === 'restricted' && <span title="Restricted"><Shield className="w-5 h-5 text-yellow-600" /></span>}
              </div>
              <p className="text-sm text-text-muted mb-6 font-medium leading-relaxed font-sans">{sub.description || 'No description provided.'}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t-2 border-black">
              <span className="text-[10px] font-black bg-black text-white px-2 py-1 uppercase tracking-widest">
                {sub.type}
              </span>
              <Link href={`/s/${sub.slug}`} className="text-primary-600 text-xs font-black uppercase tracking-widest hover:text-black transition-colors">
                 ENTER &rarr;
              </Link>
            </div>
          </div>
        ))}
        {(!subgroups || subgroups.length === 0) && (
          <div className="col-span-full py-20 text-center card bg-surface-hover/50 border-dashed border-gray-300">
             <p className="font-bold text-lg font-serif">No domains registered.</p>
             <p className="text-sm text-text-muted mt-2">Become the pioneer by founding the first structural domain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
