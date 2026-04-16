import { createClient } from "@/utils/supabase/server";
import { moderatePost } from "@/app/actions/moderation";
import { ShieldCheck, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ModerationDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Basic layout check
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
        <h1 className="text-2xl font-bold font-serif mb-2">Restricted Access</h1>
        <p className="text-text-muted">You do not have moderation privileges.</p>
      </div>
    );
  }

  const { data: pendingPosts } = await supabase
    .from("posts")
    .select(`
      *,
      subgroups ( slug, name ),
      users ( display_name )
    `)
    .eq('status', 'pending')
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-black">
        <ShieldCheck className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-bold text-text mb-1">Moderation Queue</h1>
          <p className="text-text-muted font-sans text-sm font-medium uppercase tracking-wider">Review pending content</p>
        </div>
      </div>

      <div className="space-y-6">
        {pendingPosts && pendingPosts.length > 0 ? (
          pendingPosts.map(post => (
            <div key={post.id} className="card p-6 bg-surface">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-4 uppercase tracking-widest font-bold">
                <span className="text-primary-600">s/{post.subgroups?.slug}</span>
                <span>•</span>
                <span>By {post.users?.display_name || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              
              <h3 className="text-xl font-bold font-serif mb-2">{post.title}</h3>
              <div className="text-sm text-text-muted bg-surface-hover p-4 border border-black mb-6 whitespace-pre-wrap">
                {post.content}
              </div>

              {/* Actions */}
              <div className="flex gap-4 p-4 bg-[#f8fafc] border-2 border-dashed border-gray-300">
                <form action={moderatePost} className="flex-1 flex gap-3 items-start">
                  <input type="hidden" name="post_id" value={post.id} />
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wide">Rejection Reason (if rejecting)</label>
                    <input 
                      type="text" 
                      name="rejection_reason" 
                      className="input-base text-sm" 
                      placeholder="e.g., Too short, violates subgroup rules..."
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-6">
                    <button type="submit" name="action" value="approve" className="btn-primary gap-2 bg-green-700 hover:bg-green-800 border-green-950 text-white">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button type="submit" name="action" value="reject" className="btn-secondary gap-2 text-red-700 border-red-950 hover:bg-red-50">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ))
        ) : (
           <div className="text-center py-20 card bg-surface-hover/50">
              <h3 className="text-2xl font-bold font-serif mb-2">Queue is clear</h3>
              <p className="text-text-muted">No pending posts require your approval right now.</p>
           </div>
        )}
      </div>
    </div>
  );
}
