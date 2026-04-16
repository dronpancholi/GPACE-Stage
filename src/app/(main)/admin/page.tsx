import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Flag, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  LayoutDashboard,
  UserCog
} from "lucide-react";
import { moderatePost } from "@/app/actions/moderation";
import { updateUserRole, toggleUserBan, resolveReport } from "@/app/actions/admin";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export const dynamic = "force-dynamic";

export default async function AdminPanel({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
        <h1 className="text-2xl font-bold font-serif mb-2">Restricted Area</h1>
        <p className="text-text-muted">Academic Administrative privileges required.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Return Home</Link>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <div className="bg-black p-3 text-white">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-serif text-text uppercase tracking-tighter">Admin Panel</h1>
            <p className="text-sm font-bold font-sans text-text-muted uppercase tracking-widest mt-1">
              System Control & Moderation Bureau
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black ${isAdmin ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
             {profile.role} ACCESS
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-2">
          <TabLink active={tab === "overview"} href="/admin?tab=overview" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" />
          <TabLink active={tab === "moderation"} href="/admin?tab=moderation" icon={<ShieldCheck className="w-4 h-4" />} label="Moderation Queue" />
          <TabLink active={tab === "reports"} href="/admin?tab=reports" icon={<Flag className="w-4 h-4" />} label="Community Reports" />
          {isAdmin && (
            <TabLink active={tab === "users"} href="/admin?tab=users" icon={<Users className="w-4 h-4" />} label="User Management" />
          )}
        </nav>

        {/* Main Content Area */}
        <div className="md:col-span-3 min-h-[500px]">
          {tab === "overview" && <OverviewTab supabase={supabase} />}
          {tab === "moderation" && <ModerationTab supabase={supabase} />}
          {tab === "reports" && <ReportsTab supabase={supabase} />}
          {tab === "users" && isAdmin && <UsersTab supabase={supabase} />}
        </div>
      </div>
    </div>
  );
}

function TabLink({ active, href, icon, label }: { active: boolean; href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 font-bold uppercase tracking-wide text-xs border-2 transition-all ${
        active 
          ? 'bg-black text-white border-black shadow-[4px_4px_0_0_#000] translate-x-[-2px] translate-y-[-2px]' 
          : 'bg-white text-text border-black hover:bg-gray-50'
      }`}
    >
      {icon} {label}
    </Link>
  );
}

async function OverviewTab({ supabase }: { supabase: any }) {
  const { count: userCount } = await supabase.from("users").select('*', { count: 'exact', head: true });
  const { count: postCount } = await supabase.from("posts").select('*', { count: 'exact', head: true });
  const { count: pendingCount } = await supabase.from("posts").select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: reportCount } = await supabase.from("reports").select('*', { count: 'exact', head: true }).eq('status', 'open');

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-xl font-black font-serif uppercase mb-6 tracking-tight flex items-center gap-2">
        <div className="w-2 h-6 bg-black"></div> System Health
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Scholars" value={userCount} color="bg-blue-50" border="border-blue-900" />
        <StatCard label="Total Publications" value={postCount} color="bg-gray-50" border="border-black" />
        <StatCard label="Pending Approval" value={pendingCount} color="bg-yellow-50" border="border-yellow-900" highlight={pendingCount > 0} />
        <StatCard label="Open Reports" value={reportCount} color="bg-red-50" border="border-red-900" highlight={reportCount > 0} />
      </div>

      <div className="mt-8 card p-6 border-2 border-black bg-white">
          <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Admin Notice</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Welcome to the GPACE Stage Command Bureau. Ensure all academic discussions adhere to university guidelines. 
            Prioritize the **Moderation Queue** to keep the feed fresh with approved scholarly content.
          </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, border, highlight }: { label: string; value: number; color: string; border: string; highlight?: boolean }) {
  return (
    <div className={`p-6 border-2 ${border} ${color} shadow-[4px_4px_0_0_#000]`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className={`text-4xl font-black font-sans ${highlight ? 'animate-pulse' : ''}`}>{value}</p>
    </div>
  );
}

async function ModerationTab({ supabase }: { supabase: any }) {
  const { data: pendingPosts } = await supabase
    .from("posts")
    .select(`*, subgroups ( name ), users ( display_name )`)
    .eq('status', 'pending')
    .order("created_at", { ascending: true });

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-black font-serif uppercase mb-6 tracking-tight">Post Approval Queue</h2>
      <div className="space-y-4">
        {pendingPosts && pendingPosts.length > 0 ? (
          pendingPosts.map((post: any) => (
            <div key={post.id} className="card p-5 bg-white border-2 border-black">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase text-primary-600">s/{post.subgroups?.name}</p>
                    {post.is_anonymous && (
                      <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 font-black uppercase tracking-tighter">🕵️ Anonymous</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg leading-tight">{post.title}</h3>
                  <p className="text-xs text-text-muted">By {post.users?.display_name} • {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-black text-sm text-text-muted line-clamp-2 mb-4 italic">
                "{post.content}"
              </div>
              <form action={moderatePost} className="flex flex-wrap gap-2">
                <input type="hidden" name="post_id" value={post.id} />
                <input type="text" name="rejection_reason" placeholder="Reason if rejecting..." className="input-base text-xs flex-1 min-w-[200px]" />
                <FormSubmitButton name="action" value="approve" className="btn-primary text-xs bg-green-700 border-green-900" pendingText="Approving...">
                  Approve
                </FormSubmitButton>
                <FormSubmitButton name="action" value="reject" className="btn-secondary text-xs text-red-700 border-red-900" pendingText="Rejecting...">
                  Reject
                </FormSubmitButton>
              </form>
            </div>
          ))
        ) : (
          <p className="text-center py-12 text-text-muted font-bold uppercase tracking-widest bg-gray-50 border-2 border-dashed border-gray-300">Queue is clear</p>
        )}
      </div>
    </div>
  );
}

async function ReportsTab({ supabase }: { supabase: any }) {
  const { data: reports } = await supabase
    .from("reports")
    .select(`*, posts ( title ), users!reports_reporter_id_fkey ( display_name )`)
    .eq('status', 'open')
    .order("created_at", { ascending: false });

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-black font-serif uppercase mb-6 tracking-tight">Open Community Reports</h2>
      <div className="space-y-4">
        {reports && reports.length > 0 ? (
          reports.map((report: any) => (
            <div key={report.id} className="card p-5 bg-white border-2 border-red-200">
               <div className="flex items-center gap-2 mb-3">
                 <Flag className="w-4 h-4 text-red-600" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Active Flag</span>
               </div>
               <p className="text-sm font-bold mb-1">Reported Issue:</p>
               <p className="text-sm text-text-muted bg-red-50 p-3 border border-red-100 rounded mb-4 italic">"{report.reason}"</p>
               
               <div className="text-xs text-text-muted flex gap-3 mb-6">
                 <span>Reporter: <b>{report.users?.display_name || 'Anonymous'}</b></span>
                 <span>Target: <b>{report.posts?.title || 'Comment'}</b></span>
               </div>

               <form action={async (f) => { await resolveReport(f); }} className="flex gap-2">
                 <input type="hidden" name="report_id" value={report.id} />
                 <FormSubmitButton name="status" value="resolved" className="btn-primary text-xs" pendingText="...">
                   Mark Resolved
                 </FormSubmitButton>
                 <FormSubmitButton name="status" value="dismissed" className="btn-ghost text-xs border border-black" pendingText="...">
                   Dismiss
                 </FormSubmitButton>
               </form>
            </div>
          ))
        ) : (
          <p className="text-center py-12 text-text-muted font-bold uppercase tracking-widest bg-gray-50 border-2 border-dashed border-gray-300">No active reports</p>
        )}
      </div>
    </div>
  );
}

async function UsersTab({ supabase }: { supabase: any }) {
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-black font-serif uppercase mb-6 tracking-tight">User Directory</h2>
      <div className="card overflow-hidden border-2 border-black">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-sm">{u.display_name}</div>
                  <div className="text-[10px] text-text-muted">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                </td>
                <td className="p-3">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-800' : u.role === 'moderator' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                     {u.role}
                   </span>
                </td>
                <td className="p-3 text-right">
                   <div className="flex justify-end gap-2">
                     <form action={async (f) => { await updateUserRole(f); }}>
                       <input type="hidden" name="user_id" value={u.id} />
                       <select name="role" onChange={(e) => e.target.form?.requestSubmit()} className="text-[10px] border border-black font-bold p-1">
                          <option value="user" selected={u.role === 'user'}>USER</option>
                          <option value="moderator" selected={u.role === 'moderator'}>MOD</option>
                          <option value="admin" selected={u.role === 'admin'}>ADMIN</option>
                       </select>
                     </form>
                     <form action={async (f) => { await toggleUserBan(f); }}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="is_banned" value={String(u.is_banned)} />
                        <FormSubmitButton className={`text-[10px] font-black p-1 border border-black ${u.is_banned ? 'bg-black text-white' : 'bg-white text-black'}`} pendingText="...">
                           {u.is_banned ? 'UNBAN' : 'BAN'}
                        </FormSubmitButton>
                     </form>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
