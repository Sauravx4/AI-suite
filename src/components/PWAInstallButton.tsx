import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, CheckCircle, HelpCircle } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'navbar' | 'sidebar' | 'banner' }> = ({
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="font-medium">Desktop App Active</span>
      </div>
    );
  }

  return (
    <>
      {/* If beforeinstallprompt was fired (Chrome, Edge on Windows/Mac) */}
      {isInstallable ? (
        <button
          onClick={install}
          aria-label="Install Desktop App"
          className={
            variant === 'sidebar'
              ? 'w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition'
              : 'flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition'
          }
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Install on iOS</span>
        </button>
      ) : (
        <button
          onClick={() => setShowDesktopHelp(true)}
          title="Install as Desktop App (Chrome / Edge)"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Install App</span>
        </button>
      )}

      {/* Desktop Installation Guide Modal */}
      {showDesktopHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Install INDOSATI on Windows</h3>
              </div>
              <button
                onClick={() => setShowDesktopHelp(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">
                You can install this suite as a standalone desktop window on Microsoft Edge or Google Chrome:
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Look at the browser address bar (top right corner).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Click the <strong>Install</strong> or <strong>App available</strong> icon (computer with down arrow).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Click <strong>Install</strong> to pin INDOSATI to your Windows Taskbar and Start Menu.</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">
                Once installed, it opens in its own window without browser tabs or address bars.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDesktopHelp(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              1. Tap the <strong>Share</strong> button in Safari toolbar at the bottom.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top right corner.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
