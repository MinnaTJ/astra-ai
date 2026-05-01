/**
 * Gmail Service
 * Handles all interactions with Google APIs (OAuth, User Info, Gmail)
 */

/**
 * Exchanges an authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code, clientId, clientSecret, redirectUri) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code');
  }

  return await response.json();
}

/**
 * Refreshes an expired access token using a refresh token
 */
export async function refreshGmailAccessToken(refreshToken, clientId, clientSecret) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Refresh token error:', error);
    return null;
  }
}

/**
 * Fetches user info (name, email) from Google's UserInfo API
 */
export async function fetchUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Fetch user info error:', error);
    return null;
  }
}

/**
 * Fetches emails from Gmail API
 * @param {Object} settings - App settings
 * @returns {Promise<Object>} - Array of emails and potentially a new access token
 */
export async function fetchGmailEmails(settings) {
  let currentToken = settings.gmailAccessToken;
  let newAccessToken = null;

  const performFetch = async (token) => {
    // Search for job-related emails — broad query to catch all variations
    // Includes: direct keywords, scheduling, recruiter tools, common ATS senders
    const query = `in:inbox -from:me (subject:(application OR assessment OR interview OR offer OR position OR job OR career OR hiring OR recruiter OR "coding challenge" OR "technical screen" OR "phone screen" OR onboarding OR "next steps" OR "your candidacy" OR "we reviewed" OR "moving forward" OR "schedule" OR "congratulations") OR from:(greenhouse.io OR lever.co OR workday.com OR myworkday.com OR icims.com OR smartrecruiters.com OR ashbyhq.com OR jobs-noreply OR talent OR recruiting OR careers OR hr@))`;

    const searchUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`;

    const searchResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchResponse.status === 401) {
      throw new Error('GMAIL_UNAUTHORIZED');
    }

    if (!searchResponse.ok) {
      throw new Error('Failed to fetch emails');
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    // Fetch details for each message in batches to avoid rate limiting
    const BATCH_SIZE = 5; // Process 5 messages at a time
    const emails = [];

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      const batchEmails = await Promise.all(
        batch.map(async (msg) => {
          const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
          const msgResponse = await fetch(msgUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!msgResponse.ok) return null;

          const msgData = await msgResponse.json();
          const payload = msgData.payload || {};
          const headers = payload.headers || [];

          const rawDate = headers.find(h => h.name === 'Date')?.value || headers.find(h => h.name === 'Received')?.value || 'Unknown';
          return {
            id: msg.id,
            from: headers.find(h => h.name === 'From')?.value || 'Unknown',
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            dateTime: rawDate,
            snippet: (msgData.snippet || '').substring(0, 250)
          };
        })
      );

      emails.push(...batchEmails);

      // Small delay between batches to be extra safe with rate limits
      if (i + BATCH_SIZE < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return emails.filter(Boolean);
  };

  try {
    try {
      const emails = await performFetch(currentToken);
      return { emails, newAccessToken };
    } catch (error) {
      if (error.message === 'GMAIL_UNAUTHORIZED' && settings.gmailRefreshToken) {
        // Try to refresh
        console.log('Access token expired, attempting refresh...');
        const refreshData = await refreshGmailAccessToken(
          settings.gmailRefreshToken,
          settings.gmailClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID,
          settings.gmailClientSecret || import.meta.env.VITE_GOOGLE_CLIENT_SECRET
        );

        if (refreshData && refreshData.access_token) {
          console.log('Refresh successful!');
          newAccessToken = refreshData.access_token;
          const emails = await performFetch(newAccessToken);
          return { emails, newAccessToken };
        }
      }
      throw error;
    }
  } catch (error) {
    if (error.message === 'GMAIL_UNAUTHORIZED') {
      throw error;
    }
    console.error('Gmail fetch error:', error);
    return { emails: [], newAccessToken };
  }
}
