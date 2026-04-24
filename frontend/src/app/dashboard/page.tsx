import { cookies } from 'next/headers';
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  return <DashboardClient />;
}
