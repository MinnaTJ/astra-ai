import React, { useEffect } from 'react';

/**
 * OAuth Callback Handler Component
 * Handles both implicit flow (hash) and code flow (search params)
 */
function OAuthCallback({ onSuccess, onError }) {
  const hasSent = React.useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasSent.current) return;

      // 1. Try to parse access_token from hash (Implicit Flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessTokenFromHash = hashParams.get('access_token');

      // 2. Try to parse code from search (Code Flow)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error') || hashParams.get('error');

      if (accessTokenFromHash) {
        hasSent.current = true;
        onSuccess({ accessToken: accessTokenFromHash });
        window.history.replaceState(null, '', window.location.pathname);
      } else if (code) {
        hasSent.current = true;
        if (window.opener) {
          window.opener.postMessage({ type: 'gmail-oauth-success', code }, window.location.origin);
          window.close();
        } else {
          onSuccess({ code });
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (error) {
        hasSent.current = true;
        if (window.opener) {
          window.opener.postMessage({ type: 'gmail-oauth-error', error }, window.location.origin);
          window.close();
        } else {
          onError(error);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    handleAuth();
  }, [onSuccess, onError]);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Completing Gmail authorization...</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
