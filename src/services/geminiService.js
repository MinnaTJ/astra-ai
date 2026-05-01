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
          enum: ['Applied', 'Assessment', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        },
        emailLink: { type: Type.STRING, description: 'Direct link to the Gmail message (if applicable)' }
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
    name: 'update_job_application',
    parameters: {
      type: Type.OBJECT,
      description: 'Updates an existing job application. Only provide the fields that need to change.',
      properties: {
        company: { type: Type.STRING, description: 'The company name (required to find the job)' },
        role: { type: Type.STRING, description: 'New job title/role' },
        status: {
          type: Type.STRING,
          description: 'New status',
          enum: ['Applied', 'Assessment', 'Interviewing', 'Rejected', 'Offer', 'Ghosted']
        },
        dateApplied: { type: Type.STRING, description: 'New date applied (YYYY-MM-DD)' },
        notes: { type: Type.STRING, description: 'New notes for the application' },
        emailLink: { type: Type.STRING, description: 'New direct link to the Gmail message' }
      },
      required: ['company']
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
4. Use 'update_job_application' to update any field of an existing job (status, role/title, notes, date, etc.).
5. Use 'delete_job_application' only if specifically asked to remove an entry.
6. Use 'sync_gmail_emails' when the user asks to "sync", "check emails", "refresh inbox", or "update from gmail".

TONE: Professional, encouraging, and highly efficient. 
CONCISENESS: ${settings.conciseness}. If 'Concise', be extremely brief. If 'Detailed', provide more career advice alongside tool actions.`;
}

/**
 * Sends a text message to Gemini and handles tool call loops.
 * The model may call tools (e.g. list_job_applications), and we send the
 * tool results back so it can formulate a grounded response.
 *
 * @param {string} message - User message
 * @param {Object} settings - User settings
 * @param {Function} toolExecutor - Async function that executes a tool call and returns its result string
 * @returns {Promise<Object>} - AI response with text and any side-effect function calls (save/update/delete)
 */
export async function sendTextMessage(message, settings, toolExecutor) {
  const ai = createAIClient(settings);
  const tools = [{ functionDeclarations: jobTrackingTools }];
  const systemInstruction = getSystemInstruction(settings);

  // Build conversation history for multi-turn
  const contents = [{ role: 'user', parts: [{ text: message }] }];

  // Side-effect tool calls (save/update/delete/sync) that have been executed
  const sideEffectCalls = [];

  // Tool-call loop: keep going until the model gives a text response
  const MAX_TOOL_ROUNDS = 5;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: { systemInstruction, tools }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const functionCallParts = parts.filter(p => p.functionCall);

    console.log(`[Astra] Round ${round}: ${functionCallParts.length} tool call(s), text: "${(response.text || '').substring(0, 80)}..."`);

    // If no tool calls, we're done — return the text
    if (functionCallParts.length === 0) {
      return {
        text: response.text || '',
        functionCalls: sideEffectCalls
      };
    }

    // Add the model's response (with tool calls) to conversation
    contents.push({ role: 'model', parts });

    // Execute each tool call and collect results
    const toolResultParts = [];
    for (const part of functionCallParts) {
      const fc = part.functionCall;
      const result = await toolExecutor(fc);

      console.log(`[Astra] Tool "${fc.name}" result (${typeof result}, ${String(result).length} chars): "${String(result).substring(0, 120)}..."`);

      // Track side-effect calls (everything except list)
      if (fc.name !== 'list_job_applications') {
        sideEffectCalls.push({ functionCall: fc });
      }

      toolResultParts.push({
        functionResponse: {
          name: fc.name,
          id: fc.id,
          response: { result: String(result) }
        }
      });
    }

    // Send tool results back to the model with role 'function'
    contents.push({ role: 'function', parts: toolResultParts });
  }

  // Fallback if we hit max rounds
  return {
    text: 'I processed your request. Check your dashboard for the latest updates.',
    functionCalls: sideEffectCalls
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
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.NUMBER, description: 'Rating out of 10' },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 specific strengths' },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 critical gaps' },
          suggestions: {
            type: Type.OBJECT,
            properties: {
              experience: { type: Type.STRING, description: 'Suggestions for experience section' },
              skills: { type: Type.STRING, description: 'Suggestions for skills section' }
            },
            required: ['experience', 'skills']
          }
        },
        required: ['rating', 'strengths', 'gaps', 'suggestions']
      }
    }
  });

  return JSON.parse(response.text || '{}');
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
async function fetchGmailEmails(settings) {
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

  // Send compact summary to save tokens and avoid context limits
  const appSummary = applications.map(a => `${a.company} | ${a.role} | ${a.status}`).join('\n');
  
  const ai = createAIClient(settings);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: `Process these emails for job application updates. Use your tools to save or update the tracker.
    Current Job Applications (company | role | status):
    ${appSummary || '(none yet)'}
    
    Then process the emails.
    EMAILS: ${JSON.stringify(emails)}
    
    INSTRUCTIONS:
    1. For each email, identify the company, role, status, and application date/time.
    2. ALWAYS include an 'emailLink' property in your tool calls if extracting from a Gmail email.
    3. The 'emailLink' should be formatted as: https://mail.google.com/mail/u/0/#inbox/[message_id]
       where [message_id] is the 'id' field from the email object.
    
    note - dateTime will be in standard email Date header format. Convert it to UTC date (YYYY-MM-DD) and time (HH:MM).
    If there is duplicate email discard the older one.

    Also make sure its an applied job that we are considering not any suggestions or other emails.
    check the subject line and snippet of the email to make sure its an applied job.

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
