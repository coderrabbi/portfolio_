'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  ArrowUpRight,
  FolderKanban,
  Mail,
  Eye,
  FileText,
  Briefcase,
  Quote,
  Inbox,
} from 'lucide-react';
import type { Project, Message } from '@gr/shared';
import { api } from '@/lib/api';
import { PageTitle, Loading, ErrorState } from '@/components/admin/ui';
interface Overview {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  totalMessages: number;
  unreadMessages: number;
  services: number;
  testimonials: number;
  recentProjects: Project[];
  recentMessages: Message[];
}
export default function Dashboard() {
  const q = useQuery({ queryKey: ['overview'], queryFn: () => api<Overview>('/overview') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState message={q.error.message} retry={() => q.refetch()} />;
  const d = q.data.data;
  return (
    <>
      <PageTitle
        title="A little overview."
        description="Everything happening in your portfolio, at a glance."
      >
        <Link className="admin-button primary" href="/admin/projects/new">
          <Plus size={17} />
          New project
        </Link>
      </PageTitle>
      <div className="overview-stats">
        {[
          ['Total projects', d.totalProjects, FolderKanban],
          ['Published', d.publishedProjects, Eye],
          ['Drafts', d.draftProjects, FileText],
          ['Messages', d.totalMessages, Mail],
          ['Unread', d.unreadMessages, Inbox],
          ['Services', d.services, Briefcase],
          ['Testimonials', d.testimonials, Quote],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof FolderKanban;
          return (
            <div key={String(label)}>
              <span>
                {String(label)}
                <I size={17} />
              </span>
              <strong>{String(value).padStart(2, '0')}</strong>
            </div>
          );
        })}
      </div>
      <div className="dashboard-columns">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Recent projects</h2>
            <Link href="/admin/projects">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>
          {d.recentProjects.map((p) => (
            <Link className="dashboard-row" href={`/admin/projects/${p.id}/edit`} key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              <span className={`badge ${p.published ? 'published' : ''}`}>
                {p.published ? 'Published' : 'Draft'}
              </span>
            </Link>
          ))}
          {!d.recentProjects.length && (
            <p className="panel-empty">Your next project starts here.</p>
          )}
        </section>
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Latest inquiries</h2>
            <Link href="/admin/messages">
              Open inbox <ArrowUpRight size={15} />
            </Link>
          </div>
          {d.recentMessages.map((m) => (
            <Link className="dashboard-row" key={m.id} href="/admin/messages">
              <div>
                <strong>
                  {m.name}
                  {!m.read && <i className="unread-dot" />}
                </strong>
                <span>{m.projectType}</span>
              </div>
              <span className="badge">{m.status}</span>
            </Link>
          ))}
          {!d.recentMessages.length && (
            <p className="panel-empty">Your inbox is clear. New inquiries will appear here.</p>
          )}
        </section>
      </div>
      <div className="quick-actions">
        <span>KEEP THINGS MOVING</span>
        <Link href="/admin/media">Upload media ↗</Link>
        <Link href="/admin/services">Add a service ↗</Link>
        <Link href="/admin/settings">Update your availability ↗</Link>
      </div>
      <div className="admin-notice">
        Before going live, replace the demonstration projects, sample statistics, work history, and
        contact email with your own information.
      </div>
    </>
  );
}
