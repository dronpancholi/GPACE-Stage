import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, User } from "lucide-react";
import { revalidatePath } from "next/cache";
import { castVote } from "@/app/actions/votes";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      subgroups ( slug, name ),
      users ( display_name )
    `)
    .eq("id", postId)
    .single();

  if (!post) {
    return notFound();
  }

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      users ( display_name )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const addComment = async (formData: FormData) => {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const content = formData.get("content") as string;
    
    await supabaseServer.from("comments").insert([{
      post_id: postId,
      author_id: user.id,
      content
    }]);

    revalidatePath(`/s/${slug}/${postId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/s/${slug}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to s/{slug}
      </Link>

      {/* Main Post */}
      <article className="card p-6 mb-8 flex gap-4">
        {/* Voting Sidebar */}
        <div className="flex flex-col items-center gap-1 min-w-[2rem] pt-1">
          <form action={castVote} className="contents flex flex-col items-center">
            <input type="hidden" name="target_id" value={post.id} />
            <input type="hidden" name="target_type" value="post" />
            <input type="hidden" name="pathname" value={`/s/${slug}/${postId}`} />
            
            <button type="submit" name="vote_type" value="upvote" className="text-text-muted hover:text-primary-600 transition-colors p-1 rounded hover:bg-surface-hover">
              <ArrowUp className="w-6 h-6" />
            </button>
            <span className="font-bold text-base text-text">{post.upvotes - post.downvotes}</span>
            <button type="submit" name="vote_type" value="downvote" className="text-text-muted hover:text-red-600 transition-colors p-1 rounded hover:bg-surface-hover">
              <ArrowDown className="w-6 h-6" />
            </button>
          </form>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
            <span className="font-bold text-text">s/{post.subgroups.slug}</span>
            <span>•</span>
            <span>Posted by {post.users?.display_name || 'Unknown'}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] uppercase font-bold tracking-wider">
              {post.type}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-text mb-4">{post.title}</h1>
          
          <div className="text-text-muted whitespace-pre-wrap text-[15px] leading-relaxed break-words">
            {post.content}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-text">Comments</h3>
        <form action={addComment} className="mb-8">
          <textarea 
            name="content"
            placeholder="Add a comment..."
            className="input-base min-h-[100px] mb-2"
            required
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Comment</button>
          </div>
        </form>

        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="p-4 rounded-lg bg-surface border border-border flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                 </div>
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-semibold text-sm text-text">{comment.users?.display_name || "Unknown"}</span>
                     <form action={castVote} className="flex items-center gap-1 ml-2 bg-surface-hover px-1 rounded border border-transparent hover:border-black transition-colors">
                       <input type="hidden" name="target_id" value={comment.id} />
                       <input type="hidden" name="target_type" value="comment" />
                       <input type="hidden" name="pathname" value={`/s/${slug}/${postId}`} />
                       
                       <button type="submit" name="vote_type" value="upvote" className="text-text-muted hover:text-primary-600 transition-colors p-0.5">
                         <ArrowUp className="w-3 h-3" />
                       </button>
                       <span className="text-[10px] font-black text-text-muted px-0.5">{comment.upvotes - comment.downvotes}</span>
                       <button type="submit" name="vote_type" value="downvote" className="text-text-muted hover:text-red-600 transition-colors p-0.5">
                         <ArrowDown className="w-3 h-3" />
                       </button>
                     </form>
                   </div>
                   <p className="text-sm text-text-muted whitespace-pre-wrap">{comment.content}</p>
                 </div>
              </div>
            ))
          ) : (
            <p className="text-text-muted text-sm text-center py-4">No comments yet. Be the first to share your thoughts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
