import type { Metadata } from 'next';
import { AdminProvider } from '@/components/admin/provider';
import './admin.css';
export const metadata: Metadata = {
  title: 'GR. / Studio dashboard',
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
