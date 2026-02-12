import { Outlet, useLocation } from 'react-router-dom';
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
      <div className="flex-1 flex flex-col min-w-0">
        <main className={fullWidth ? 'flex-1 overflow-auto p-0' : 'flex-1 overflow-auto p-4 sm:p-6 lg:p-8'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
