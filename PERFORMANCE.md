# Public page performance

Production public portfolio and project requests use the Next.js Data Cache with a 60-second revalidation interval. React cache also deduplicates requests within a render. Development remains uncached.

A request after the interval can receive cached content while a refresh happens in the background. Admin edits can therefore take longer than 60 seconds to appear publicly, particularly if the backend is unavailable. Authentication, admin data, and contact submissions are not cached by this change.

Pages render on request so builds do not require a running backend. The first uncached request still needs Render and Neon. If Render uses a Free instance, its idle spin-down can delay this request and contact/admin actions. An always-on backend removes that source of delay. Images fetched from the backend can also experience a cold start on a cache miss.

Deploy the updated frontend to Vercel to apply this change. No environment-variable changes are needed.
