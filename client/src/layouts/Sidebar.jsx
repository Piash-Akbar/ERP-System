import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HiOutlineXMark, HiOutlineChevronDown, HiOutlineChevronLeft } from 'react-icons/hi2';
import { sidebarMenu } from '../constants/navigation';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { companyName, companyLogo } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Auto-expand the menu that contains the current path
    const expanded = {};
    sidebarMenu.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) => location.pathname.startsWith(child.path));
        if (isActive) expanded[item.name] = true;
      }
    });
    return expanded;
  });

  const toggleMenu = (name) => {
    setExpandedMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isMenuActive = (item) => {
    if (item.path) return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    if (item.children) return item.children.some((child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));
    return false;
  };

  const logoUrl = companyLogo || '';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-all duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-0
          ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{companyName?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
              )}
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{companyName || 'Annex Leather'}</h1>
                <p className="text-[10px] text-gray-400 leading-tight">ERP System</p>
              </div>
            </div>
          )}
          {collapsed && (
            <>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover mx-auto" />
              ) : (
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-sm">{companyName?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
              )}
            </>
          )}
          <button onClick={onClose} className="lg:hidden ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {sidebarMenu.map((item) => {
            const active = isMenuActive(item);
            const expanded = expandedMenus[item.name];

            // Single item (no children)
            if (item.path && !item.children) {
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium mb-0.5 transition-colors
                    ${active
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            }

            // Parent with children
            return (
              <div key={item.name} className="mb-0.5">
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors
                    ${active
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      <HiOutlineChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {/* Sub-menu */}
                {!collapsed && expanded && (
                  <div className="ml-4 mt-0.5 border-l-2 border-gray-100 dark:border-gray-700 pl-3">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] mb-0.5 transition-colors
                            ${childActive
                              ? 'text-primary-600 font-semibold bg-primary-50'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${childActive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                          <span>{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2.5 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
          >
            <HiOutlineChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
