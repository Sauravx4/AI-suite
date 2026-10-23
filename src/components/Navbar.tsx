import React, { useState } from 'react';
import {
  Bell,
  Search,
  Plus,
  Shield,
  User,
  ExternalLink,
  ChevronRight,
  Package,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Menu,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile, SystemNotification } from '../types';

interface NavbarProps {
  currentModule: string;
  user: UserProfile;
  notifications: SystemNotification[];
  onSelectModule: (module: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewExpense: () => void;
  onOpenNewAdvance: () => void;
  onSwitchRole: (role: 'admin' | 'staff') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNotificationClick: (notif: SystemNotification) => void;
  onOpenMobileMenu?: () => void;
  lastSavedTime?: string;
  cloudUserEmail?: string | null;
  onCloudSignIn?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  user,
  notifications,
  onSelectModule,
  onOpenNewOrder,
  onOpenNewExpense,
  onOpenNewAdvance,
  onSwitchRole,
  searchQuery,
  setSearchQuery,
  onNotificationClick,
  onOpenMobileMenu,
  lastSavedTime,
  cloudUserEmail,
  onCloudSignIn,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getModuleTitle = () => {
    switch (currentModule) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'crm':
        return 'INDOSATI CRM (GeM Orders)';
      case 'expenses':
        return 'Daily Expense & Fund Management';
      case 'reports':
        return 'Reports & Analytics';
      case 'notifications':
        return 'System Notifications';
      case 'settings':
        return 'Settings & Data Architecture';
      default:
        return 'INDOSATI Suite';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile menu"
          className="flex md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <button
            onClick={() => onSelectModule('dashboard')}
            className="hover:text-blue-700 font-medium transition"
          >
            INDOSATI Office
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{getModuleTitle()}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search GeM order #, buyer org, expense description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Quick Add & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Live Auto-Save & Cloud Database Indicator */}
        {cloudUserEmail ? (
          <button
            onClick={() => onSelectModule('settings')}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
            title={`Synced with Firebase Cloud DB (${cloudUserEmail})`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cloud DB Saved {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5">
            <span
              onClick={() => onSelectModule('settings')}
              className="cursor-pointer flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800"
              title="All work is automatically saved to your persistent database vault"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auto-Saved {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
            </span>
            {onCloudSignIn && (
              <button
                onClick={onCloudSignIn}
                className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                title="Sign in with Google to sync across devices via Firebase Firestore"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cloud Sync</span>
              </button>
            )}
          </div>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton variant="navbar" />

        {/* Quick Add Menu */}
        <div className="relative">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {showQuickAdd && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-100 z-50 text-xs"
              onClick={() => setShowQuickAdd(false)}
            >
              <button
                onClick={onOpenNewOrder}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left font-medium"
              >
                <Package className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold">New GeM Order</div>
                  <div className="text-[10px] text-slate-400">Add buyer contract & deadline</div>
                </div>
              </button>
              <button
                onClick={onOpenNewExpense}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left font-medium"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-semibold">New Daily Expense</div>
                  <div className="text-[10px] text-slate-400">Record cash/UPI expense</div>
                </div>
              </button>
              <button
                onClick={onOpenNewAdvance}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left font-medium"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold">Record Advance Fund</div>
                  <div className="text-[10px] text-slate-400">Deposit office operational cash</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications & Alerts</span>
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    onSelectModule('notifications');
                  }}
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No active alerts.</div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onNotificationClick(n);
                        setShowNotifMenu(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        n.severity === 'critical'
                          ? 'border-red-200 bg-red-50/60 hover:bg-red-50'
                          : n.severity === 'warning'
                          ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-50'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {n.severity === 'critical' || n.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 leading-snug">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role & Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 hover:bg-slate-100 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white shadow-xs">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-blue-600">
                {user.role}
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-50 text-xs"
              onClick={() => setShowProfileMenu(false)}
            >
              <div className="border-b border-slate-100 pb-2 mb-2">
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-slate-500 text-[11px]">{user.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  <Shield className="w-3 h-3 text-blue-600" />
                  Role: {user.role.toUpperCase()}
                </div>
              </div>

              {/* Role Toggle for RBAC Testing */}
              <div className="bg-slate-50 p-2 rounded-xl mb-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Test Authorization Mode
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchRole('admin');
                    }}
                    className={`rounded-lg py-1 px-2 text-center text-xs font-semibold transition ${
                      user.role === 'admin'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchRole('staff');
                    }}
                    className={`rounded-lg py-1 px-2 text-center text-xs font-semibold transition ${
                      user.role === 'staff'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>

              <button
                onClick={() => onSelectModule('settings')}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-slate-700 hover:bg-slate-100 text-left font-medium"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Data & Security Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
