import { createClient } from "@/utils/supabase/server";
import { createPost } from "@/app/actions/posts";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { FormSubmitButton } from "@/components/FormSubmitButton";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("users").select("allow_anonymous").eq("id", user?.id).single();

    return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black font-serif text-text mb-1 uppercase tracking-tighter">Create a Post</h1>
        <p className="text-sm font-bold font-sans tracking-wide text-text-muted">Start a discussion, ask a question, or share a resource.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 border-2 border-red-900 bg-red-50 text-red-900 flex gap-3 font-bold uppercase tracking-wide text-sm shadow-[3px_3px_0_0_#7f1d1d]">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form action={createPost} className="card p-8 bg-white flex flex-col gap-5 border-2 border-black shadow-[4px_4px_0_0_#000]">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text" htmlFor="subgroup_id">
            Select Subgroup
          </label>
          <select 
            name="subgroup_id" 
            id="subgroup_id"
            className="input-base"
            required
            defaultValue=""
          >
            <option value="" disabled>Choose a subgroup...</option>
            {subgroups?.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text" htmlFor="type">
            Post Type
          </label>
          <select 
            name="type" 
            id="type"
            className="input-base"
            required
          >
            <option value="discussion">Discussion</option>
            <option value="question">Question</option>
            <option value="resource">Resource</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text" htmlFor="title">
            Title
          </label>
          <input 
            type="text"
            name="title" 
            id="title"
            className="input-base font-medium"
            placeholder="An interesting title (optional)"
          />
        </div>

        <div className="flex flex-col gap-2 mb-2">
          <label className="text-sm font-semibold text-text" htmlFor="content">
            Body Content
          </label>
          <textarea 
            name="content" 
            id="content"
            className="input-base min-h-[150px] resize-y"
            placeholder="What are your thoughts?"
            required
          />
        </div>

        {profile?.allow_anonymous && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-black italic">
            <input type="checkbox" name="is_anonymous" id="is_anonymous" value="true" className="w-4 h-4 accent-black" />
            <label htmlFor="is_anonymous" className="text-xs font-bold uppercase tracking-widest text-text">Post Anonymously</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Link href="/" className="btn-ghost">Cancel</Link>
          <FormSubmitButton className="btn-primary px-8" pendingText="POSTING...">
            POST
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
