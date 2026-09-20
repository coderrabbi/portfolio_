export default function Loading() {
  return (
    <main className="error-page" aria-label="Loading page">
      <div className="skeleton" style={{ width: '65%', height: 70 }} />
      <div className="skeleton" style={{ width: '100%', height: 300 }} />
    </main>
  );
}
