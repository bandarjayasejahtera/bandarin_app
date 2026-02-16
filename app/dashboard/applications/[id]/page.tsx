import UserApplicationDetailPage from "@/app/client/dashboard/applications/[id]/page";

export default function DashboardApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <UserApplicationDetailPage params={params} />;
}

