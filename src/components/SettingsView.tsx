import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  Download,
  Upload,
  Monitor,
  CheckCircle2,
  FileCode,
  Server,
  Tag,
  UserCheck,
  Wallet,
  Plus,
  Edit,
  Trash2,
  Check,
  Boxes,
  ExternalLink,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import { UserProfile, ExpensePerson, LinkedAppModule } from '../types';
import { formatINR } from '../lib/calculations';

interface SettingsViewProps {
  user: UserProfile;
  openingBalance: number;
  categories: string[];
  expensePersons: ExpensePerson[];
  linkedApps: LinkedAppModule[];
  onSwitchRole: (role: 'admin' | 'staff') => void;
  onUpdateOpeningBalance: (amount: number) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onAddPerson: (person: { name: string; roleOrDept: string; phone?: string }) => Promise<void>;
  onUpdatePerson: (
    id: string,
    person: { name: string; roleOrDept: string; phone?: string }
  ) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onAddLinkedApp: (appData: Partial<LinkedAppModule>) => Promise<void>;
  onDeleteLinkedApp: (id: string) => Promise<void>;
  onOpenLinkedApp: (app: LinkedAppModule) => void;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  openingBalance,
  categories,
  expensePersons,
  linkedApps,
  onSwitchRole,
  onUpdateOpeningBalance,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onAddLinkedApp,
  onDeleteLinkedApp,
  onOpenLinkedApp,
  onRefreshData,
}) => {
  // Opening balance state
  const [balanceInput, setBalanceInput] = useState<string>(String(openingBalance));
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  // Category management state
  const [newCategory, setNewCategory] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  // Expense Person management state
  const [personName, setPersonName] = useState('');
  const [personDept, setPersonDept] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonDept, setEditPersonDept] = useState('');
  const [editPersonPhone, setEditPersonPhone] = useState('');

  // Future Linked App / Module Builder state
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [appName, setAppName] = useState('');
  const [appCategory, setAppCategory] = useState('Operations & Inventory');
  const [appDesc, setAppDesc] = useState('');
  const [appMode, setAppMode] = useState<'internal_workspace' | 'iframe_embed' | 'external_link'>(
    'internal_workspace'
  );
  const [appUrl, setAppUrl] = useState('');

  // Backup restore state
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);

  React.useEffect(() => {
    setBalanceInput(String(openingBalance));
  }, [openingBalance]);

  const handleSaveOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(balanceInput);
    if (isNaN(num) || num < 0) return;
    setIsSavingBalance(true);
    try {
      await onUpdateOpeningBalance(num);
    } finally {
      setIsSavingBalance(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await onAddCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleSaveCategoryRename = async (oldName: string) => {
    if (!editingCatValue.trim() || editingCatValue.trim() === oldName) {
      setEditingCat(null);
      return;
    }
    await onRenameCategory(oldName, editingCatValue.trim());
    setEditingCat(null);
  };

  const handleAddPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;
    await onAddPerson({
      name: personName.trim(),
      roleOrDept: personDept.trim() || 'Office Staff',
      phone: personPhone.trim(),
    });
    setPersonName('');
    setPersonDept('');
    setPersonPhone('');
  };

  const handleSavePersonEdit = async (id: string) => {
    if (!editPersonName.trim()) return;
    await onUpdatePerson(id, {
      name: editPersonName.trim(),
      roleOrDept: editPersonDept.trim() || 'Office Staff',
      phone: editPersonPhone.trim(),
    });
    setEditingPersonId(null);
  };

  const handleCreateAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    await onAddLinkedApp({
      name: appName.trim(),
      category: appCategory.trim(),
      shortDescription:
        appDesc.trim() || 'Connected management module inside INDOSATI Office Suite',
      mode: appMode,
      url: appUrl.trim(),
      status: 'active',
    });
    setAppName('');
    setAppDesc('');
    setAppUrl('');
    setShowAddAppForm(false);
  };

  const handleBackupDownload = () => {
    window.location.href = '/api/backup/export';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (user.role !== 'admin') {
      setRestoreStatus('Error: Only administrators are authorized to restore database backups.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        const data = await res.json();
        if (res.ok) {
          setRestoreStatus('Success: Database restored successfully from backup!');
          onRefreshData();
        } else {
          setRestoreStatus(`Error: ${data.error || 'Failed to restore database'}`);
        }
      } catch (err: any) {
        setRestoreStatus(`Error: Invalid JSON backup file (${err.message})`);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Suite Settings, Custom Expense Config & Permanent Database
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize opening balance, expense categories, expense persons (who takes money), and link or create new management apps.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {cloudUserEmail ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cloud DB Connected ({cloudUserEmail})</span>
                </span>
                {onForceCloudSync && (
                  <button
                    type="button"
                    onClick={onForceCloudSync}
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
                  >
                    Save to Cloud Now
                  </button>
                )}
                {onCloudSignOut && (
                  <button
                    type="button"
                    onClick={onCloudSignOut}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Disconnect
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Auto-Save Vault Active {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                </span>
                {onCloudSignIn && (
                  <button
                    type="button"
                    onClick={onCloudSignIn}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                  >
                    Connect Google Cloud Firestore Sync
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: OPENING BALANCE & EXPENSE CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Opening Balance Setting */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Office Opening Cash Balance Setting
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Current: {formatINR(openingBalance)}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Set the base opening balance for Daily Expense Management. Total Available Funds are automatically calculated as{' '}
            <strong>Opening Balance + Advances Received − Recorded Expenses</strong>.
          </p>

          <form onSubmit={handleSaveOpeningBalance} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Opening Balance Amount (₹ INR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingBalance}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition shrink-0"
                >
                  {isSavingBalance ? 'Saving...' : 'Update Opening Balance'}
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Set:</span>
              {[500, 1000, 5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setBalanceInput(String(preset));
                    onUpdateOpeningBalance(preset);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                    openingBalance === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Card B: Editable Expense Categories Manager */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Custom Expense Categories ({categories.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Add, Rename, or Remove</span>
          </div>

          <form onSubmit={handleAddCategorySubmit} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Add new expense category (e.g. Courier, Factory Maintenance)..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </form>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
              >
                {editingCat === cat ? (
                  <div className="flex flex-1 items-center gap-2 mr-2">
                    <input
                      type="text"
                      value={editingCatValue}
                      onChange={(e) => setEditingCatValue(e.target.value)}
                      className="flex-1 rounded-lg border border-blue-400 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCategoryRename(cat)}
                      className="rounded-lg bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                      title="Save Category Name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setEditingCatValue(cat);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="Rename Category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: EXPENSE PERSON ROSTER (WHO TAKES MONEY FOR EXPENSE) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Expense Persons Roster (Who Takes Money for Office Expenses)
              </h3>
              <p className="text-xs text-slate-500">
                Manage staff members and individuals who receive or spend money for office expenses.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {expensePersons.length} Active Persons
          </span>
        </div>

        {/* Add New Person Form */}
        <form
          onSubmit={handleAddPersonSubmit}
          className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80"
        >
          <input
            type="text"
            required
            placeholder="Person Name (e.g. Amit Verma) *"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-semibold"
          />
          <input
            type="text"
            placeholder="Department / Role (e.g. Field Dispatch)"
            value={personDept}
            onChange={(e) => setPersonDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone / Contact (Optional)"
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense Person</span>
          </button>
        </form>

        {/* Persons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {expensePersons.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition"
            >
              {editingPersonId === p.id ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editPersonName}
                    onChange={(e) => setEditPersonName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-lg border border-blue-400 px-2.5 py-1.5 font-bold"
                  />
                  <input
                    type="text"
                    value={editPersonDept}
                    onChange={(e) => setEditPersonDept(e.target.value)}
                    placeholder="Role / Dept"
                    className="flex-1 rounded-lg border border-blue-400 px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    value={editPersonPhone}
                    onChange={(e) => setEditPersonPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-28 rounded-lg border border-blue-400 px-2 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleSavePersonEdit(p.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPersonId(null)}
                    className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.roleOrDept} {p.phone ? `• ${p.phone}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPersonId(p.id);
                        setEditPersonName(p.name);
                        setEditPersonDept(p.roleOrDept);
                        setEditPersonPhone(p.phone || '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Edit Person"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePerson(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Remove Person"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: FUTURE MANAGEMENT APP LINKER & MODULE BUILDER */}
      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Future Management App Linker & Custom Module Hub
              </h3>
              <p className="text-xs text-slate-600">
                Link external Lovable/web applications or spin up new internal management modules (Inventory, HR, Tender Tracker, Vendor Portal) inside INDOSATI Office Suite.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAppForm(!showAddAppForm)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddAppForm ? 'Close Builder' : 'Link / Create New App Module'}</span>
          </button>
        </div>

        {/* Form to Create or Link a Management App */}
        {showAddAppForm && (
          <form
            onSubmit={handleCreateAppSubmit}
            className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-4 text-xs"
          >
            <h4 className="font-bold text-indigo-950 text-sm">
              Add / Link a Management Application Module
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Application / Module Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INDOSATI HR & Payroll, Tender Tracker, Vendor Portal"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Department / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations, HR, Procurement, Warehouse"
                  value={appCategory}
                  onChange={(e) => setAppCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">
                  Short Description & Purpose
                </label>
                <input
                  type="text"
                  placeholder="Describe what this module manages (e.g. Track vendor invoices, solar stock, or employee attendance)"
                  value={appDesc}
                  onChange={(e) => setAppDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Integration Mode *</label>
                <select
                  value={appMode}
                  onChange={(e) => setAppMode(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="internal_workspace">
                    Built-in Suite Workspace (Manage Records Inside INDOSATI)
                  </option>
                  <option value="iframe_embed">
                    Embedded External Web / Lovable App (Open Inside Suite Window)
                  </option>
                  <option value="external_link">
                    Connected External App URL (Launch in Browser)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Target App URL (For Embedded / External Lovable Apps)
                </label>
                <input
                  type="url"
                  placeholder="https://your-new-app.lovable.app (Optional for Internal Workspace)"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddAppForm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
              >
                Save & Add to Suite
              </button>
            </div>
          </form>
        )}

        {/* List of Connected / Custom Management Apps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedApps.map((appItem) => (
            <div
              key={appItem.id}
              className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs hover:border-indigo-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {appItem.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{appItem.name}</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLinkedApp(appItem.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Remove Linked App"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{appItem.shortDescription}</p>

                {appItem.url && (
                  <div className="text-[11px] text-blue-600 truncate font-mono bg-slate-50 px-2 py-1 rounded">
                    URL: {appItem.url}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  Mode:{' '}
                  {appItem.mode === 'internal_workspace'
                    ? `Internal Workspace (${appItem.records?.length || 0} items)`
                    : appItem.mode === 'iframe_embed'
                    ? 'Embedded App View'
                    : 'External Link'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenLinkedApp(appItem)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                >
                  <span>Open Module</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: RBAC & BACKUP/RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role-Based Access Control (RBAC) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">User Identity & Access Control (RBAC)</h3>
          </div>

          <div className="text-xs space-y-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div>
                <strong>Current User:</strong> {user.name} ({user.email})
              </div>
              <div>
                <strong>Organization:</strong> {user.organization}
              </div>
              <div>
                <strong>Active Role:</strong>{' '}
                <span className="font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="font-bold text-slate-700 block mb-2">
                Switch Active Role for Testing:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onSwitchRole('admin')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                    user.role === 'admin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Administrator (Full Privileges)
                </button>
                <button
                  onClick={() => onSwitchRole('staff')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                    user.role === 'staff'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Staff (Read & Create Only)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database Backup, Rollback & Restore */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Database Backup, Rollback & Restore</h3>
          </div>

          <div className="text-xs space-y-3">
            <p className="text-slate-600 leading-relaxed">
              Download or restore a complete JSON snapshot containing all GeM contracts, custom categories, expense persons, linked apps, and expense records.
            </p>

            {restoreStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  restoreStatus.startsWith('Success')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {restoreStatus}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleBackupDownload}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Database Backup (.json)</span>
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={user.role !== 'admin' || isRestoring}
                  className="hidden"
                  id="restore-upload-input"
                />
                <label
                  htmlFor="restore-upload-input"
                  className={`w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer hover:bg-slate-50 ${
                    user.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{isRestoring ? 'Restoring...' : 'Restore Database from JSON Backup'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
