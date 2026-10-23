import React from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Wallet,
  Check,
  Package,
} from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationsViewProps {
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onSelectOrderById: (orderId: string) => void;
  onOpenExpenses: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectOrderById,
  onOpenExpenses,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Notifications & Scheduled Reminders</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automated alerts for GeM 5-day dispatch deadlines, consignee CRAC follow-ups, overdue contract deliveries, and low office expense balances.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No system notifications or pending reminders at this time.
          </div>
        ) : (
          notifications.map((notif) => {
            const isCritical = notif.severity === 'critical';
            const isWarning = notif.severity === 'warning';

            return (
              <div
                key={notif.id}
                className={`p-5 flex items-start justify-between gap-4 transition ${
                  !notif.isRead
                    ? isCritical
                      ? 'bg-red-50/50'
                      : isWarning
                      ? 'bg-amber-50/40'
                      : 'bg-blue-50/30'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-red-100 text-red-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isCritical || isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {notif.targetModule}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>
                        {new Date(notif.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {notif.targetId && notif.targetModule === 'crm' && (
                        <button
                          onClick={() => onSelectOrderById(notif.targetId!)}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Package className="w-3 h-3" />
                          <span>View Order {notif.targetId}</span>
                        </button>
                      )}

                      {notif.targetModule === 'expenses' && (
                        <button
                          onClick={onOpenExpenses}
                          className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Wallet className="w-3 h-3" />
                          <span>Check Office Balance</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => onMarkAsRead(notif.id)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 text-xs"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
