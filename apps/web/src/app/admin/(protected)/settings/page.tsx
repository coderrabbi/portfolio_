'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Plus } from 'lucide-react';
import { settingsSchema, type Settings } from '@gr/shared';
import { api } from '@/lib/api';
import { PageTitle, Loading, ErrorState } from '@/components/admin/ui';
import { ImageField } from '@/components/admin/media-library';
import { useToast } from '@/components/admin/provider';
export default function SettingsPage() {
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<Settings>('/settings') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState message={q.error.message} />;
  return <SettingsEditor initial={q.data.data} />;
}
function SettingsEditor({ initial }: { initial: Settings }) {
  const [data, setData] = useState(initial),
    [tab, setTab] = useState('Identity'),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState('');
  const toast = useToast(),
    client = useQueryClient();
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  async function save() {
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · '));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify(result.data) });
      await client.invalidateQueries({ queryKey: ['settings'] });
      setDirty(false);
      toast('Site settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key:
      | 'name'
      | 'monogram'
      | 'title'
      | 'introduction'
      | 'email'
      | 'availability'
      | 'location'
      | 'timezone'
      | 'aboutTitle'
      | 'about'
      | 'philosophy'
      | 'resumeUrl'
      | 'footerText'
      | 'seoTitle'
      | 'seoDescription',
    label: string,
    area = false,
  ) => (
    <label>
      {label}
      {area ? (
        <textarea rows={4} value={data[key]} onChange={(e) => change(key, e.target.value)} />
      ) : (
        <input value={data[key]} onChange={(e) => change(key, e.target.value)} />
      )}
    </label>
  );
  return (
    <>
      <PageTitle
        title="Your portfolio. Your voice."
        description="The details that make this space yours."
      >
        <div className="editor-actions">
          <span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <button className="admin-button primary" disabled={busy} onClick={save}>
            <Save size={16} />
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </PageTitle>
      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-tabs">
        {['Identity', 'Hero & about', 'Statistics', 'Social links', 'SEO & footer'].map((t) => (
          <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="admin-form">
        {tab === 'Identity' && (
          <section>
            <div className="form-grid">
              {field('name', 'Developer name')}
              {field('monogram', 'Text logo')}
              {field('title', 'Professional title')}
              {field('email', 'Contact email')}
              {field('location', 'Location / working area')}
              {field('timezone', 'Timezone')}
              {field('availability', 'Availability message')}
              {field('resumeUrl', 'Résumé URL')}
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.available}
                onChange={(e) => change('available', e.target.checked)}
              />
              Available for projects
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.showTestimonials}
                onChange={(e) => change('showTestimonials', e.target.checked)}
              />
              Show published testimonials
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.demoMode}
                onChange={(e) => change('demoMode', e.target.checked)}
              />
              Show sample-content notice
            </label>
            <div className="form-grid">
              <ImageField label="Logo" value={data.logo} onChange={(v) => change('logo', v)} />
              <ImageField
                label="Favicon"
                value={data.favicon}
                onChange={(v) => change('favicon', v)}
              />
            </div>
          </section>
        )}
        {tab === 'Hero & about' && (
          <section>
            <label>
              Hero headline (one line per row)
              <textarea
                value={data.heroLines.join('\n')}
                onChange={(e) => change('heroLines', e.target.value.split('\n'))}
              />
            </label>
            {field('introduction', 'Hero introduction', true)}
            {field('aboutTitle', 'About heading', true)}
            {field('about', 'About text', true)}
            {field('philosophy', 'Personal philosophy', true)}
            <ImageField
              label="Hero portrait (transparent background recommended)"
              value={data.heroPortrait}
              onChange={(v) => change('heroPortrait', v)}
            />
            <ImageField
              label="Portrait"
              value={data.portrait}
              onChange={(v) => change('portrait', v)}
            />
          </section>
        )}
        {tab === 'Statistics' && (
          <section>
            <h3>Numbers with a story</h3>
            {data.stats.map((stat, i) => (
              <div className="content-block" key={i}>
                <div>
                  <span>STATISTIC {i + 1}</span>
                  <button
                    onClick={() =>
                      change(
                        'stats',
                        data.stats.filter((_, j) => i !== j),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="form-grid">
                  <label>
                    Value
                    <input
                      type="number"
                      min={0}
                      value={stat.value}
                      onChange={(e) =>
                        change(
                          'stats',
                          data.stats.map((v, j) =>
                            j === i ? { ...v, value: Number(e.target.value) } : v,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Suffix
                    <input
                      value={stat.suffix}
                      onChange={(e) =>
                        change(
                          'stats',
                          data.stats.map((v, j) =>
                            j === i ? { ...v, suffix: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  Label
                  <input
                    value={stat.label}
                    onChange={(e) =>
                      change(
                        'stats',
                        data.stats.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)),
                      )
                    }
                  />
                </label>
              </div>
            ))}
            <button
              className="admin-button"
              onClick={() => change('stats', [...data.stats, { value: 0, suffix: '+', label: '' }])}
            >
              <Plus size={15} />
              Add statistic
            </button>
          </section>
        )}
        {tab === 'Social links' && (
          <section>
            <h3>Where people can find you</h3>
            {data.socials.map((social, i) => (
              <div className="content-block" key={i}>
                <div>
                  <span>LINK {i + 1}</span>
                  <button
                    onClick={() =>
                      change(
                        'socials',
                        data.socials.filter((_, j) => j !== i),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <label>
                  Label
                  <input
                    value={social.label}
                    onChange={(e) =>
                      change(
                        'socials',
                        data.socials.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)),
                      )
                    }
                  />
                </label>
                <label>
                  URL
                  <input
                    value={social.url}
                    onChange={(e) =>
                      change(
                        'socials',
                        data.socials.map((v, j) => (j === i ? { ...v, url: e.target.value } : v)),
                      )
                    }
                  />
                </label>
              </div>
            ))}
            <button
              className="admin-button"
              onClick={() => change('socials', [...data.socials, { label: '', url: '' }])}
            >
              <Plus size={15} />
              Add social link
            </button>
          </section>
        )}
        {tab === 'SEO & footer' && (
          <section>
            {field('seoTitle', 'Default SEO title')}
            {field('seoDescription', 'Default SEO description', true)}
            {field('footerText', 'Footer statement (one line per row)', true)}
          </section>
        )}
      </div>
    </>
  );
}
