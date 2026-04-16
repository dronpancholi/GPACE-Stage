import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { Trophy, CalendarDays, ShieldCheck } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return notFound();

  // Fetch users posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`*, subgroups(slug, name), users(display_name)`)
    .eq("author_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // Fetch users comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`*, posts(id, title, subgroups(slug)), users(display_name)`)
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  // Get user rank
  const { count: rankCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("reputation", profile.reputation);
  
  const rank = (rankCount !== null ? rankCount + 1 : 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-8 mb-10 bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
             <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-black font-serif uppercase tracking-tighter text-text">{profile.display_name}</h1>
               {profile.role !== 'user' && (
                 <span className="bg-primary-600 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 flex items-center gap-1 border-2 border-black">
                   <ShieldCheck className="w-3 h-3" /> {profile.role}
                 </span>
               )}
             </div>
             
             <div className="flex items-center gap-4 text-sm font-bold text-text-muted uppercase tracking-wide">
               <div className="flex items-center gap-1.5 border-r-2 border-black pr-4">
                 <CalendarDays className="w-4 h-4" /> Joined {new Date(profile.created_at).toLocaleDateString()}
               </div>
               <div className="flex items-center gap-1.5 text-primary-600">
                 Rank #{rank}
               </div>
             </div>
          </div>

          <div className="bg-yellow-100 border-2 border-black p-4 text-center min-w-[120px]">
             <div className="text-xs font-black uppercase tracking-widest text-yellow-800 mb-1 flex justify-center items-center gap-1">
               <Trophy className="w-3 h-3" /> REPUTATION
             </div>
             <div className="text-3xl font-black font-serif text-black">
               {profile.reputation}
             </div>
          </div>
        </div>
        
        {profile.bio && (
          <div className="mt-6 pt-6 border-t-2 border-black">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 font-sans">Biography</h3>
            <p className="text-sm text-text leading-relaxed font-sans">{profile.bio}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-black font-serif uppercase tracking-tight border-b-2 border-black pb-4 mb-6">
            Core Contributions
          </h2>

          <div className="space-y-6">
            {posts && posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-10 px-4 border-2 border-dashed border-black bg-white">
                <h3 className="font-bold text-lg font-serif">Awaiting Contribution</h3>
                <p className="text-text-muted text-sm mt-2">This scholar hasn't added to the public corpus yet.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black font-serif uppercase tracking-tight border-b-2 border-black pb-4 mb-6">
            Recent Discourse
          </h2>

          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="p-4 bg-white border-2 border-black hover:shadow-[4px_4px_0_0_#000] transition-all">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-text-muted mb-2 tracking-widest">
                    <span>In</span>
                    <span className="text-primary-600 truncate max-w-[150px]">{comment.posts?.title}</span>
                  </div>
                  <p className="text-sm text-text font-medium leading-relaxed line-clamp-4">
                    {comment.content}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest uppercase text-text-muted">+{comment.upvotes - comment.downvotes} Rep</span>
                    {comment.posts?.subgroups && comment.posts?.id && (
                      <a href={`/s/${comment.posts.subgroups.slug}/${comment.posts.id}`} className="text-[10px] font-black uppercase text-primary-600 hover:text-black tracking-widest">View Thread &rarr;</a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 border-2 border-black bg-surface text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-text-muted">No commentary recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
