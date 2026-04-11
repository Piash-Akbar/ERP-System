import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { HiOutlineChevronRight } from 'react-icons/hi2';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Generate breadcrumb
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'dashboard')) return [];

    return parts.map((part, i) => ({
      name: part.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      path: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }));
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <div className="px-6 pt-4 pb-0">
              <nav className="flex items-center gap-1.5 text-[13px]">
                <Link to="/" className="text-gray-400 hover:text-primary-500">Home</Link>
                {breadcrumbs.map((crumb) => (
                  <span key={crumb.path} className="flex items-center gap-1.5">
                    <HiOutlineChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    {crumb.isLast ? (
                      <span className="text-gray-700 dark:text-gray-200 font-medium">{crumb.name}</span>
                    ) : (
                      <Link to={crumb.path} className="text-gray-400 hover:text-primary-500">{crumb.name}</Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>
          )}

          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
