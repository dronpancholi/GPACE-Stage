import { FormSubmitButton } from "@/components/FormSubmitButton";

export default async function CreateSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6 transition-colors font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-black">
        <Compass className="w-8 h-8 text-black" />
        <div>
          <h1 className="text-3xl font-black font-serif text-text mb-1 uppercase tracking-tighter">Create a Space</h1>
          <p className="text-sm font-bold font-sans tracking-wide text-text-muted uppercase">Found a new academic subgroup</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border-2 border-red-900 bg-red-50 text-red-900 flex gap-3 font-bold uppercase tracking-wide text-sm shadow-[3px_3px_0_0_#7f1d1d]">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <form action={createSubgroup} className="card p-8 bg-white flex flex-col gap-6 border-2 border-black shadow-[4px_4px_0_0_#000]">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="name">
            Space Name
          </label>
          <p className="text-xs text-text-muted font-medium mb-1">
            Choose a distinct, memorable name for this academic domain.
          </p>
          <input 
            type="text" 
            name="name" 
            id="name"
            placeholder="e.g., Computer Science 101"
            className="input-base text-lg font-bold"
            required
            minLength={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="description">
            Description
          </label>
          <p className="text-xs text-text-muted font-medium mb-1">
            What is the purpose of this space? Who should join?
          </p>
          <textarea 
            name="description" 
            id="description"
            rows={3}
            placeholder="Discussing theoretical frameworks and algorithms..."
            className="input-base text-sm leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-black font-sans uppercase tracking-widest text-text" htmlFor="type">
            Domain Type
          </label>
          <p className="text-xs text-text-muted font-medium mb-1">
            Determine the visibility and accessibility of your new academic space.
          </p>
          <select name="type" id="type" className="input-base cursor-pointer uppercase font-bold text-sm" defaultValue="open">
             <option value="open">Open (Publicly visible, anyone can join)</option>
             <option value="restricted">Restricted (Visible to all, joining requires approval)</option>
             <option value="private">Private (Hidden from Explore, invite only)</option>
          </select>
        </div>

        <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-900 mt-2">
          <input 
            type="checkbox" 
            name="require_approval" 
            id="require_approval" 
            className="mt-1 w-4 h-4 accent-black"
          />
          <div>
            <label className="text-sm font-black font-sans uppercase tracking-widest text-yellow-900" htmlFor="require_approval">
              Require Moderator Approval
            </label>
            <p className="text-xs text-yellow-800 font-medium mt-1">
              If checked, any post submitted to this space will sit in the `Pending` queue until an Admin or Moderator permanently approves it.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-black flex justify-end">
          <FormSubmitButton className="btn-primary px-10 text-lg uppercase tracking-widest" pendingText="FOUNDING...">
            FOUND SPACE
          </FormSubmitButton>
        </div>

      </form>
    </div>
  );
}
