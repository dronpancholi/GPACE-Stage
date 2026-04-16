import { createClient } from "@/utils/supabase/server";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";
import { PenTool } from "lucide-react";

export default async function MainFeedPage() {
  const supabase = await createClient();

  // Fetch approved posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      subgroups ( slug, name ),
      users ( display_name )
    `)
    .eq('status', 'approved')
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Home Feed</h1>
          <p className="text-text-muted text-sm font-medium">LATEST DISCUSSIONS FROM YOUR ACADEMIC COMMUNITY</p>
        </div>
        <Link href="/submit" className="btn-primary gap-2">
          <PenTool className="w-4 h-4" />
          <span className="hidden sm:inline">WRITE POST</span>
        </Link>
      </div>

      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-20 px-6 card bg-[#fffdf0]">
            <div className="max-w-sm mx-auto">
              <h3 className="text-2xl font-bold text-text mb-4">The page is blank.</h3>
              <p className="text-text-muted text-[15px] mb-8 leading-relaxed">
                There are no discussions here yet. Be the pioneer. Ask a question, share some notes, or start a new discussion.
              </p>
              <Link href="/submit" className="btn-primary inline-flex">
                CREATE THE FIRST POST
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
