import { useState, useCallback, useEffect } from 'react';
import { AppTab, STORAGE_KEYS } from '@/constants';
import { syncGmailEmails, fetchUserInfo } from '@/services';
import { useJobApplications, useSettings } from '@/hooks';
import {
  Sidebar,
  AssistantView,
  JobDashboard,
  ResumeValidator,
  SettingsView,
  LoginView,
  AnimatedBackground,
  MobileNav,
  ErrorBoundary,
  OAuthCallback
} from '@/components';

/**
 * Main Application Component
 * Orchestrates all views and manages global state
 */
function App() {
  const [activeTab, setActiveTab] = useState(AppTab.ASSISTANT);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  // Persisted chat messages — survive tab switches and page refreshes
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist chat messages to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Check if this is an OAuth callback
  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (
      path.includes('/oauth/callback') ||
      hash.includes('access_token') ||
      searchParams.get('code') ||
      searchParams.get('error')
    ) {
      setIsOAuthCallback(true);
    }
  }, []);

  // Custom hooks for state management
  const {
    applications,
    applicationsRef,
    saveJobApplication,
    deleteJobApplication,
    updateJobApplication,
    listJobs,
    findJobByCompany,
    clearAllJobs
  } = useJobApplications();

  const { settings, settingsRef, updateSettings } = useSettings();

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return settings.isGmailConnected;
  });

  // OAuth success handler
  const handleOAuthSuccess = useCallback(async (data) => {
    const { tokens, userInfo } = data;

    // If we only have tokens but no userInfo, try to fetch it
    let fullUserInfo = userInfo;
    if (!fullUserInfo && tokens?.access_token) {
      try {
        const fetched = await fetchUserInfo(tokens.access_token);
        if (fetched) {
          fullUserInfo = {
            name: fetched.name || '',
            email: fetched.email || ''
          };
        }
      } catch (err) {
        console.error('Failed to fetch user info in OAuth success:', err);
      }
    }

    const detectedTimezone = settingsRef.current.timezone === 'UTC' ? Intl.DateTimeFormat().resolvedOptions().timeZone : settingsRef.current.timezone;

    updateSettings({
      ...settingsRef.current,
      isGmailConnected: true,
      gmailAccessToken: tokens?.access_token || data.accessToken || '',
      gmailRefreshToken: tokens?.refresh_token || '',
      userName: fullUserInfo?.name || settingsRef.current.userName,
      userEmail: fullUserInfo?.email || settingsRef.current.userEmail,
      userPicture: fullUserInfo?.picture || settingsRef.current.userPicture,
      timezone: detectedTimezone
    });

    setIsLoggedIn(true);
    setIsOAuthCallback(false);
    setActiveTab(AppTab.ASSISTANT);
  }, [updateSettings, settingsRef]);

  // OAuth error handler
  const handleOAuthError = useCallback((error) => {
    console.error('OAuth error:', error);
    alert('Gmail connection failed: ' + error);
    setIsOAuthCallback(false);
  }, []);

  // Login success handler (for LoginView)
  const handleLoginSuccess = useCallback((data) => {
    const { tokens, userInfo } = data;
    const detectedTimezone = settingsRef.current.timezone === 'UTC' ? Intl.DateTimeFormat().resolvedOptions().timeZone : settingsRef.current.timezone;

    updateSettings({
      ...settingsRef.current,
      isGmailConnected: true,
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
      userName: userInfo?.name || settingsRef.current.userName,
      userEmail: userInfo?.email || settingsRef.current.userEmail,
      userPicture: userInfo?.picture || settingsRef.current.userPicture,
      timezone: detectedTimezone
    });
    setIsLoggedIn(true);
  }, [updateSettings, settingsRef]);

  // Gmail sync handler
  const handleSyncGmail = useCallback(async () => {
    if (!settings.isGmailConnected || isSyncingGmail) return 'Gmail is not connected or sync is already in progress.';
    setIsSyncingGmail(true);

    try {
      const result = await syncGmailEmails(settingsRef.current, applicationsRef.current);

      // If token was refreshed, update settings
      if (result.newAccessToken) {
        updateSettings({
          ...settingsRef.current,
          gmailAccessToken: result.newAccessToken
        });
      }

      // Execute tool calls returned by the sync process
      let savedCount = 0;
      let updatedCount = 0;
      for (const part of result.functionCalls) {
        if (part.functionCall) {
          const fc = part.functionCall;
          if (fc.name === 'save_job_application') {
            saveJobApplication(fc.args);
            savedCount++;
          } else if (fc.name === 'update_job_status' || fc.name === 'update_job_application') {
            // Both names handled for backwards compatibility during model transition
            updateJobApplication(fc.args);
            updatedCount++;
          }
        }
      }

      const parts = [];
      if (savedCount > 0) parts.push(`${savedCount} new application(s) saved`);
      if (updatedCount > 0) parts.push(`${updatedCount} application(s) updated`);
      return parts.length > 0
        ? `Gmail sync complete! ${parts.join(' and ')}.`
        : 'Gmail sync complete. No new job-related emails found.';
    } catch (err) {
      console.error('Gmail sync failed', err);
      return `Gmail sync failed: ${err.message || 'Unknown error'}`;
    } finally {
      setIsSyncingGmail(false);
    }
  }, [settings.isGmailConnected, isSyncingGmail, settingsRef, saveJobApplication, updateJobApplication, applicationsRef, updateSettings]);

  // Job action handlers for assistant view
  const jobActions = {
    saveJobApplication,
    deleteJobApplication,
    updateJobApplication,
    listJobs,
    findJobByCompany,
    onSyncGmail: handleSyncGmail,
    applicationsRef
  };

  const handleLogout = useCallback(() => {
    updateSettings({
      ...settingsRef.current,
      isGmailConnected: false,
      gmailAccessToken: '',
      gmailRefreshToken: '',
      userEmail: '',
      userName: ''
    });
    setIsLoggedIn(false);
  }, [updateSettings, settingsRef]);

  // Show OAuth callback handler if processing OAuth
  if (isOAuthCallback) {
    return <OAuthCallback onSuccess={handleOAuthSuccess} onError={handleOAuthError} />;
  }

  // Show Login View if not logged in
  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen text-gray-100 overflow-hidden relative">
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={settings.userName}
          userEmail={settings.userEmail}
        />

        <MobileNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area — tabs stay mounted, hidden via CSS */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative" role="tabpanel">
          <div className={activeTab === AppTab.ASSISTANT ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
            <AssistantView
              settingsRef={settingsRef}
              jobActions={jobActions}
              onSyncGmail={handleSyncGmail}
              messages={chatMessages}
              setMessages={setChatMessages}
            />
          </div>

          <div className={activeTab === AppTab.DASHBOARD ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
            <JobDashboard
              applications={applications}
              onDelete={deleteJobApplication}
              onSave={saveJobApplication}
              isGmailConnected={settings.isGmailConnected}
              onSyncGmail={handleSyncGmail}
              isSyncing={isSyncingGmail}
              timezone={settings.timezone}
            />
          </div>

          <div className={activeTab === AppTab.RESUME ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
            <ResumeValidator settings={settings} />
          </div>

          <div className={activeTab === AppTab.SETTINGS ? 'flex-1 flex flex-col h-full overflow-hidden' : 'hidden'}>
            <SettingsView
              settings={settings}
              onUpdate={updateSettings}
              onClearData={clearAllJobs}
              onLogout={handleLogout}
            />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;