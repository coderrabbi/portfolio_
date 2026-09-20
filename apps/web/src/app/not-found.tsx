import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">404 / OFF THE MAP</span>
      <h1>This page took a different path.</h1>
      <p>The link may have changed, or the project is no longer available.</p>
      <Link className="button primary" href="/">
        Back to the portfolio ↗
      </Link>
    </main>
  );
}
