'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, Search, Trash2, Copy, Check, ImagePlus } from 'lucide-react';
import type { MediaRecord } from '@gr/shared';
import { api } from '@/lib/api';
import { useToast } from './provider';
import { Loading, ErrorState, EmptyState, Pagination, ConfirmDialog, Modal } from './ui';
export function MediaLibrary({ onSelect }: { onSelect?: (media: MediaRecord) => void }) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [remove, setRemove] = useState<MediaRecord | null>(null);
  const toast = useToast(),
    client = useQueryClient();
  const q = useQuery({
    queryKey: ['media', page, search],
    queryFn: () => api<MediaRecord[]>(`/media?page=${page}&q=${encodeURIComponent(search)}`),
  });
  async function upload(files: FileList | File[]) {
    if (!files.length) return;
    if (files.length > 8) {
      toast('Choose up to 8 images at a time.');
      return;
    }
    setBusy(true);
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));
    try {
      await api('/media', { method: 'POST', body: form });
      await client.invalidateQueries({ queryKey: ['media'] });
      toast('Images uploaded and optimized.');
      setPage(1);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <label
        className={`drop-zone ${drag ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!busy) upload(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={28} />
        <strong>
          {busy ? 'Uploading and optimizing…' : 'Drop your images here, or browse files'}
        </strong>
        <span>JPEG, PNG, WebP, AVIF · up to 10 MB each · 8 images per batch</span>
        <input
          aria-label="Upload images"
          disabled={busy}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search media"
            placeholder="Search your media…"
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
      ) : !q.data.data.length ? (
        <EmptyState
          title="Your media library starts here"
          description="Upload your first project image above."
        />
      ) : (
        <>
          <div className="media-grid">
            {q.data.data.map((m) => (
              <article key={m.id} className="media-card">
                <div className="media-thumb">
                  <Image src={m.url} alt={m.alt} fill sizes="250px" />
                </div>
                <div className="media-info">
                  <strong>{m.name}</strong>
                  <span>
                    {m.width} × {m.height} · {Math.round(m.size / 1024)} KB
                  </span>
                  <div className="media-actions">
                    {onSelect ? (
                      <button onClick={() => onSelect(m)}>
                        <Check size={14} /> Select
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              new URL(m.url, location.origin).href,
                            );
                            toast('Media URL copied.');
                          } catch {
                            toast('Copy unavailable. Open the image to copy its URL.');
                          }
                        }}
                        aria-label="Copy media URL"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                    <a href={m.url} target="_blank" rel="noreferrer">
                      Preview ↗
                    </a>
                    <button onClick={() => setRemove(m)} aria-label="Delete media">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <label className="media-alt-label">
                    Alt text
                    <input
                      defaultValue={m.alt}
                      onBlur={async (e) => {
                        if (e.target.value === m.alt) return;
                        try {
                          await api(`/media/${m.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ alt: e.target.value }),
                          });
                          toast('Alt text saved.');
                        } catch (e) {
                          toast(e instanceof Error ? e.message : 'Unable to save.');
                        }
                      }}
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} pages={q.data.pages || 1} onChange={setPage} />
        </>
      )}
      {remove && (
        <ConfirmDialog
          title="Delete this image?"
          description="This removes the file permanently. Images currently used by projects or settings cannot be deleted."
          onCancel={() => setRemove(null)}
          busy={busy}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api(`/media/${remove.id}`, { method: 'DELETE' });
              await client.invalidateQueries({ queryKey: ['media'] });
              setRemove(null);
              toast('Image deleted.');
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
export function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (m: MediaRecord) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Choose an image" onClose={onClose} wide>
      <MediaLibrary
        onSelect={(m) => {
          onSelect(m);
          onClose();
        }}
      />
    </Modal>
  );
}
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label>{label}</label>
      {value ? (
        <div className="selected-image">
          <Image src={value} alt={label} fill sizes="400px" />
          <button type="button" onClick={() => onChange('')} aria-label={`Remove ${label}`}>
            ×
          </button>
        </div>
      ) : null}
      <button className="media-picker-button" type="button" onClick={() => setOpen(true)}>
        <ImagePlus size={18} />
        {value ? 'Change image' : 'Choose or upload image'}
      </button>
      {open && <MediaPicker onClose={() => setOpen(false)} onSelect={(m) => onChange(m.url)} />}
    </div>
  );
}
