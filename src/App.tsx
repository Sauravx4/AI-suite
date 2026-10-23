import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CRMView } from './components/CRMView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { LinkedAppView } from './components/LinkedAppView';
import { NewOrderModal } from './components/NewOrderModal';
import { NewExpenseModal } from './components/NewExpenseModal';
import { NewAdvanceModal } from './components/NewAdvanceModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  GeMOrder,
  ExpenseRecord,
  AdvanceRecord,
  DashboardStats,
  SystemNotification,
  UserProfile,
  ExpensePerson,
  LinkedAppModule,
} from './types';
import {
  saveToLocalVault,
  loadFromLocalVault,
  signInWithGoogle,
  signOutFromCloud,
  subscribeToAuth,
  saveWorkspaceToFirestore,
  loadWorkspaceFromFirestore,
} from './lib/firebase';

export default function App() {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<GeMOrder[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(500);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'Logistics & Dispatch',
    'Packaging & Materials',
    'Office Rent & Utilities',
    'Travel & Buyer Visit',
    'Stationery & Printing',
    'Tea & Refreshments',
    'Staff Advance',
    'Maintenance & IT',
    'Other',
  ]);
  const [expensePersons, setExpensePersons] = useState<ExpensePerson[]>([]);
  const [linkedApps, setLinkedApps] = useState<LinkedAppModule[]>([]);

  // Cloud & Persistence states
  const [cloudUser, setCloudUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const hasHydratedRef = useRef(false);

  const [user, setUser] = useState<UserProfile>({
    id: 'USR-01',
    name: 'Saurav Mourya',
    email: 'sauravmourya54@gmail.com',
    role: 'admin',
    organization: 'INDOSATI Technologies',
  });

  // Modal states
  const [activeSelectedOrder, setActiveSelectedOrder] = useState<GeMOrder | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [isNewAdvanceOpen, setIsNewAdvanceOpen] = useState(false);
  const [preselectedOrderId, setPreselectedOrderId] = useState<string | undefined>(undefined);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Persist current server snapshot to LocalStorage Vault + Firebase Cloud Firestore
  const persistSnapshotEverywhere = useCallback(
    async (explicitUid?: string) => {
      try {
        const snapRes = await fetch('/api/sync/snapshot').then((r) => r.json());
        if (snapRes?.snapshot) {
          saveToLocalVault(snapRes.snapshot);
          const timeLabel = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastSavedTime(timeLabel);

          const targetUid = explicitUid || cloudUser?.uid;
          if (targetUid) {
            await saveWorkspaceToFirestore(targetUid, snapRes.snapshot);
          }
        }
      } catch (err) {
        console.error('Auto-save persistence error:', err);
      }
    },
    [cloudUser]
  );

  // Fetch all live data (and optionally persist after user modification)
  const fetchData = useCallback(
    async (refreshOrderId?: string, shouldPersist = false) => {
      try {
        const [statsRes, ordersRes, expensesRes, advancesRes, notifsRes, userRes, configRes] =
          await Promise.all([
            fetch('/api/dashboard/stats').then((r) => r.json()),
            fetch('/api/crm/orders').then((r) => r.json()),
            fetch('/api/expenses').then((r) => r.json()),
            fetch('/api/advances').then((r) => r.json()),
            fetch('/api/notifications').then((r) => r.json()),
            fetch('/api/auth/me').then((r) => r.json()),
            fetch('/api/settings/config').then((r) => r.json()),
          ]);

        if (statsRes) setStats(statsRes);
        if (ordersRes?.orders) setOrders(ordersRes.orders);
        if (expensesRes?.expenses) setExpenses(expensesRes.expenses);
        if (advancesRes?.advances) setAdvances(advancesRes.advances);
        if (configRes) {
          if (typeof configRes.openingBalance === 'number') {
            setOpeningBalance(configRes.openingBalance);
          }
          if (Array.isArray(configRes.expenseCategories)) {
            setExpenseCategories(configRes.expenseCategories);
          }
          if (Array.isArray(configRes.expensePersons)) {
            setExpensePersons(configRes.expensePersons);
          }
          if (Array.isArray(configRes.linkedApps)) {
            setLinkedApps(configRes.linkedApps);
          }
        } else if (advancesRes?.fundSummary) {
          setOpeningBalance(advancesRes.fundSummary.openingBalance ?? 500);
        }
        if (notifsRes?.notifications) setNotifications(notifsRes.notifications);
        if (userRes?.user) setUser(userRes.user);

        if (refreshOrderId) {
          const detailRes = await fetch(`/api/crm/orders/${refreshOrderId}`).then((r) => r.json());
          if (detailRes?.order) setActiveSelectedOrder(detailRes.order);
        }

        if (shouldPersist) {
          await persistSnapshotEverywhere();
        }
      } catch (err) {
        console.error('Failed to fetch suite data:', err);
      }
    },
    [persistSnapshotEverywhere]
  );

  // Initial Boot & Automatic Recovery from Local Vault / Cloud DB if server restarted
  useEffect(() => {
    async function bootAndHydrate() {
      if (hasHydratedRef.current) return;
      hasHydratedRef.current = true;

      try {
        const localVault = loadFromLocalVault();
        const snapRes = await fetch('/api/sync/snapshot').then((r) => r.json());
        const serverSnap = snapRes?.snapshot;

        if (localVault && serverSnap) {
          const serverTime = serverSnap.savedAt ? new Date(serverSnap.savedAt).getTime() : 0;
          const localTime = localVault.savedAt ? new Date(localVault.savedAt).getTime() : 0;

          // If server restarted with default un-modified DB or localVault is newer, restore immediately!
          if (!serverSnap.userModified || localTime > serverTime) {
            await fetch('/api/sync/hydrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localVault),
            });
          } else {
            saveToLocalVault(serverSnap);
          }
        } else if (serverSnap) {
          saveToLocalVault(serverSnap);
        }

        setLastSavedTime(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch (err) {
        console.error('Boot hydration check failed:', err);
      }

      await fetchData(undefined, false);
    }

    bootAndHydrate();
  }, [fetchData]);

  // Subscribe to Firebase Authentication & Cloud Firestore Sync
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (fbUser) => {
      if (fbUser) {
        setCloudUser({ uid: fbUser.uid, email: fbUser.email });
        try {
          const cloudSnap = await loadWorkspaceFromFirestore(fbUser.uid);
          const localVault = loadFromLocalVault();
          const localTime = localVault?.savedAt ? new Date(localVault.savedAt).getTime() : 0;
          const cloudTime = cloudSnap?.savedAt ? new Date(cloudSnap.savedAt).getTime() : 0;

          if (cloudSnap && (!localVault || cloudTime > localTime)) {
            await fetch('/api/sync/hydrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cloudSnap),
            });
            saveToLocalVault(cloudSnap);
            await fetchData(undefined, false);
          } else {
            await persistSnapshotEverywhere(fbUser.uid);
          }
        } catch (err) {
          console.error('Cloud sync on auth state change:', err);
        }
      } else {
        setCloudUser(null);
      }
    });
    return () => unsubscribe();
  }, [fetchData, persistSnapshotEverywhere]);

  const handleCloudSignIn = async () => {
    try {
      const fbUser = await signInWithGoogle();
      setCloudUser({ uid: fbUser.uid, email: fbUser.email });
      await persistSnapshotEverywhere(fbUser.uid);
      showToast(`Connected to Firebase Cloud Database (${fbUser.email})!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Google Cloud sign-in cancelled', 'info');
    }
  };

  const handleCloudSignOut = async () => {
    await signOutFromCloud();
    setCloudUser(null);
    showToast('Disconnected from Google Cloud sync (Local Auto-Save remains active)', 'info');
  };

  const handleForceCloudSync = async () => {
    await persistSnapshotEverywhere();
    showToast('All data saved to Cloud Firestore & Local Database Vault!', 'success');
  };

  // Auth role switch
  const handleSwitchRole = async (role: 'admin' | 'staff') => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        showToast(`User role switched to ${role.toUpperCase()}`, 'info');
      }
    } catch (err) {
      showToast('Failed to switch role', 'error');
    }
  };

  // CRM Order actions
  const handleCreateOrder = async (orderData: any) => {
    const res = await fetch('/api/crm/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create order');
    }
    showToast(`GeM Order ${data.order.id} created & saved permanently!`, 'success');
    await fetchData(undefined, true);
  };

  const handleUpdateOrderStatus = async (orderId: string, statusData: any) => {
    const res = await fetch(`/api/crm/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData),
    });
    if (res.ok) {
      showToast(`Order ${orderId} updated & saved!`, 'success');
      await fetchData(orderId, true);
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to update order', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await fetch(`/api/crm/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast(`Order ${orderId} deleted`, 'info');
      if (activeSelectedOrder?.id === orderId) {
        setActiveSelectedOrder(null);
      }
      await fetchData(undefined, true);
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to delete order', 'error');
    }
  };

  const handleAddPayment = async (orderId: string, paymentData: any) => {
    const res = await fetch(`/api/crm/orders/${orderId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to record payment');
    }
    showToast('Payment receipt recorded & saved permanently!', 'success');
    await fetchData(orderId, true);
  };

  const handleDeletePayment = async (orderId: string, pmtId: string) => {
    const res = await fetch(`/api/crm/orders/${orderId}/payments/${pmtId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast('Payment deleted and balance adjusted', 'info');
      await fetchData(orderId, true);
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to delete payment', 'error');
    }
  };

  // Expense actions (Create or Edit)
  const handleSaveExpense = async (expenseData: any, editingId?: string) => {
    if (editingId) {
      const res = await fetch(`/api/expenses/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update expense');
      }
      showToast(`Expense ${editingId} updated & saved!`, 'success');
    } else {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record expense');
      }
      showToast(
        `Expense saved! Available Balance: ₹${data.fundSummary.availableBalance.toLocaleString('en-IN')}`,
        'success'
      );
    }
    setPreselectedOrderId(undefined);
    setEditingExpense(null);
    await fetchData(undefined, true);
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast('Expense record deleted and fund balance updated', 'info');
      await fetchData(undefined, true);
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to delete expense', 'error');
    }
  };

  // Advance actions
  const handleCreateAdvance = async (advanceData: any) => {
    const res = await fetch('/api/advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advanceData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to record advance');
    }
    showToast(
      `Advance funds saved! Available Balance: ₹${data.fundSummary.availableBalance.toLocaleString('en-IN')}`,
      'success'
    );
    await fetchData(undefined, true);
  };

  const handleDeleteAdvance = async (id: string) => {
    const res = await fetch(`/api/advances/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast('Advance entry deleted', 'info');
      await fetchData(undefined, true);
    } else {
      const d = await res.json();
      showToast(d.error || 'Failed to delete advance', 'error');
    }
  };

  // Settings & Custom Config actions
  const handleUpdateOpeningBalance = async (newBalance: number) => {
    const res = await fetch('/api/settings/opening-balance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingBalance: newBalance }),
    });
    const data = await res.json();
    if (res.ok) {
      setOpeningBalance(data.openingBalance);
      showToast(
        `Opening balance updated to ₹${Number(newBalance).toLocaleString('en-IN')} & saved!`,
        'success'
      );
      await fetchData(undefined, true);
    } else {
      showToast(data.error || 'Failed to update opening balance', 'error');
    }
  };

  const handleAddCategory = async (name: string) => {
    const res = await fetch('/api/settings/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      setExpenseCategories(data.expenseCategories);
      showToast(`Expense category "${name}" added & saved!`, 'success');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to add category', 'error');
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const res = await fetch('/api/settings/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName }),
    });
    const data = await res.json();
    if (res.ok) {
      setExpenseCategories(data.expenseCategories);
      showToast(`Category renamed to "${newName}" & saved!`, 'success');
      await fetchData(undefined, true);
    } else {
      showToast(data.error || 'Failed to rename category', 'error');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    const res = await fetch(`/api/settings/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      setExpenseCategories(data.expenseCategories);
      showToast(`Category "${name}" removed`, 'info');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to remove category', 'error');
    }
  };

  const handleAddPerson = async (person: { name: string; roleOrDept: string; phone?: string }) => {
    const res = await fetch('/api/settings/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    const data = await res.json();
    if (res.ok) {
      setExpensePersons(data.expensePersons);
      showToast(`Expense person "${person.name}" added & saved!`, 'success');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to add expense person', 'error');
    }
  };

  const handleUpdatePerson = async (
    id: string,
    person: { name: string; roleOrDept: string; phone?: string }
  ) => {
    const res = await fetch(`/api/settings/persons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    const data = await res.json();
    if (res.ok) {
      setExpensePersons(data.expensePersons);
      showToast(`Updated details for "${person.name}" & saved!`, 'success');
      await fetchData(undefined, true);
    } else {
      showToast(data.error || 'Failed to update person', 'error');
    }
  };

  const handleDeletePerson = async (id: string) => {
    const res = await fetch(`/api/settings/persons/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      setExpensePersons(data.expensePersons);
      showToast('Person removed from expense roster', 'info');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to delete person', 'error');
    }
  };

  const handleAddLinkedApp = async (appData: Partial<LinkedAppModule>) => {
    const res = await fetch('/api/settings/linked-apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData),
    });
    const data = await res.json();
    if (res.ok) {
      setLinkedApps(data.linkedApps);
      showToast(`Module "${appData.name}" linked & saved permanently!`, 'success');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to link application module', 'error');
    }
  };

  const handleUpdateLinkedApp = async (id: string, updates: Partial<LinkedAppModule>) => {
    const res = await fetch(`/api/settings/linked-apps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok) {
      setLinkedApps(data.linkedApps);
      showToast('Module records updated & saved!', 'success');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to update module', 'error');
    }
  };

  const handleDeleteLinkedApp = async (id: string) => {
    const res = await fetch(`/api/settings/linked-apps/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      setLinkedApps(data.linkedApps);
      if (currentModule === `app:${id}`) {
        setCurrentModule('dashboard');
      }
      showToast('Connected module removed from suite', 'info');
      await persistSnapshotEverywhere();
    } else {
      showToast(data.error || 'Failed to remove module', 'error');
    }
  };

  // Notifications
  const handleMarkNotifAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await persistSnapshotEverywhere();
  };

  const handleMarkAllNotifsAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
    await persistSnapshotEverywhere();
  };

  const handleSelectOrderById = async (orderId: string) => {
    try {
      const res = await fetch(`/api/crm/orders/${orderId}`);
      const data = await res.json();
      if (data?.order) {
        setActiveSelectedOrder(data.order);
        setCurrentModule('crm');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNewExpenseForOrder = (orderId: string) => {
    setEditingExpense(null);
    setPreselectedOrderId(orderId);
    setIsNewExpenseOpen(true);
  };

  // Check if currentModule is a connected app module
  const activeLinkedApp = currentModule.startsWith('app:')
    ? linkedApps.find((a) => `app:${a.id}` === currentModule)
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        stats={stats}
        unreadCount={notifications.filter((n) => !n.isRead).length}
        linkedApps={linkedApps}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          currentModule={currentModule}
          user={user}
          notifications={notifications}
          onSelectModule={setCurrentModule}
          onOpenNewOrder={() => setIsNewOrderOpen(true)}
          onOpenNewExpense={() => {
            setEditingExpense(null);
            setPreselectedOrderId(undefined);
            setIsNewExpenseOpen(true);
          }}
          onOpenNewAdvance={() => setIsNewAdvanceOpen(true)}
          onSwitchRole={handleSwitchRole}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          lastSavedTime={lastSavedTime}
          cloudUserEmail={cloudUser?.email}
          onCloudSignIn={handleCloudSignIn}
          onNotificationClick={(notif) => {
            if (notif.targetModule === 'crm' && notif.targetId) {
              handleSelectOrderById(notif.targetId);
            } else if (notif.targetModule === 'expenses') {
              setCurrentModule('expenses');
            } else {
              setCurrentModule('notifications');
            }
          }}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-12">
          {currentModule === 'dashboard' && (
            <DashboardView
              stats={stats}
              orders={orders}
              expenses={expenses}
              notifications={notifications}
              linkedApps={linkedApps}
              onOpenCRM={() => setCurrentModule('crm')}
              onOpenExpenses={() => setCurrentModule('expenses')}
              onOpenNewOrder={() => setIsNewOrderOpen(true)}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setPreselectedOrderId(undefined);
                setIsNewExpenseOpen(true);
              }}
              onSelectOrder={(order) => {
                handleSelectOrderById(order.id);
              }}
              onOpenLinkedApp={(appItem) => setCurrentModule(`app:${appItem.id}`)}
              onOpenSettings={() => setCurrentModule('settings')}
            />
          )}

          {currentModule === 'crm' && (
            <CRMView
              orders={orders}
              user={user}
              searchQuery={searchQuery}
              onRefresh={() => fetchData(undefined, true)}
              onOpenNewOrder={() => setIsNewOrderOpen(true)}
              onSelectOrder={(order) => handleSelectOrderById(order.id)}
              selectedOrder={activeSelectedOrder}
              onCloseOrderDetails={() => setActiveSelectedOrder(null)}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onOpenNewExpenseForOrder={handleOpenNewExpenseForOrder}
            />
          )}

          {currentModule === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              advances={advances}
              orders={orders}
              openingBalance={openingBalance}
              categories={expenseCategories}
              expensePersons={expensePersons}
              user={user}
              searchQuery={searchQuery}
              onRefresh={() => fetchData(undefined, true)}
              onOpenNewExpense={(orderId) => {
                setEditingExpense(null);
                setPreselectedOrderId(orderId);
                setIsNewExpenseOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setIsNewExpenseOpen(true);
              }}
              onOpenNewAdvance={() => setIsNewAdvanceOpen(true)}
              onDeleteExpense={handleDeleteExpense}
              onDeleteAdvance={handleDeleteAdvance}
              onUpdateOpeningBalance={handleUpdateOpeningBalance}
              onAddCategory={handleAddCategory}
              onOpenSettings={() => setCurrentModule('settings')}
              onSelectOrderById={handleSelectOrderById}
            />
          )}

          {currentModule === 'reports' && (
            <ReportsView
              orders={orders}
              expenses={expenses}
              advances={advances}
              stats={stats}
              openingBalance={openingBalance}
            />
          )}

          {currentModule === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkAsRead={handleMarkNotifAsRead}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onSelectOrderById={handleSelectOrderById}
              onOpenExpenses={() => setCurrentModule('expenses')}
            />
          )}

          {currentModule === 'settings' && (
            <SettingsView
              user={user}
              openingBalance={openingBalance}
              categories={expenseCategories}
              expensePersons={expensePersons}
              linkedApps={linkedApps}
              onSwitchRole={handleSwitchRole}
              onUpdateOpeningBalance={handleUpdateOpeningBalance}
              onAddCategory={handleAddCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddPerson={handleAddPerson}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              onAddLinkedApp={handleAddLinkedApp}
              onDeleteLinkedApp={handleDeleteLinkedApp}
              onOpenLinkedApp={(appItem) => setCurrentModule(`app:${appItem.id}`)}
              onRefreshData={() => fetchData(undefined, true)}
              cloudUserEmail={cloudUser?.email}
              lastSavedTime={lastSavedTime}
              onCloudSignIn={handleCloudSignIn}
              onCloudSignOut={handleCloudSignOut}
              onForceCloudSync={handleForceCloudSync}
            />
          )}

          {activeLinkedApp && (
            <LinkedAppView
              appModule={activeLinkedApp}
              onBackToDashboard={() => setCurrentModule('dashboard')}
              onOpenSettings={() => setCurrentModule('settings')}
              onUpdateAppModule={handleUpdateLinkedApp}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => {
          setIsNewExpenseOpen(false);
          setEditingExpense(null);
          setPreselectedOrderId(undefined);
        }}
        onSubmit={handleSaveExpense}
        orders={orders}
        categories={expenseCategories}
        expensePersons={expensePersons}
        preselectedOrderId={preselectedOrderId}
        defaultMadeBy={user.name}
        editingExpense={editingExpense}
      />

      <NewAdvanceModal
        isOpen={isNewAdvanceOpen}
        onClose={() => setIsNewAdvanceOpen(false)}
        onSubmit={handleCreateAdvance}
      />

      {/* Offline Status Warning Indicator */}
      <OfflineIndicator />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-2xl transition animate-slide-up ${
            toast.type === 'error'
              ? 'bg-red-600'
              : toast.type === 'info'
              ? 'bg-blue-600'
              : 'bg-emerald-600'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
