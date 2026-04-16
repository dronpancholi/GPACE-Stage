import Link from "next/link";
import { Flag, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { castVote } from "@/app/actions/votes";
import { submitReport } from "@/app/actions/admin";
import { FormSubmitButton } from "./FormSubmitButton";

export function PostCard({ post }: { post: any }) {
  const handleReport = async (formData: FormData) => {
    await submitReport(formData);
  };

  return (
    <article className="card p-4 hover:shadow-md transition-shadow group flex gap-4 my-4">
      {/* Vote Sidebar */}
      <div className="flex flex-col items-center gap-1 min-w-[2rem] pt-1">
        <form action={castVote}>
          <input type="hidden" name="target_id" value={post.id} />
          <input type="hidden" name="target_type" value="post" />
          <input type="hidden" name="vote_type" value="upvote" />
          <input type="hidden" name="pathname" value="/" />
          <button type="submit" title="Upvote" className="text-text-muted hover:text-primary-600 transition-colors p-1 rounded hover:bg-surface-hover">
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
        
        <span className="font-bold text-sm text-text">{post.upvotes - post.downvotes}</span>
        
        <form action={castVote}>
          <input type="hidden" name="target_id" value={post.id} />
          <input type="hidden" name="target_type" value="post" />
          <input type="hidden" name="vote_type" value="downvote" />
          <input type="hidden" name="pathname" value="/" />
          <button type="submit" title="Downvote" className="text-text-muted hover:text-red-600 transition-colors p-1 rounded hover:bg-surface-hover">
            <ArrowDown className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
          {post.subgroups && (
            <Link href={`/s/${post.subgroups.slug}`} className="font-bold text-text hover:underline">
              s/{post.subgroups.slug}
            </Link>
          )}
          <span>•</span>
          <span>Posted by {post.users?.display_name || 'Unknown'}</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] uppercase font-bold tracking-wider">
            {post.type}
          </span>
        </div>

        <Link href={`/s/${post.subgroups?.slug}/${post.id}`} className="block">
          <h3 className="text-lg font-bold text-text mb-2 group-hover:text-primary-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-text-muted line-clamp-3 mb-4">
            {post.content}
          </p>
        </Link>

        {/* Action Bar */}
        <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
          <Link href={`/s/${post.subgroups?.slug}/${post.id}`} className="flex items-center gap-1.5 hover:bg-surface-hover px-2 py-1.5 rounded transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
          </Link>

          <form action={handleReport} className="flex-1 flex items-center gap-2">
             <input type="hidden" name="post_id" value={post.id} />
             <input type="hidden" name="reason" value="Community Flag" />
             <FormSubmitButton className="flex items-center gap-1.5 hover:text-red-600 px-2 py-1.5 rounded transition-colors" pendingText="...">
               <Flag className="w-4 h-4" />
               <span className="hidden sm:inline">Report</span>
             </FormSubmitButton>
          </form>
        </div>
      </div>
    </article>
  );
}
