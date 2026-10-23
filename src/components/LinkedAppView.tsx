import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Settings,
  CheckCircle2,
  Calendar,
  FileText,
  Layers,
} from 'lucide-react';
import { LinkedAppModule } from '../types';

interface LinkedAppViewProps {
  appModule: LinkedAppModule;
  onBackToDashboard: () => void;
  onOpenSettings: () => void;
  onUpdateAppModule: (id: string, updates: Partial<LinkedAppModule>) => Promise<void>;
}

export const LinkedAppView: React.FC<LinkedAppViewProps> = ({
  appModule,
  onBackToDashboard,
  onOpenSettings,
  onUpdateAppModule,
}) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Active');
  const [valueOrNote, setValueOrNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  const records = appModule.records || [];

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newRecord = {
      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      status: status.trim() || 'Active',
      valueOrNote: valueOrNote.trim() || 'Standard entry',
      date: date || new Date().toISOString().split('T')[0],
    };
    await onUpdateAppModule(appModule.id, {
      records: [newRecord, ...records],
    });
    setTitle('');
    setValueOrNote('');
    setIsAdding(false);
  };

  const handleDeleteRecord = async (recId: string) => {
    await onUpdateAppModule(appModule.id, {
      records: records.filter((r) => r.id !== recId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-indigo-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                {appModule.category}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Connected Suite Module
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{appModule.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{appModule.shortDescription}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Configure Module</span>
          </button>
          {appModule.mode === 'internal_workspace' && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Embedded External App (iframe) */}
      {appModule.mode === 'iframe_embed' && appModule.url && (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">{appModule.name} — Embedded Workspace</span>
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-md">
                ({appModule.url})
              </span>
            </div>
            <a
              href={appModule.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sky-300 hover:text-white font-semibold"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <iframe
            src={appModule.url}
            title={appModule.name}
            className="w-full h-[640px] border-0"
          />
        </div>
      )}

      {/* Mode 2: External URL Launcher */}
      {appModule.mode === 'external_link' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ExternalLink className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              External Management Application Linked
            </h3>
            <p className="text-xs text-slate-500">
              This module links to your external application at{' '}
              <span className="font-mono text-indigo-600">{appModule.url || 'No URL configured'}</span>
            </p>
          </div>
          {appModule.url && (
            <div>
              <a
                href={appModule.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
              >
                <span>Launch {appModule.name}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Built-in Internal Workspace */}
      {(appModule.mode === 'internal_workspace' || !appModule.url) && (
        <div className="space-y-4">
          {isAdding && (
            <form
              onSubmit={handleAddRecord}
              className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4 text-xs"
            >
              <h4 className="font-bold text-slate-900 text-sm">
                Add New Record to {appModule.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Item / Record Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Luminaire Batch #402 / Vendor Invoice / Staff Entry"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status / Stage</label>
                  <input
                    type="text"
                    placeholder="e.g. In Stock, Approved, Pending"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">
                    Value / Location / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warehouse Bay 3 • Qty 150 Units • Assigned to Dispatch Team"
                    value={valueOrNote}
                    onChange={(e) => setValueOrNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                >
                  Save Entry
                </button>
              </div>
            </form>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Workspace Records ({records.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Synchronized with INDOSATI Unified Database
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID & Date</th>
                  <th className="py-3 px-4">Record / Item Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Details / Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No records in this module yet. Click "+ Add Record" to start tracking.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{rec.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.id}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{rec.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rec.valueOrNote}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
