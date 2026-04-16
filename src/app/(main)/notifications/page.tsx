import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock,
  Trash2,
  Check
} from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select(`*, posts ( title, subgroups ( slug ) )`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <div className="bg-black p-3 text-white">
            <Bell className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-serif text-text uppercase tracking-tighter">Academic Alerts</h1>
            <p className="text-sm font-bold font-sans text-text-muted uppercase tracking-widest mt-1">
              System Notifications Hub
            </p>
          </div>
        </div>
        
        {notifications && notifications.some(n => !n.read) && (
          <form action={markAllNotificationsRead}>
             <button type="submit" className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-gray-800 transition-colors">
                Mark All Read
             </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`card p-5 border-2 border-black relative transition-all ${notif.read ? 'bg-white opacity-80' : 'bg-white shadow-[4px_4px_0_0_#000] border-l-8 border-l-black'}`}
            >
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                   {notif.type === 'post_approved' && <CheckCircle className="w-6 h-6 text-green-600" />}
                   {notif.type === 'post_rejected' && <XCircle className="w-6 h-6 text-red-600" />}
                   {notif.type === 'comment_reply' && <MessageSquare className="w-6 h-6 text-blue-600" />}
                   {!['post_approved', 'post_rejected', 'comment_reply'].includes(notif.type) && <Bell className="w-6 h-6 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] font-bold uppercase text-text-muted tracking-wide flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {new Date(notif.created_at).toLocaleString()}
                    </p>
                    {!notif.read && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                  <p className="font-bold text-sm leading-relaxed mb-3">{notif.message}</p>
                  
                  {notif.post_id && notif.posts && (
                    <Link 
                      href={`/s/${notif.posts.subgroups?.slug}/${notif.post_id}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text hover:underline border-b-2 border-black"
                    >
                      View Publication <Check className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border-4 border-dashed border-gray-100">
             <p className="text-text-muted font-bold uppercase tracking-widest">No alerts in your registry</p>
          </div>
        )}
      </div>
    </div>
  );
}
