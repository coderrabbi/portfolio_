'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Message } from '@gr/shared';
import { api } from '@/lib/api';
import {
  PageTitle,
  Loading,
  ErrorState,
  EmptyState,
  Pagination,
  Modal,
  ConfirmDialog,
} from '@/components/admin/ui';
import { useToast } from '@/components/admin/provider';
export default function Messages() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(''),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState<Message | null>(null),
    [remove, setRemove] = useState<Message | null>(null),
    [busy, setBusy] = useState(false);
  const toast = useToast(),
    client = useQueryClient();
  const q = useQuery({
    queryKey: ['messages', page, status, search],
    queryFn: () =>
      api<Message[]>(`/messages?page=${page}&status=${status}&q=${encodeURIComponent(search)}`),
  });
  async function update(m: Message, patch: Partial<Message>) {
    try {
      await api(`/messages/${m.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setSelected({ ...m, ...patch });
      await client.invalidateQueries({ queryKey: ['messages'] });
      await client.invalidateQueries({ queryKey: ['overview'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Unable to update message.');
    }
  }
  return (
    <>
      <PageTitle
        title="Conversations start here."
        description="Read inquiries, track replies, and keep your inbox organized."
      />
      <div className="admin-toolbar">
        <input
          placeholder="Search by name or email…"
          aria-label="Search messages"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Message status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All messages</option>
          {['New', 'Replied', 'Archived'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState message={q.error.message} />
      ) : !q.data.data.length ? (
        <EmptyState
          title="A little breathing room"
          description="New contact submissions will appear here."
        />
      ) : (
        <>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Project</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {q.data.data.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <button
                        className="table-title"
                        onClick={() => {
                          setSelected(m);
                          if (!m.read) update(m, { read: true });
                        }}
                      >
                        {m.name}
                        {!m.read && <i className="unread-dot" />}
                      </button>
                      <span className="table-subtitle">{m.email}</span>
                    </td>
                    <td>
                      {m.projectType}
                      <span className="table-subtitle">{m.company}</span>
                    </td>
                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge">{m.status}</span>
                      <span className="table-subtitle">
                        Email: {m.emailStatus || 'not_requested'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => {
                          setSelected(m);
                          if (!m.read) update(m, { read: true });
                        }}
                      >
                        Open
                      </button>
                      <button className="icon-button danger-text" onClick={() => setRemove(m)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={q.data.pages || 1} onChange={setPage} />
        </>
      )}
      {selected && (
        <Modal title={`A message from ${selected.name}`} onClose={() => setSelected(null)} wide>
          <dl className="message-meta">
            {[
              ['Email', selected.email],
              ['Company', selected.company || '—'],
              ['Project', selected.projectType],
              ['Budget', selected.budget || 'To discuss'],
              ['Received', new Date(selected.createdAt).toLocaleString()],
              [
                'Email notification',
                selected.emailStatus === 'accepted'
                  ? 'Accepted by email provider'
                  : selected.emailStatus || 'Not requested',
              ],
              ['Delivery attempts', String(selected.emailAttempts || 0)],
              ...(selected.emailError ? [['Delivery issue', selected.emailError]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="message-detail">{selected.message}</div>
          <div className="admin-toolbar">
            <select
              aria-label="Update message status"
              value={selected.status}
              onChange={(e) => update(selected, { status: e.target.value as Message['status'] })}
            >
              {['New', 'Replied', 'Archived'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <button
              className="admin-button"
              onClick={() => update(selected, { read: !selected.read })}
            >
              Mark {selected.read ? 'unread' : 'read'}
            </button>
            <a className="admin-button primary" href={`mailto:${selected.email}`}>
              Reply by email ↗
            </a>
          </div>
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title="Delete this inquiry?"
          description="The message and sender details will be permanently removed."
          onCancel={() => setRemove(null)}
          busy={busy}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api(`/messages/${remove.id}`, { method: 'DELETE' });
              await client.invalidateQueries({ queryKey: ['messages'] });
              await client.invalidateQueries({ queryKey: ['overview'] });
              setRemove(null);
              toast('Message deleted.');
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Unable to delete.');
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </>
  );
}
