import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  X,
  Boxes,
  Plus,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { DashboardStats, LinkedAppModule } from '../types';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  stats: DashboardStats | null;
  unreadCount: number;
  linkedApps?: LinkedAppModule[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  stats,
  unreadCount,
  linkedApps = [],
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'crm',
      label: 'INDOSATI CRM',
      icon: Layers,
      badge: stats?.crm?.pendingDispatches ? `${stats.crm.pendingDispatches} due` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'expenses',
      label: 'Daily Expenses',
      icon: Wallet,
      badge: stats?.expenses?.isLowBalance ? 'Low Fund' : null,
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'settings',
      label: 'Settings & DB',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 md:static md:z-30 shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-18' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-sky-500 text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>

            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none truncate">
                  INDOSATI
                </span>
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mt-0.5">
                  Office Suite
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="flex md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                />

                {(!collapsed || isMobileOpen) && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold border ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* Connected / Linked Management Apps Section */}
          {linkedApps.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
              {(!collapsed || isMobileOpen) && (
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Connected Modules
                  </span>
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                    title="Link or create more management apps"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              )}

              {linkedApps.map((appItem) => {
                const modKey = `app:${appItem.id}`;
                const isActive = currentModule === modKey;
                return (
                  <button
                    key={appItem.id}
                    onClick={() => handleNavClick(modKey)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-900'
                    }`}
                    title={appItem.name}
                  >
                    <Boxes
                      className={`w-4 h-4 shrink-0 transition ${
                        isActive ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-700'
                      }`}
                    />
                    {(!collapsed || isMobileOpen) && (
                      <span className="truncate text-left flex-1">{appItem.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer / Quick PWA Status */}
        {(!collapsed || isMobileOpen) && (
          <div className="p-3 border-t border-slate-100 space-y-2">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Unified Office DB</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Single shared session & synchronized records between CRM and Expenses.
              </p>
            </div>
            <PWAInstallButton variant="sidebar" />
          </div>
        )}
      </aside>
    </>
  );
};
