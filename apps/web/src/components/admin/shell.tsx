'use client';
import { useState } from 'react';
import { BrandLogo } from '../brand-logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Tags,
  Briefcase,
  Layers,
  History,
  Quote,
  Mail,
  Image as ImageIcon,
  Settings,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './provider';
const items = [
  ['', 'Overview', LayoutDashboard],
  ['projects', 'Projects', FolderKanban],
  ['categories', 'Categories', Tags],
  ['services', 'Services', Briefcase],
  ['skills', 'Skills', Layers],
  ['experience', 'Experience', History],
  ['testimonials', 'Testimonials', Quote],
  ['messages', 'Messages', Mail],
  ['media', 'Media library', ImageIcon],
  ['settings', 'Site settings', Settings],
] as const;
export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname(),
    router = useRouter(),
    toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <Link href="/admin" className="admin-brand">
          <BrandLogo />
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Dashboard navigation">
          {items.map(([slug, label, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              key={slug}
              className={
                slug
                  ? path.startsWith(`/admin/${slug}`)
                    ? 'selected'
                    : ''
                  : path === '/admin'
                    ? 'selected'
                    : ''
              }
              href={`/admin${slug ? `/${slug}` : ''}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View portfolio <ArrowUpRight size={16} />
          </Link>
          <button
            onClick={async () => {
              try {
                await api('/auth/logout', { method: 'POST' });
                router.replace('/admin/login');
                router.refresh();
              } catch (e) {
                toast(e instanceof Error ? e.message : 'Unable to sign out');
              }
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
          <span>{email}</span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X /> : <Menu />}
          </button>
          <span>
            WORKSPACE <b>/</b>{' '}
            {items.find(([slug]) => slug && path.includes(slug))?.[1] || 'Overview'}
          </span>
          <span className="admin-avatar">GR</span>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
