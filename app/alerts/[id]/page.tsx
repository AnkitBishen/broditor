import { apiFetchAsCurrentUser } from "@/lib/server-api";
import { AlertDetailClient } from "./AlertDetailClient";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetchAsCurrentUser<any>(`/alerts/${id}`);
  
  return <AlertDetailClient initialData={data} />;
}
