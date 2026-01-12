/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini AI API
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';

/**
 * Gets the API key from settings or environment
 * @param {Object} settings - User settings object
 * @returns {string} - API key
 */
/**
 * Gets the API key from settings or environment
 * @param {Object} settings - User settings object
 * @returns {string} - API key
 */
function getApiKey(settings = {}) {
  return settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
}

/**
 * Creates a new GoogleGenAI instance
 * @param {Object} settings - User settings with optional geminiApiKey
 * @returns {GoogleGenAI} - AI instance
 */
export function createAIClient(settings = {}) {
  const apiKey = getApiKey(settings);
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add your API key in Settings.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Tool definitions for job tracking functionality
 */
export const jobTrackingTools = [
  {
    name: 'save_job_application',
    parameters: {
      type: Type.OBJECT,
      description: 'Saves a new job application or updates an existing one in the tracker.',
      properties: {
        company: { type: Type.STRING, description: 'Name of the company' },
        role: { type: Type.STRING, description: 'Job title or role' },
        source: { type: Type.STRING, description: 'Source (e.g., LinkedIn, Referral, Gmail)' },
        dateApplied: { type: Type.STRING, description: 'Date applied (YYYY-MM-DD)' },
        timeApplied: { type: Type.STRING, description: 'Time applied (HH:MM) in 24-hour format (note: the time must be in UTC, but the time coming from the email can be in PST format thus we need to convert it to UTC)' },
        status: {
          type: Type.STRING,
          description: 'Status',
          enum: ['Applied', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        }
      },
      required: ['company', 'role', 'source', 'dateApplied', 'timeApplied', 'status']
    }
  },
  {
    name: 'list_job_applications',
    description: 'Provides a summary of all job applications currently in the user tracker.',
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'update_job_status',
    parameters: {
      type: Type.OBJECT,
      description: 'Updates the status of a specific job application by company name.',
      properties: {
        company: { type: Type.STRING, description: 'The company name' },
        status: {
          type: Type.STRING,
          description: 'The new status',
          enum: ['Applied', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        }
      },
      required: ['company', 'status']
    }
  },
  {
    name: 'delete_job_application',
    parameters: {
      type: Type.OBJECT,
      description: 'Removes a job application from the tracker.',
      properties: {
        company: { type: Type.STRING, description: 'The company name to remove' }
      },
      required: ['company']
    }
  },
  {
    name: 'sync_gmail_emails',
    description: 'Triggers a synchronization with Gmail to check for new job application emails.',
    parameters: { type: Type.OBJECT, properties: {} }
  }
];

/**
 * Generates system instruction based on user settings
 * @param {Object} settings - User settings object
 * @returns {string} - System instruction for AI
 */
export function getSystemInstruction(settings) {
  return `You are Astra, a personal career assistant.
USER CONTEXT:
- Name: ${settings.userName || 'User'}
- Target Career Role: ${settings.targetRole || 'Professional'}

CORE RESPONSIBILITIES:
1. Track job applications using the provided tools.
2. ALWAYS use 'list_job_applications' if the user asks "how many", "what jobs", "status of my search", or any question regarding their existing tracker data.
3. Use 'save_job_application' when a user mentions applying to a new role OR when processing emails for new apps.
4. Use 'update_job_status' when a user shares an update OR when emails indicate an interview invitation or rejection.
5. Use 'delete_job_application' only if specifically asked to remove an entry.
6. Use 'sync_gmail_emails' when the user asks to "sync", "check emails", "refresh inbox", or "update from gmail".

TONE: Professional, encouraging, and highly efficient. 
CONCISENESS: ${settings.conciseness}. If 'Concise', be extremely brief. If 'Detailed', provide more career advice alongside tool actions.`;
}

/**
 * Sends a text message to Gemini and returns the response
 * @param {string} message - User message
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} - AI response with text and function calls
 */
export async function sendTextMessage(message, settings) {
  const ai = createAIClient(settings);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: getSystemInstruction(settings),
      tools: [{ functionDeclarations: jobTrackingTools }]
    }
  });

  return {
    text: response.text || '',
    functionCalls: response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.functionCall
    ) || []
  };
}

/**
 * Creates a live voice session with Gemini
 * @param {Object} options - Session configuration
 * @returns {Promise<Object>} - Live session instance
 */
export async function createVoiceSession(options) {
  const { settings, callbacks } = options;
  const ai = createAIClient(settings);

  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',

    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      tools: [{ functionDeclarations: jobTrackingTools }],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: settings.voiceName }
        }
      },
      systemInstruction: getSystemInstruction(settings),
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    }
  });
}

/**
 * Analyzes resume against job description
 * @param {string} resumeText - Resume content
 * @param {string} jobDescription - Job description
 * @param {Object} settings - User settings with API key
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeResume(resumeText, jobDescription, settings = {}) {
  const ai = createAIClient(settings);
  const prompt = `
    Act as an expert HR Manager and Resume Tailor.
    
    RESUME:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    1. Rate this resume out of 10 for this specific job role.
    2. Provide 3 specific strengths of the candidate for this role.
    3. Identify 3 critical gaps or missing keywords/skills.
    4. Provide specific suggestions for the "Experience" and "Skills" sections to better align with the JD.

    Format the response in JSON:
    {
      "rating": number,
      "strengths": string[],
      "gaps": string[],
      "suggestions": {
        "experience": string,
        "skills": string
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Decodes base64url string to text
 * @param {string} data - Base64url encoded string
 * @returns {string} - Decoded text
 */
function decodeBase64Url(data) {
  if (!data) return '';
  // Convert from base64url to base64
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  try {
    // Decode base64 to text, handling UTF-8
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    console.warn('Failed to decode email body part', e);
    return '';
  }
}

/**
 * Recursively extracts email body from payload
 * @param {Object} payload - Email payload
 * @returns {string} - Extracted body text
 */
function extractEmailBody(payload) {
  if (!payload) return '';

  // 1. Direct body data
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // 2. Multipart
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.body?.data && (part.mimeType === 'text/plain' || part.mimeType === 'text/html')) {
        return decodeBase64Url(part.body.data);
      }

      if (part.parts) {
        const result = extractEmailBody(part);
        if (result) return result;
      }
    }
  }

  return '';
}

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
 * Fetches emails from Gmail API
 * @param {Object} settings - App settings
 * @returns {Promise<Object>} - Array of emails and potentially a new access token
 */
async function fetchGmailEmails(settings) {
  let currentToken = settings.gmailAccessToken;
  let newAccessToken = null;

  const performFetch = async (token) => {
    // Search for job-related emails
    const query = 'subject:(application OR interview OR offer OR position OR job OR career OR hiring)';
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

    // Fetch details for each message
    const emails = await Promise.all(
      messages.slice(0, messages.length).map(async (msg) => {
        const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const msgResponse = await fetch(msgUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!msgResponse.ok) return null;

        const msgData = await msgResponse.json();
        const payload = msgData.payload || {};
        const headers = payload.headers || [];

        const body = extractEmailBody(payload);

        return {
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          dateApplied: headers.find(h => h.name === 'Received')?.value || 'Unknown',
          timeApplied: headers.find(h => h.name === 'Received')?.value || 'Unknown',
          snippet: msgData.snippet || '',
          body: body || msgData.snippet || '',
          dateTime: headers.find(h => h.name === 'Received')?.value || 'Unknown',
        };
      })
    );

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

/**
 * Syncs Gmail emails for job updates
 * @param {Object} settings - User settings
 * @returns {Promise<Object>} - Sync results with function calls
 */
export async function syncGmailEmails(settings, applications) {
  let emails = [];

  // If Gmail is connected and has access token, fetch real emails
  let newAccessToken = null;
  if (settings.isGmailConnected && (settings.gmailAccessToken || settings.gmailRefreshToken)) {
    try {
      const fetchResult = await fetchGmailEmails(settings);
      emails = fetchResult.emails;
      newAccessToken = fetchResult.newAccessToken;
    } catch (error) {
      if (error.message === 'GMAIL_UNAUTHORIZED') {
        throw new Error('Gmail session expired. Please reconnect in Settings.');
      }
      console.warn('Gmail fetch failed, using fallback mock data:', error);
    }
  }

  const ai = createAIClient(settings);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: `Process these emails for job application updates. Use your tools to save or update the tracker.
    Current Job Applications: ${JSON.stringify(applications)}
    
    Then process the emails.
    EMAILS: ${JSON.stringify(emails)}
    
    note - dateTime will be in this format - by 2002:a05:6520:50c7:b0:325:7f39:3094 with SMTP id y7csp11383lka;        Thu, 18 Dec 2025 21:32:14 -0800 (PST)
    The time coming from the email can be in PST format thus we need to convert it to UTC.
    If there is duplicate email discard the older one.

    Also make sure its an applied job that we are considering not any suggestions or other emails.
    check the subject line and body of the email to make sure its an applied job.

    Sometime LinkedIn will send a suggestion email for a job that we have already applied for.
    Make sure to not consider those emails.

    Example of suggestion email - 
    Subject: [Company Name] is hiring a [Job Title]
    
    `,
    config: {
      systemInstruction: getSystemInstruction(settings),
      tools: [{ functionDeclarations: jobTrackingTools }]
    }
  });

  return {
    functionCalls: response.candidates?.[0]?.content?.parts?.filter(
      (part) => part.functionCall
    ) || [],
    newAccessToken
  };
}
