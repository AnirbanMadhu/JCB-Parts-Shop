import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  // Simple auth check - just verify cookie exists
  // Client-side will handle full auth validation
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  
  if (!token) {
    redirect('/login');
  }

  return <DashboardClient />;
}
