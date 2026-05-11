import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatAlertsManager, { type ChatAlert } from "@/components/admin/ChatAlertsManager";

export const metadata = {
  title: "Chat Alerts | Admin",
};

export default async function AdminChatAlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const selectedId = typeof params.id === "string" ? params.id : null;

  const { data: alerts, error } = await supabase
    .from("chat_alerts")
    .select(
      "id,created_at,status,intent,reason,message_excerpt,page_url,property_title,property_code,property_location,contact_found,source,language"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Chat Alerts</h1>
      </div>

      {error ? (
        <div className="bg-white border border-red-200 rounded-lg px-6 py-8 text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">Failed to load chat alerts</p>
          <p className="text-xs text-[#888888]">{error.message}</p>
        </div>
      ) : (
        <ChatAlertsManager
          initialRows={(alerts ?? []) as unknown as ChatAlert[]}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}
