import { createClient } from "@/utils/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();
  const tables = ["users", "subgroups", "posts", "comments", "votes", "reputation_events", "notifications"];
  const results = [];

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*", { count: 'exact', head: true }).limit(1);
    results.push({ table, status: error ? "ERROR" : "OK", message: error ? error.message : "Table found and accessible" });
  }

  return (
    <div className="p-8 font-mono">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic</h1>
      
      <div className="mb-8 p-4 bg-gray-100 border-2 border-black">
        <h2 className="font-bold border-b-2 border-black mb-2">Auth Status</h2>
        <pre>{JSON.stringify({ loggedIn: !!user, email: user?.email, error: authError?.message }, null, 2)}</pre>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold border-b-2 border-black">Table Connectivity</h2>
        {results.map(res => (
          <div key={res.table} className={`p-4 border-2 border-black ${res.status === 'OK' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between font-bold">
              <span>{res.table}</span>
              <span className={res.status === 'OK' ? 'text-green-700' : 'text-red-700'}>{res.status}</span>
            </div>
            <div className="text-sm mt-1">{res.message}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 text-sm">
        <p><strong>Note:</strong> If you see "Could not find the table", you MUST run the <code>MASTER_SETUP.sql</code> script in the Supabase SQL Editor.</p>
        <p className="mt-2">If you see "Permission denied", it means RLS is active but your user doesn't have a Grant to see that table.</p>
      </div>
    </div>
  );
}
