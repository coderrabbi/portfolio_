'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@gr/shared';
import type { z } from 'zod';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
export function ContactForm() {
  const [sent, setSent] = useState(false),
    [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof contactSchema>, unknown, z.output<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { website: '' },
  });
  if (sent)
    return (
      <div className="contact-success" role="status">
        <CheckCircle2 size={40} />
        <h3>Message received.</h3>
        <p>Thanks for sharing your idea. I’ll be in touch soon.</p>
        <button className="text-link" onClick={() => setSent(false)}>
          Send another message ↗
        </button>
      </div>
    );
  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit(async (data) => {
        setError('');
        try {
          await api('/contact', { method: 'POST', body: JSON.stringify(data) });
          setSent(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Please try again.');
        }
      })}
    >
      <div className="form-grid">
        {[
          { name: 'name' as const, label: 'Your name', placeholder: 'How should I call you?' },
          { name: 'email' as const, label: 'Email address', placeholder: 'you@company.com' },
          {
            name: 'company' as const,
            label: 'Company (optional)',
            placeholder: 'Your company or studio',
          },
        ].map((f) => (
          <label key={f.name}>
            {f.label}
            <input
              {...register(f.name)}
              type={f.name === 'email' ? 'email' : 'text'}
              placeholder={f.placeholder}
              aria-invalid={!!errors[f.name]}
            />
            {errors[f.name] && <span className="field-error">{errors[f.name]?.message}</span>}
          </label>
        ))}
        <label>
          Project type
          <select {...register('projectType')} defaultValue="">
            <option value="" disabled>
              Select a service
            </option>
            {[
              'WordPress / WooCommerce',
              'Creative frontend',
              'Full-stack application',
              'Website redesign',
              'Something else',
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {errors.projectType && <span className="field-error">Choose a project type.</span>}
        </label>
      </div>
      <label>
        Budget range (optional)
        <select {...register('budget')} defaultValue="">
          <option value="">Let’s discuss</option>
          <option>$500–$1,500</option>
          <option>$1,500–$5,000</option>
          <option>$5,000+</option>
        </select>
      </label>
      <label>
        Tell me about your idea
        <textarea
          {...register('message')}
          rows={4}
          placeholder="What are you looking to create?"
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <span className="field-error">
            Please tell me a little more (at least 20 characters).
          </span>
        )}
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input {...register('website')} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send your message'}
        <ArrowUpRight size={19} />
      </button>
      <p className="form-note">Your details are used only to respond to your inquiry.</p>
    </form>
  );
}
