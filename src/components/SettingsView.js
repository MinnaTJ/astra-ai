import { useState } from 'react';
import {
  User,
  Volume2,
  Trash2,
  Download,
  RefreshCw,
  Mail,
  CheckCircle,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { VoiceNames, ConcisenessLevels, STORAGE_KEYS, Timezones, OAUTH_CONFIG } from '@/constants';
import { exchangeCodeForTokens, fetchUserInfo } from '@/services';
import { Globe, LogOut } from 'lucide-react';

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GMAIL_SCOPES = OAUTH_CONFIG.SCOPES;

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
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

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


  // Gmail OAuth Flow
  const handleConnectGmail = async () => {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
      alert('Gmail integration requires OAuth Client ID and Secret please check your settings');
      return;
    }

    setIsConnectingGmail(true);

    try {
      // Create OAuth URL - Use current base URL for GitHub Pages compatibility
      const redirectUri = window.location.href.split('?')[0].split('#')[0];
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code'); // We want a code for exchange
      authUrl.searchParams.set('access_type', 'offline'); // We want a refresh token
      authUrl.searchParams.set('scope', GMAIL_SCOPES);
      authUrl.searchParams.set('prompt', 'consent'); // Ensure refresh token is sent

      // Open OAuth popup
      window.open(
        authUrl.toString(),
        'gmail-oauth',
        'width=500,height=600,scrollbars=yes'
      );

      // Listen for OAuth callback
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'gmail-oauth-success' || event.data.type === 'gmail-oauth-error') {
          // Remove listener IMMEDIATELY so it doesn't run twice
          window.removeEventListener('message', handleMessage);

          if (event.data.type === 'gmail-oauth-success') {
            try {
              const { code } = event.data;
              if (code) {
                // Exchange the code for real tokens
                const tokens = await exchangeCodeForTokens(
                  code,
                  GMAIL_CLIENT_ID,
                  GMAIL_CLIENT_SECRET,
                  redirectUri
                );

                // Fetch user info
                const userInfo = await fetchUserInfo(tokens.access_token);

                onUpdate({
                  ...settings,
                  isGmailConnected: true,
                  gmailAccessToken: tokens.access_token,
                  gmailRefreshToken: tokens.refresh_token,
                  userEmail: userInfo?.email || settings.userEmail,
                  userName: userInfo?.name || settings.userName
                });
              }
            } catch (err) {
              console.error('Token exchange failed:', err);
              alert('Gmail connection failed during token exchange.');
            } finally {
              setIsConnectingGmail(false);
            }
          } else {
            console.error('Gmail OAuth error:', event.data.error);
            setIsConnectingGmail(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback timeout to stop loader if user ignores popup
      setTimeout(() => {
        setIsConnectingGmail(false);
      }, 120000);

    } catch (error) {
      console.error('Gmail connection error:', error);
      setIsConnectingGmail(false);
    }
  };

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
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-20">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
          <p className="text-gray-400">
            Personalize your Astra experience and manage your data.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Key Settings - NEW */}
          <div className="md:col-span-2 glass rounded-3xl p-8 border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Key size={20} className="text-yellow-400" />
              Gemini API Key
            </h3>

            {!hasApiKey && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-200">API key required</p>
                  <p className="text-xs text-yellow-200/60 mt-1">
                    You need a Gemini API key to use voice and text chat features.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-400">
                  Your Gemini API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white font-mono text-sm"
                      placeholder="AIzaSy..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput || apiKeyInput === settings.geminiApiKey}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-semibold transition-all"
                  >
                    Save
                  </button>
                  {settings.geminiApiKey && (
                    <button
                      onClick={handleClearApiKey}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  Get your API key from
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                  >
                    Google AI Studio <ExternalLink size={12} />
                  </a>
                </p>
              </div>

              {settings.geminiApiKey && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm text-green-400">API key configured</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Settings */}
          <div className="glass rounded-3xl p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <User size={20} className="text-violet-400" />
                User Profile
              </h3>
              {settings.userEmail && (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">Verified Account</span>
                    <span className="text-xs text-violet-400 font-medium leading-none">
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
                * When connected, Astra can scan your inbox to automatically find and track job application emails, interview invitations, and status updates.
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
