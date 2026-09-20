'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, ArrowLeft } from 'lucide-react';
import {
  projectSchema,
  type Project,
  type ProjectInput,
  type Category,
  type MediaRecord,
} from '@gr/shared';
import { api } from '@/lib/api';
import { useToast } from './provider';
import { PageTitle, Loading, ErrorState } from './ui';
import { ImageField, MediaPicker } from './media-library';
const blank: ProjectInput = {
  title: '',
  slug: '',
  excerpt: '',
  description: '',
  client: '',
  projectType: '',
  year: new Date().getFullYear(),
  role: '',
  thumbnail: '',
  coverImage: '',
  videoUrl: '',
  liveUrl: '',
  githubUrl: '',
  content: [],
  featured: false,
  published: false,
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
  categoryId: null,
  technologies: [],
  gallery: [],
};
export function ProjectEditor({ id }: { id?: string }) {
  const q = useQuery({
    queryKey: ['project', id],
    queryFn: () => api<Project>(`/projects/${id}`),
    enabled: !!id,
  });
  if (id && q.isPending) return <Loading />;
  if (q.error) return <ErrorState message={q.error.message} />;
  const p = q.data?.data;
  return (
    <Editor
      key={id || 'new'}
      id={id}
      initial={
        p
          ? {
              ...p,
              technologies: p.technologies.map((t) => t.technology.name),
              gallery: p.gallery.map((g) => ({
                mediaId: g.media.id,
                layout: g.layout as 'landscape' | 'portrait' | 'full-width',
              })),
            }
          : blank
      }
      initialMedia={p?.gallery.map((g) => g.media) || []}
    />
  );
}
function Editor({
  id,
  initial,
  initialMedia,
}: {
  id?: string;
  initial: ProjectInput;
  initialMedia: MediaRecord[];
}) {
  const [data, setData] = useState(initial),
    [technologyText, setTechnologyText] = useState(initial.technologies.join(', ')),
    [tab, setTab] = useState('Basic'),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState<Record<string, string[] | undefined>>({}),
    [galleryOpen, setGalleryOpen] = useState(false),
    [media, setMedia] = useState(initialMedia),
    [error, setError] = useState('');
  const router = useRouter(),
    toast = useToast(),
    client = useQueryClient();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const change = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save() {
    const parsed = projectSchema.safeParse({
      ...data,
      technologies: technologyText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      setError(
        parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' · '),
      );
      setTab('Basic');
      return;
    }
    setErrors({});
    setBusy(true);
    setError('');
    try {
      const result = await api<Project>(id ? `/projects/${id}` : '/projects', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(parsed.data),
      });
      setDirty(false);
      await client.invalidateQueries({ queryKey: ['projects'] });
      await client.invalidateQueries({ queryKey: ['project', id] });
      await client.invalidateQueries({ queryKey: ['overview'] });
      toast(data.published ? 'Project published.' : 'Draft saved.');
      if (!id) router.replace(`/admin/projects/${result.data.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key:
      | 'title'
      | 'slug'
      | 'excerpt'
      | 'description'
      | 'client'
      | 'projectType'
      | 'role'
      | 'liveUrl'
      | 'githubUrl'
      | 'videoUrl'
      | 'seoTitle'
      | 'seoDescription',
    label: string,
    multiline = false,
  ) => (
    <label>
      {label}
      {multiline ? (
        <textarea
          rows={key === 'description' ? 6 : 3}
          value={data[key]}
          onChange={(e) => change(key, e.target.value)}
        />
      ) : (
        <input
          value={data[key]}
          onChange={(e) => {
            change(key, e.target.value);
            if (
              key === 'title' &&
              !id &&
              data.slug ===
                data.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '')
            )
              change(
                'slug',
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, ''),
              );
          }}
        />
      )}
      {errors[key] && <span className="field-error">{errors[key]?.join(', ')}</span>}
    </label>
  );
  return (
    <>
      <Link className="text-link" href="/admin/projects">
        <ArrowLeft size={15} /> All projects
      </Link>
      <PageTitle
        title={id ? 'Refine your project.' : 'Make room for your next idea.'}
        description={
          id ? data.title : 'Start with the essentials. Save as a draft whenever you like.'
        }
      >
        <div className="editor-actions">
          <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          {id && (
            <Link className="admin-button" href={`/admin/projects/${id}/preview`}>
              Preview ↗
            </Link>
          )}
          <button className="admin-button primary" disabled={busy} onClick={save}>
            <Save size={16} />
            {busy ? 'Saving…' : 'Save project'}
          </button>
        </div>
      </PageTitle>
      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-tabs" role="tablist" aria-label="Project sections">
        {['Basic', 'Media', 'Details', 'Case study', 'SEO', 'Publishing'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'selected' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {tab === 'Basic' && (
          <section>
            <h3>The essentials</h3>
            {field('title', 'Project title')}
            {field('slug', 'URL slug')}
            <small>Lowercase letters, numbers, and hyphens. Example: my-next-project</small>
            {field('excerpt', 'Short description', true)}
            <div className="form-grid">
              <label>
                Category
                <select
                  value={data.categoryId || ''}
                  onChange={(e) => change('categoryId', e.target.value || null)}
                >
                  <option value="">Uncategorized</option>
                  {categories.data?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Year
                <input
                  type="number"
                  value={data.year}
                  onChange={(e) => change('year', Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Technologies
              <input
                value={technologyText}
                onChange={(e) => {
                  setTechnologyText(e.target.value);
                  setDirty(true);
                }}
              />
              <small>Separate technologies with commas.</small>
            </label>
          </section>
        )}
        {tab === 'Media' && (
          <section>
            <div className="form-grid">
              <ImageField
                label="Thumbnail"
                value={data.thumbnail}
                onChange={(v) => change('thumbnail', v)}
              />
              <ImageField
                label="Cover image"
                value={data.coverImage}
                onChange={(v) => change('coverImage', v)}
              />
            </div>
            {field('videoUrl', 'Demo video URL (MP4 or WebM)')}
            <h3>Project gallery</h3>
            <div className="gallery-edit">
              {data.gallery.map((g, i) => {
                const m = media.find((m) => m.id === g.mediaId);
                return (
                  <div key={`${g.mediaId}-${i}`}>
                    <div className="selected-image">
                      {m && <Image src={m.url} alt={m.alt} fill sizes="200px" />}
                      <button
                        type="button"
                        aria-label="Remove gallery image"
                        onClick={() =>
                          change(
                            'gallery',
                            data.gallery.filter((_, j) => j !== i),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                    <select
                      aria-label="Gallery image layout"
                      value={g.layout}
                      onChange={(e) =>
                        change(
                          'gallery',
                          data.gallery.map((item, j) =>
                            j === i ? { ...item, layout: e.target.value as typeof g.layout } : item,
                          ),
                        )
                      }
                    >
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                      <option value="full-width">Full width</option>
                    </select>
                  </div>
                );
              })}
            </div>
            <button className="admin-button" type="button" onClick={() => setGalleryOpen(true)}>
              <Plus size={15} /> Add gallery image
            </button>
          </section>
        )}
        {tab === 'Details' && (
          <section>
            {field('description', 'Project overview', true)}
            <div className="form-grid">
              {field('client', 'Client')}
              {field('role', 'Your role')}
              {field('projectType', 'Project type')}
              {field('liveUrl', 'Live website URL')}
              {field('githubUrl', 'GitHub URL')}
            </div>
          </section>
        )}
        {tab === 'Case study' && (
          <section>
            <h3>Tell the story behind the work</h3>
            <p className="field-hint">
              Add focused sections such as Challenge, Approach, Development, and Results. Content is
              rendered safely as text.
            </p>
            {data.content.map((block, i) => (
              <div className="content-block" key={i}>
                <div>
                  <span>SECTION {i + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'content',
                        data.content.filter((_, j) => j !== i),
                      )
                    }
                  >
                    Remove section
                  </button>
                </div>
                <label>
                  Heading
                  <input
                    value={block.title}
                    onChange={(e) =>
                      change(
                        'content',
                        data.content.map((b, j) => (j === i ? { ...b, title: e.target.value } : b)),
                      )
                    }
                  />
                </label>
                <label>
                  Story
                  <textarea
                    rows={7}
                    value={block.body}
                    onChange={(e) =>
                      change(
                        'content',
                        data.content.map((b, j) => (j === i ? { ...b, body: e.target.value } : b)),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={i === 0}
                  className="admin-button"
                  onClick={() => {
                    const blocks = [...data.content];
                    [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
                    change('content', blocks);
                  }}
                >
                  Move earlier ↑
                </button>
              </div>
            ))}
            <button
              type="button"
              className="admin-button"
              onClick={() => change('content', [...data.content, { title: '', body: '' }])}
            >
              <Plus size={15} />
              Add story section
            </button>
          </section>
        )}
        {tab === 'SEO' && (
          <section>
            {field('seoTitle', 'SEO title')}
            {field('seoDescription', 'SEO description', true)}
            <p className="field-hint">
              Leave these empty to use your project title and short description.
            </p>
          </section>
        )}
        {tab === 'Publishing' && (
          <section>
            <h3>Make it yours. Then make it public.</h3>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.published}
                onChange={(e) => change('published', e.target.checked)}
              />
              Published — visible on the public portfolio
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.featured}
                onChange={(e) => change('featured', e.target.checked)}
              />
              Featured — included on the homepage
            </label>
            <label>
              Display order
              <input
                type="number"
                min={0}
                value={data.sortOrder}
                onChange={(e) => change('sortOrder', Number(e.target.value))}
              />
              <small>Lower numbers appear first, independently of creation date.</small>
            </label>
          </section>
        )}
      </form>
      {galleryOpen && (
        <MediaPicker
          onClose={() => setGalleryOpen(false)}
          onSelect={(m) => {
            setMedia((v) => [...v, m]);
            change('gallery', [...data.gallery, { mediaId: m.id, layout: 'landscape' }]);
          }}
        />
      )}
    </>
  );
}
