import { login, signup } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text">GPACE Stage</h1>
        <p className="text-sm text-text-muted mt-2">Academic Discussion Platform</p>
      </div>

      <form className="flex-1 flex flex-col w-full justify-center gap-4 text-foreground card p-8">
        {message && (
          <p className="mt-4 p-4 bg-gray-50 text-gray-900 border border-gray-200 text-center rounded-lg text-sm">
            {message}
          </p>
        )}
        
        {/* We use a radio toggle hack or just two buttons for standard HTML forms without JS */}
        
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-sm font-medium" htmlFor="display_name">
            Display Name (Optional for Login)
          </label>
          <input
            className="input-base"
            name="display_name"
            placeholder="Jane Doe"
          />
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="input-base"
            name="email"
            placeholder="you@college.edu"
            required
            type="email"
          />
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="input-base"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <FormSubmitButton formAction={login} className="btn-primary w-full" pendingText="VERIFYING...">
          Sign In
        </FormSubmitButton>
        <FormSubmitButton formAction={signup} className="btn-secondary w-full" pendingText="CREATING...">
          Create Account
        </FormSubmitButton>
      </form>
    </div>
  );
}
