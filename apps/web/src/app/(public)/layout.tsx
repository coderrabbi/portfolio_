import { ParticleBackground } from '@/components/public/particle-background';
import { AmbientPattern } from '@/components/public/ambient-pattern';
import { getPortfolio } from '@/lib/server';
import { Navbar, Footer } from '@/components/public/navigation';
import { Effects } from '@/components/public/effects';
export async function generateMetadata() {
  const { settings } = await getPortfolio();
  return { icons: { icon: settings.favicon || '/favicon.svg' } };
}
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getPortfolio();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AmbientPattern />
      <ParticleBackground />
      <Effects />
      <Navbar settings={settings} />
      {children}
      <Footer settings={settings} />
    </>
  );
}
