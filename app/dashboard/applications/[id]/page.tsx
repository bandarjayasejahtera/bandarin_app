import UserApplicationDetailPage from "@/app/user/dashboard/applications/[id]/page";

export default function DashboardApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <UserApplicationDetailPage params={params} />;
}

