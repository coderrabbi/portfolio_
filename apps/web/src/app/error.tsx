'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow">A SMALL INTERRUPTION</span>
      <h1>Let’s try that again.</h1>
      <p>The portfolio is temporarily unavailable. Please try again in a moment.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <a href="/">Return home</a>
    </main>
  );
}
