import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';

/** Rotas que controlam seu próprio padding (conteúdo edge-to-edge). */
function isFullWidthRoute(pathname: string) {
  if (/^\/projeto\/[^/]+$/.test(pathname)) return true;
  if (/^\/projeto\/[^/]+\/item\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function MainLayout() {
  const location = useLocation();
  const fullWidth = isFullWidthRoute(location.pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Espaço fixo entre sidebar e conteúdo em todas as telas */}
      <div className={cn('flex-1 flex flex-col min-w-0', fullWidth && 'pl-4 sm:pl-5 lg:pl-6')}>
        <main className={fullWidth ? 'flex-1 overflow-auto p-0 pt-4 pr-4 pb-4 sm:pt-6 sm:pr-6 sm:pb-6 lg:pt-8 lg:pr-8 lg:pb-8' : 'flex-1 overflow-auto p-4 sm:p-6 lg:p-8'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
