import { createClient } from "@/utils/supabase/server";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield, PenTool } from "lucide-react";

export default async function SubgroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: subgroup } = await supabase
    .from("subgroups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!subgroup) {
    return notFound();
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      subgroups ( slug, name ),
      users ( display_name )
    `)
    .eq("subgroup_id", subgroup.id)
    .eq("status", "approved")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Subgroup Header */}
      <div className="card p-8 mb-10 bg-[#f8fafc]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-text mb-3 flex items-center gap-2">
              s/{subgroup.slug}
              {subgroup.require_approval && (
                <span title="Moderated Space">
                  <Shield className="w-6 h-6 text-yellow-500" />
                </span>
              )}
            </h1>
            <h2 className="text-lg font-bold font-sans text-text-muted mb-4 tracking-tight uppercase">{subgroup.name}</h2>
            <p className="text-sm text-text-muted max-w-xl leading-relaxed">{subgroup.description}</p>
          </div>
          <button className="btn-secondary">
            JOIN
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-black">
         <h3 className="font-bold font-sans text-lg uppercase">Discussions</h3>
         <Link href="/submit" className="btn-primary py-1.5 px-4 text-xs gap-2">
            <PenTool className="w-3 h-3" /> WRITE POST
         </Link>
      </div>

      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-20 px-6 border-2 border-dashed border-gray-300">
            <div className="max-w-sm mx-auto">
              <h3 className="text-2xl font-bold text-text mb-4">No content yet.</h3>
              <p className="text-text-muted text-[15px] mb-8 leading-relaxed">
                This space is waiting for its first discussion. Share a resource or ask a compelling question.
              </p>
              <Link href="/submit" className="btn-secondary inline-flex">
                START DISCUSSION
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
