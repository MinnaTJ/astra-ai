import { useState, useCallback, useRef } from 'react';
import {
  User,
  Volume2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Mail,
  CheckCircle,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { VoiceNames, ConcisenessLevels, STORAGE_KEYS, Timezones } from '@/constants';
import { useGmailOAuth } from '@/hooks';
import { Globe, LogOut } from 'lucide-react';

/**
 * Settings management component
 * @param {Object} props - Component props
 * @param {Object} props.settings - Current settings
 * @param {Function} props.onUpdate - Settings update handler
 * @param {Function} props.onLogout - Logout handler
 */
function SettingsView({ settings, onUpdate, onClearData, onLogout }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdate({ ...settings, [name]: value });
  };

  const handleSaveApiKey = () => {
    onUpdate({ ...settings, geminiApiKey: apiKeyInput });
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    onUpdate({ ...settings, geminiApiKey: '' });
  };

  // Gmail OAuth via shared hook
  const handleGmailSuccess = useCallback(({ tokens, userInfo }) => {
    onUpdate({
      ...settings,
      isGmailConnected: true,
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
      userEmail: userInfo?.email || settings.userEmail,
      userName: userInfo?.name || settings.userName
    });
  }, [settings, onUpdate]);

  const { startOAuth: handleConnectGmail, isConnecting: isConnectingGmail } = useGmailOAuth({
    onSuccess: handleGmailSuccess,
    onError: (msg) => alert(msg)
  });

  const handleDisconnectGmail = () => {
    onUpdate({
      ...settings,
      isGmailConnected: false,
      gmailAccessToken: '',
      gmailRefreshToken: '',
      userEmail: ''
    });
  };

  const exportData = () => {
    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astra-career-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Data import
  const fileInputRef = useRef(null);
  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          alert('Invalid format: expected an array of job applications.');
          return;
        }
        const count = imported.length;
        if (window.confirm(`Import ${count} job application(s)? This will merge with your existing data.`)) {
          const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
          // Merge: avoid duplicates by checking id
          const existingIds = new Set(existing.map(j => j.id));
          const newJobs = imported.filter(j => !existingIds.has(j.id));
          const merged = [...existing, ...newJobs];
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(merged));
          alert(`Imported ${newJobs.length} new application(s). Refresh the page to see changes.`);
          window.location.reload();
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    event.target.value = '';
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure? This will delete all tracked applications permanently.'
      )
    ) {
      onClearData();
    }
  };

  const hasApiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-24 md:pb-20">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Settings</h2>
          <p className="text-sm md:text-base text-gray-400">
            Personalize your Astra experience.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* API Key Settings */}
          <div className="md:col-span-2 glass rounded-3xl p-5 md:p-8 border border-white/10 space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Key size={18} className="text-yellow-400" />
              Gemini API Key
            </h3>

            {!hasApiKey && (
              <div className="p-3 md:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle size={18} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs md:text-sm text-yellow-200">API key required</p>
                  <p className="text-[10px] md:text-xs text-yellow-200/60 mt-0.5 md:mt-1">
                    Required for AI features.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-medium text-gray-400">
                  Your Gemini API Key
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 md:py-2.5 pr-10 outline-none focus:border-violet-500 transition-all text-white font-mono text-xs md:text-sm"
                      placeholder="AIzaSy..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput || apiKeyInput === settings.geminiApiKey}
                      className="flex-1 sm:flex-none px-4 py-2 md:py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-semibold transition-all text-sm"
                    >
                      Save
                    </button>
                    {settings.geminiApiKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-4 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold transition-all text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 mt-2 flex items-center gap-1">
                  Get it from
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                  >
                    Google AI Studio <ExternalLink size={10} />
                  </a>
                </p>
              </div>

              {settings.geminiApiKey && (
                <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">API key configured</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Settings */}
          <div className="glass rounded-3xl p-5 md:p-8 border border-white/10 space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <User size={18} className="text-violet-400" />
                User Profile
              </h3>
              {settings.userEmail && (
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">Account</span>
                    <span className="text-[10px] md:text-xs text-violet-400 font-medium leading-none truncate max-w-[120px]">
                      {settings.userEmail}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">
                  Your Name
                </label>
                <input
                  type="text"
                  name="userName"
                  value={settings.userName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
                  placeholder="How should I call you?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">
                  Target Career Role
                </label>
                <input
                  type="text"
                  name="targetRole"
                  value={settings.targetRole}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Globe size={14} className="text-violet-400" />
                  Your Region (Timezone)
                </label>
                <select
                  name="timezone"
                  value={settings.timezone || 'UTC'}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white appearance-none"
                >
                  {Timezones.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-gray-900">
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gmail Integration */}
          <div className="glass rounded-3xl p-8 border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail size={20} className="text-red-400" />
              Gmail Integration
            </h3>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Mail size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Gmail Account</h4>
                    <p className="text-xs text-gray-500">
                      {settings.isGmailConnected
                        ? `Connected: ${settings.userEmail || settings.userName || 'Account'}`
                        : 'Connect to auto-track applications'}
                    </p>
                  </div>
                </div>
                {settings.isGmailConnected ? (
                  <button
                    onClick={handleDisconnectGmail}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-all"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGmail}
                    disabled={isConnectingGmail}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 glow transition-all disabled:opacity-50"
                  >
                    {isConnectingGmail ? 'Connecting...' : 'Connect Gmail'}
                  </button>
                )}
              </div>

              {settings.isGmailConnected && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">Gmail connected successfully</span>
                </div>
              )}

              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                * When connected, Astra can scan your inbox to automatically find and track job application emails, assessment invitations, interview invitations, and status updates.
              </p>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="glass rounded-3xl p-8 border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Volume2 size={20} className="text-blue-400" />
              Assistant Voice
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">
                  Voice Character
                </label>
                <select
                  name="voiceName"
                  value={settings.voiceName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white appearance-none"
                >
                  <option value={VoiceNames.ZEPHYR} className="bg-gray-900">
                    Zephyr (Default)
                  </option>
                  <option value={VoiceNames.PUCK} className="bg-gray-900">
                    Puck (Energetic)
                  </option>
                  <option value={VoiceNames.CHARON} className="bg-gray-900">
                    Charon (Calm)
                  </option>
                  <option value={VoiceNames.KORE} className="bg-gray-900">
                    Kore (Formal)
                  </option>
                  <option value={VoiceNames.FENRIR} className="bg-gray-900">
                    Fenrir (Deep)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">
                  Response Detail Level
                </label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  {Object.values(ConcisenessLevels).map((level) => (
                    <button
                      key={level}
                      onClick={() => onUpdate({ ...settings, conciseness: level })}
                      className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${settings.conciseness === level
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="glass rounded-3xl p-8 border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw size={20} className="text-green-400" />
              Data & Privacy
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                <h4 className="font-semibold text-white mb-2">Export Records</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Download your entire job tracker history as a JSON file.
                </p>
                <button
                  onClick={exportData}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                >
                  <Download size={16} /> Export JSON
                </button>
              </div>

              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                <h4 className="font-semibold text-white mb-2">Import Records</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Restore job applications from a previously exported JSON file.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={importData}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                >
                  <Upload size={16} /> Import JSON
                </button>
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                <h4 className="font-semibold text-red-400 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-900/60 mb-4">
                  Permanently clear all job applications from your local storage.
                </p>
                <button
                  onClick={handleClearData}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-red-400 transition-all mb-3"
                >
                  <Trash2 size={16} /> Reset All Data
                </button>

                <button
                  onClick={onLogout}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white transition-all"
                >
                  <LogOut size={16} /> Logout Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
