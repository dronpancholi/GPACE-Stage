import { FormSubmitButton } from "@/components/FormSubmitButton";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // maybeSingle instead of single prevents PostgREST exceptions when a user row hasn't synced
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, bio, handle, feed_sort, notify_replies, notify_approvals, allow_anonymous, profile_visibility, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-black">
        <SettingsIcon className="w-8 h-8 text-black" />
        <div>
          <h1 className="text-3xl font-black font-serif text-text mb-1 uppercase tracking-tighter">Settings</h1>
          <p className="text-text-muted font-sans text-sm font-bold uppercase tracking-wider">Configure your profile details & Preferences</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border-2 border-red-900 bg-red-50 text-red-900 flex gap-3 font-bold uppercase tracking-wide text-sm shadow-[3px_3px_0_0_#7f1d1d]">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 border-2 border-green-900 bg-green-50 text-green-900 flex gap-3 font-bold uppercase tracking-wide text-sm shadow-[3px_3px_0_0_#14532d]">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <form action={updateProfile} className="space-y-8">
        {/* Account Settings */}
        <div className="card p-6 bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-serif font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2">Account Settings</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="display_name">Display Name</label>
              <input type="text" name="display_name" id="display_name" defaultValue={profile?.display_name || ""} className="input-base text-lg font-bold" required minLength={3} />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="handle">Username Handle</label>
              <p className="text-xs text-text-muted font-medium mb-1">A unique identifier (@username).</p>
              <input type="text" name="handle" id="handle" defaultValue={profile?.handle || ""} className="input-base text-sm font-bold" placeholder="e.g. jsmith24" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="bio">Personal Bio</label>
              <textarea name="bio" id="bio" rows={3} maxLength={160} defaultValue={profile?.bio || ""} className="input-base text-sm leading-relaxed" />
            </div>
          </div>
        </div>

        {/* Role Visibility */}
        <div className="p-4 bg-primary-50 border-2 border-black shadow-[4px_4px_0_0_#000] flex justify-between items-center">
           <div>
             <h2 className="text-sm font-serif font-black uppercase tracking-tight">Active Role</h2>
             <p className="text-xs text-text-muted mt-1">Your current tier privileges in GPACE.</p>
           </div>
           <div className="bg-black text-white font-black uppercase tracking-widest text-xs px-3 py-1.5">{profile?.role || 'User'}</div>
        </div>

        {/* Preferences */}
        <div className="card p-6 bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-serif font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2">Preferences</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="feed_sort">Default Feed Sorting</label>
              <select name="feed_sort" id="feed_sort" defaultValue={profile?.feed_sort || "hot"} className="input-base cursor-pointer">
                <option value="hot">Hot (Highest Velocity)</option>
                <option value="new">New (Chronological)</option>
                <option value="top">Top (Highest Voted)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" name="notify_replies" id="notify_replies" defaultChecked={profile?.notify_replies ?? true} className="w-4 h-4 accent-black" />
              <label className="text-sm font-bold font-sans tracking-wide text-text" htmlFor="notify_replies">Notify me of replies to my posts</label>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" name="notify_approvals" id="notify_approvals" defaultChecked={profile?.notify_approvals ?? true} className="w-4 h-4 accent-black" />
              <label className="text-sm font-bold font-sans tracking-wide text-text" htmlFor="notify_approvals">Notify me when my posts get approved</label>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="card p-6 bg-white border-2 border-black shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-serif font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-2">Privacy Controls</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" name="profile_visibility" id="profile_visibility" defaultChecked={profile?.profile_visibility ?? true} className="w-4 h-4 mt-0.5 accent-black" />
              <div>
                <label className="text-sm font-bold font-sans tracking-wide text-text block" htmlFor="profile_visibility">Public Profile</label>
                <span className="text-xs text-text-muted">Allow others to view your history.</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <input type="checkbox" name="allow_anonymous" id="allow_anonymous" defaultChecked={profile?.allow_anonymous ?? false} className="w-4 h-4 mt-0.5 accent-black" />
              <div>
                <label className="text-sm font-bold font-sans tracking-wide text-text block" htmlFor="allow_anonymous">Allow Anonymous Posting</label>
                <span className="text-xs text-text-muted">Enabling this adds an option to hide your handle when submitting.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="sticky bottom-4 z-10 card p-4 bg-white border-2 border-black shadow-[4px_4px_0_0_#000] flex justify-between items-center">
           <span className="text-xs font-bold font-sans uppercase text-text-muted tracking-widest hidden sm:inline">Unsaved changes will be lost</span>
           <FormSubmitButton type="submit" className="btn-primary px-10" pendingText="SAVING...">SAVE CHANGES</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}
