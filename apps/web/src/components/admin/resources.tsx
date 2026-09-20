'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageTitle, Modal, ConfirmDialog, Loading, ErrorState, EmptyState, Pagination } from './ui';
import { useToast } from './provider';
import { ImageField } from './media-library';
type RecordData = { id: string; [key: string]: unknown };
type Field = {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'tags'
    | 'month'
    | 'image'
    | 'category'
    | 'project';
  required?: boolean;
};
const order: Field = { key: 'sortOrder', label: 'Display order', type: 'number' },
  published: Field = { key: 'published', label: 'Published', type: 'boolean' };
const definitions: Record<string, { title: string; description: string; fields: Field[] }> = {
  categories: {
    title: 'A place for every project.',
    description: 'Organize your work into meaningful categories.',
    fields: [
      { key: 'name', label: 'Category name', required: true },
      { key: 'slug', label: 'URL slug', required: true },
      order,
    ],
  },
  'skill-categories': {
    title: 'Organize your expertise.',
    description: 'Create groups for your technology stack.',
    fields: [{ key: 'name', label: 'Category name', required: true }, order],
  },
  services: {
    title: 'What you bring to the table.',
    description: 'Help clients understand how you can help.',
    fields: [
      { key: 'title', label: 'Service title', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'icon', label: 'Icon label' },
      order,
      published,
    ],
  },
  skills: {
    title: 'Your toolkit, curated.',
    description: 'Showcase the technologies behind your work.',
    fields: [
      { key: 'name', label: 'Technology name', required: true },
      { key: 'categoryId', label: 'Skill category', type: 'category', required: true },
      order,
      published,
    ],
  },
  experience: {
    title: 'The story so far.',
    description: 'Keep your professional journey up to date.',
    fields: [
      { key: 'company', label: 'Company', required: true },
      { key: 'position', label: 'Position', required: true },
      { key: 'employmentType', label: 'Employment type' },
      { key: 'startDate', label: 'Start date', type: 'month', required: true },
      { key: 'endDate', label: 'End date (empty for present)', type: 'month' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'technologies', label: 'Technologies (comma separated)', type: 'tags' },
      { key: 'logo', label: 'Company logo', type: 'image' },
      { key: 'website', label: 'Company website' },
      order,
      published,
    ],
  },
  testimonials: {
    title: 'Words that mean something.',
    description: 'Publish authentic feedback from people you have worked with.',
    fields: [
      { key: 'name', label: 'Client name', required: true },
      { key: 'company', label: 'Company' },
      { key: 'avatar', label: 'Client avatar', type: 'image' },
      { key: 'review', label: 'Review', type: 'textarea', required: true },
      { key: 'rating', label: 'Rating (1–5)', type: 'number' },
      { key: 'projectId', label: 'Project', type: 'project' },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      order,
      published,
    ],
  },
};
export function ResourceManager({ resource }: { resource: string }) {
  const [active, setActive] = useState(resource),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [edit, setEdit] = useState<Partial<RecordData> | null>(null),
    [remove, setRemove] = useState<RecordData | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const def = definitions[active],
    toast = useToast(),
    client = useQueryClient();
  const q = useQuery({ queryKey: [active], queryFn: () => api<RecordData[]>(`/${active}`) });
  const categories = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => api<RecordData[]>('/skill-categories'),
    enabled: resource === 'skills',
  });
  const projects = useQuery({
    queryKey: ['project-options'],
    queryFn: () => api<RecordData[]>('/projects'),
    enabled: resource === 'testimonials',
  });
  if (!def) return <ErrorState message="This content section does not exist." />;
  const filtered =
    q.data?.data.filter((item) =>
      `${item.name || item.title || item.position || ''} ${item.company || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  const title = (item: Partial<RecordData>) =>
    String(item.name || item.title || item.position || 'New item');
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError('');
    const payload: Record<string, unknown> = {};
    def.fields.forEach((f) => {
      const value = edit[f.key];
      payload[f.key] =
        f.type === 'number'
          ? Number(value || 0)
          : f.type === 'boolean'
            ? Boolean(value)
            : f.type === 'tags'
              ? String(value || '')
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean)
              : f.type === 'project'
                ? value || null
                : value || '';
    });
    try {
      await api(`/${active}${edit.id ? `/${edit.id}` : ''}`, {
        method: edit.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      await client.invalidateQueries({ queryKey: [active] });
      await client.invalidateQueries({ queryKey: ['overview'] });
      setEdit(null);
      toast('Content saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title={def.title} description={def.description}>
        <button
          className="admin-button primary"
          onClick={() => {
            setEdit({ published: true, rating: 5, sortOrder: q.data?.data.length || 0 });
            setError('');
          }}
        >
          <Plus size={16} />
          Add{' '}
          {active === 'skill-categories'
            ? 'category'
            : active.replace(/ies$/, 'y').replace(/s$/, '')}
        </button>
      </PageTitle>
      {resource === 'skills' && (
        <div className="resource-tabs">
          <button
            className={active === 'skills' ? 'selected' : ''}
            onClick={() => {
              setActive('skills');
              setPage(1);
            }}
          >
            Technologies
          </button>
          <button
            className={active === 'skill-categories' ? 'selected' : ''}
            onClick={() => {
              setActive('skill-categories');
              setPage(1);
            }}
          >
            Skill categories
          </button>
        </div>
      )}
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Search content…"
            aria-label="Search content"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState message={q.error.message} />
      ) : !filtered.length ? (
        <EmptyState title="Nothing here yet" description="Add a new item to get started." />
      ) : (
        <>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Details</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * 12, page * 12).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button
                        className="table-title"
                        onClick={() => {
                          setEdit({
                            ...item,
                            technologies: Array.isArray(item.technologies)
                              ? item.technologies.join(', ')
                              : '',
                          });
                          setError('');
                        }}
                      >
                        {title(item)}
                      </button>
                    </td>
                    <td>
                      {String(item.company || item.slug || item.description || '').slice(0, 70)}
                    </td>
                    <td>{String(item.sortOrder ?? 0)}</td>
                    <td>
                      {typeof item.published === 'boolean' ? (
                        <span className={`badge ${item.published ? 'published' : ''}`}>
                          {item.published ? 'Published' : 'Hidden'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          onClick={() => {
                            setEdit({
                              ...item,
                              technologies: Array.isArray(item.technologies)
                                ? item.technologies.join(', ')
                                : '',
                            });
                            setError('');
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label={`Delete ${title(item)}`}
                          onClick={() => setRemove(item)}
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
          <Pagination page={page} pages={Math.ceil(filtered.length / 12)} onChange={setPage} />
        </>
      )}
      {edit && (
        <Modal
          title={edit.id ? `Edit ${title(edit)}` : 'Create new content'}
          onClose={() => setEdit(null)}
        >
          <form className="admin-form" onSubmit={save}>
            {def.fields.map((f) =>
              f.type === 'image' ? (
                <ImageField
                  key={f.key}
                  label={f.label}
                  value={String(edit[f.key] || '')}
                  onChange={(v) => setEdit({ ...edit, [f.key]: v })}
                />
              ) : (
                <label key={f.key} className={f.type === 'boolean' ? 'check-label' : ''}>
                  {f.type === 'boolean' ? (
                    <>
                      <input
                        type="checkbox"
                        checked={Boolean(edit[f.key])}
                        onChange={(e) => setEdit({ ...edit, [f.key]: e.target.checked })}
                      />
                      {f.label}
                    </>
                  ) : (
                    <>
                      {f.label}
                      {f.type === 'textarea' ? (
                        <textarea
                          required={f.required}
                          rows={5}
                          value={String(edit[f.key] || '')}
                          onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })}
                        />
                      ) : f.type === 'category' || f.type === 'project' ? (
                        <select
                          required={f.required}
                          value={String(edit[f.key] || '')}
                          onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })}
                        >
                          <option value="">Select {f.type}</option>
                          {(f.type === 'category'
                            ? categories.data?.data
                            : projects.data?.data
                          )?.map((v) => (
                            <option value={v.id} key={v.id}>
                              {String(v.name || v.title)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={f.required}
                          type={
                            f.type === 'number' ? 'number' : f.type === 'month' ? 'month' : 'text'
                          }
                          min={f.key === 'rating' ? 1 : f.type === 'number' ? 0 : undefined}
                          max={f.key === 'rating' ? 5 : undefined}
                          value={String(edit[f.key] ?? '')}
                          onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })}
                        />
                      )}
                    </>
                  )}
                </label>
              ),
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="admin-button" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button className="admin-button primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title={`Delete ${title(remove)}?`}
          description="This action cannot be undone. Content currently in use may need to be unlinked first."
          onCancel={() => setRemove(null)}
          busy={busy}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api(`/${active}/${remove.id}`, { method: 'DELETE' });
              await client.invalidateQueries({ queryKey: [active] });
              setRemove(null);
              toast('Content deleted.');
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
