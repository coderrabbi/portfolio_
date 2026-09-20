'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Copy, Trash2, Star, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import type { Project } from '@gr/shared';
import { api } from '@/lib/api';
import {
  PageTitle,
  Loading,
  ErrorState,
  EmptyState,
  Pagination,
  ConfirmDialog,
} from '@/components/admin/ui';
import { useToast } from '@/components/admin/provider';
export default function Projects() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [remove, setRemove] = useState<Project | null>(null),
    [busy, setBusy] = useState(false);
  const client = useQueryClient(),
    toast = useToast();
  const q = useQuery({
    queryKey: ['projects', page, search, status],
    queryFn: () =>
      api<Project[]>(`/projects?page=${page}&q=${encodeURIComponent(search)}&status=${status}`),
  });
  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      await client.invalidateQueries({ queryKey: ['projects'] });
      await client.invalidateQueries({ queryKey: ['overview'] });
      toast('Portfolio updated.');
      setRemove(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Your work, in focus."
        description="Create, curate, and publish your portfolio projects."
      >
        <Link className="admin-button primary" href="/admin/projects/new">
          <Plus size={17} />
          New project
        </Link>
      </PageTitle>
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search projects"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects…"
          />
        </div>
        <select
          aria-label="Filter publication status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState message={q.error.message} />
      ) : !q.data.data.length ? (
        <EmptyState
          title="No projects found"
          description="Add your first project or adjust your search."
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {q.data.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="table-title" href={`/admin/projects/${p.id}/edit`}>
                        {p.title}
                      </Link>
                      <span className="table-subtitle">
                        {p.category?.name || 'Uncategorized'} · {p.year}
                      </span>
                    </td>
                    <td>
                      <button
                        disabled={busy}
                        className={`badge ${p.published ? 'published' : ''}`}
                        onClick={() =>
                          mutate(`/projects/${p.id}`, 'PATCH', { published: !p.published })
                        }
                      >
                        {p.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`icon-button ${p.featured ? 'starred' : ''}`}
                        aria-label={p.featured ? 'Unfeature project' : 'Feature project'}
                        disabled={busy}
                        onClick={() =>
                          mutate(`/projects/${p.id}`, 'PATCH', { featured: !p.featured })
                        }
                      >
                        <Star size={17} fill={p.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <div className="order-control">
                        <button
                          aria-label={`Move ${p.title} earlier`}
                          disabled={busy || p.sortOrder === 0}
                          onClick={() =>
                            mutate(`/projects/${p.id}`, 'PATCH', {
                              sortOrder: Math.max(0, p.sortOrder - 1),
                            })
                          }
                        >
                          <ArrowUp size={14} />
                        </button>
                        <span>{p.sortOrder}</span>
                        <button
                          aria-label={`Move ${p.title} later`}
                          disabled={busy}
                          onClick={() =>
                            mutate(`/projects/${p.id}`, 'PATCH', { sortOrder: p.sortOrder + 1 })
                          }
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="icon-button"
                          aria-label="Edit project"
                          href={`/admin/projects/${p.id}/edit`}
                        >
                          Edit
                        </Link>
                        <Link
                          className="icon-button"
                          aria-label="Preview project"
                          href={`/admin/projects/${p.id}/preview`}
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label="Duplicate project"
                          onClick={() => mutate(`/projects/${p.id}/duplicate`, 'POST')}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          disabled={busy}
                          aria-label="Delete project"
                          onClick={() => setRemove(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={q.data.pages || 1} onChange={setPage} />
        </>
      )}
      {remove && (
        <ConfirmDialog
          title={`Delete ${remove.title}?`}
          description="This permanently removes the project and its case study. Uploaded media will remain in your library."
          onCancel={() => setRemove(null)}
          onConfirm={() => mutate(`/projects/${remove.id}`, 'DELETE')}
          busy={busy}
        />
      )}
    </>
  );
}
