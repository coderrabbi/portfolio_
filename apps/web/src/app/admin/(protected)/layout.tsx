import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell';
export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const cookie = jar.get('__Host-gr_session') || jar.get('gr_session');
  if (!cookie) redirect('/admin/login');
  const response = await fetch(
    `${process.env.BACKEND_URL || 'http://127.0.0.1:4000'}/api/auth/me`,
    { headers: { cookie: `${cookie.name}=${cookie.value}` }, cache: 'no-store' },
  );
  if (response.status === 401) redirect('/admin/login');
  if (!response.ok) throw new Error('Unable to verify your session.');
  const { data } = await response.json();
  return <AdminShell email={data.email}>{children}</AdminShell>;
}
