import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  User as UserIcon
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  
  const { data: posts } = await supabase
    .from("posts")
    .select(`*, subgroups ( name, slug )`)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const stats = {
    pending: posts?.filter(p => p.status === 'pending').length || 0,
    approved: posts?.filter(p => p.status === 'approved').length || 0,
    rejected: posts?.filter(p => p.status === 'rejected').length || 0,
    totalRep: profile?.reputation || 0
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12 pb-8 border-b-2 border-black">
        <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-3xl font-black border-4 border-black shadow-[4px_4px_0_0_#000]">
           {profile?.display_name?.[0].toUpperCase() || 'S'}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black font-serif uppercase tracking-tighter mb-1">Scholar Dashboard</h1>
          <p className="text-sm font-bold font-sans text-text-muted uppercase tracking-widest">
            Personal Registry for {profile?.display_name || 'Anonymous Scholar'}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-4">
           <div className="card p-4 bg-yellow-50 border-2 border-black shadow-[4px_4px_0_0_#000] text-center min-w-[120px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Rep</p>
              <p className="text-2xl font-black">{stats.totalRep}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Stats & Navigation */}
        <div className="space-y-6">
           <div className="card border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0_0_#000]">
              <div className="bg-black text-white p-3 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 className="w-4 h-4" /> Activity Overview
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-3">
                    <span className="text-xs font-bold uppercase">Approved</span>
                    <span className="text-lg font-black text-green-700">{stats.approved}</span>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-3">
                    <span className="text-xs font-bold uppercase">Pending</span>
                    <span className="text-lg font-black text-yellow-600">{stats.pending}</span>
                 </div>
                 <div className="flex justify-between items-center bg-gray-50 border-2 border-black p-3">
                    <span className="text-xs font-bold uppercase">Rejected</span>
                    <span className="text-lg font-black text-red-600">{stats.rejected}</span>
                 </div>
              </div>
           </div>

           <Link href="/notifications" className="block card border-2 border-black bg-white p-6 shadow-[4px_4px_0_0_#000] hover:bg-gray-50 transition-colors group">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <History className="w-5 h-5" />
                    <span className="font-black uppercase text-xs tracking-widest">Notification History</span>
                 </div>
                 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
           </Link>
        </div>

        {/* Right Column: Submission History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black font-serif uppercase tracking-tight flex items-center gap-2">
            <div className="w-2 h-6 bg-black" /> Personal Publications
          </h2>

          <div className="space-y-4">
             {posts && posts.length > 0 ? (
               posts.map(post => (
                 <div key={post.id} className="card border-2 border-black bg-white p-5 hover:shadow-lg transition-all relative">
                    <div className="flex justify-between items-start gap-4 mb-3">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-black uppercase text-primary-600">s/{post.subgroups.name}</span>
                           <StatusBadge status={post.status} />
                         </div>
                         <h3 className="font-bold text-lg leading-tight">{post.title || "Untitled Post"}</h3>
                       </div>
                       <Link href={`/s/${post.subgroups.slug}/${post.id}`} className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                       </Link>
                    </div>

                    {post.status === 'rejected' && post.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border-2 border-red-900 text-xs text-red-950 font-medium italic">
                        <span className="font-black uppercase tracking-widest not-italic block mb-1">Rejection Memo:</span>
                        "{post.rejection_reason}"
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t-2 border-dotted border-black flex justify-between items-center text-[10px] font-black uppercase text-text-muted tracking-widest">
                       <span>{new Date(post.created_at).toLocaleDateString()}</span>
                       <div className="flex gap-3">
                          <span>{post.upvotes} UP</span>
                          <span>{post.downvotes} DOWN</span>
                       </div>
                    </div>
                 </div>
               ))
             ) : (
               <div className="p-12 text-center border-4 border-dashed border-gray-200">
                  <p className="text-text-muted font-bold uppercase tracking-widest">No publications in record</p>
                  <Link href="/submit" className="btn-primary mt-6 inline-block">Submit First Paper</Link>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-800',
    approved: 'bg-green-100 text-green-800 border-green-800',
    rejected: 'bg-red-100 text-red-800 border-red-800'
  };

  return (
    <span className={`px-2 py-0.5 border-2 text-[10px] font-black uppercase tracking-tighter ${styles[status]}`}>
      {status}
    </span>
  );
}
