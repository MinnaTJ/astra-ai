# 🌟 Astra AI Assistant

A modern, voice-enabled career assistant powered by Google Gemini AI. Track job applications, validate resumes against job descriptions, and interact using voice or text.

![Astra AI](https://img.shields.io/badge/Astra-AI%20Assistant-8b5cf6?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.2.0-646cff?style=for-the-badge&logo=vite)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285f4?style=for-the-badge&logo=google)

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [File Descriptions](#-file-descriptions)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

- 🎤 **Voice Chat** - Real-time voice conversations with AI using Gemini Live API
- 💬 **Text Chat** - Traditional text-based interaction
- 📊 **Job Tracker** - Track and manage job applications
- 📄 **Resume Lab** - Analyze resume alignment with job descriptions
- 🔄 **Gmail Sync** - Auto-import job updates from emails (mock)
- 🎨 **Modern UI** - Glass morphism design with Tailwind CSS
- 💾 **Local Storage** - Persistent data without backend

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Google Gemini API Key** - [Get API Key](https://aistudio.google.com/app/apikey)

---

## 📥 Installation

### Step 1: Clone or Extract the Project

```bash
# If using git
git clone <repository-url>
cd astra-ai-assistant

# Or extract the zip file
unzip astra-ai-assistant.zip
cd astra-ai-assistant
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

---

## 🚀 Running the App

### Development Mode

```bash
# Start the development server
npm run dev

# Or with yarn
yarn dev
```

The app will be available at: **http://localhost:3000**

### Production Build

```bash
# Create production build
npm run build

# Preview the production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

---

## 📁 Project Structure

```
astra-ai-assistant/
├── public/                     # Static assets
│   └── favicon.svg            # App favicon
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── AssistantView.js   # Main voice/text chat interface
│   │   ├── JobCard.js         # Individual job application card
│   │   ├── JobDashboard.js    # Job applications dashboard
│   │   ├── JobModal.js        # Add/Edit job modal
│   │   ├── ResumeValidator.js # Resume analysis tool
│   │   ├── SettingsView.js    # App settings page
│   │   ├── Sidebar.js         # Navigation sidebar
│   │   ├── StatusIcon.js      # Job status icons
│   │   ├── TranscriptionLog.js # Chat message log
│   │   ├── Waveform.js        # Audio visualization
│   │   └── index.js           # Component exports
│   ├── constants/             # App constants
│   │   └── index.js           # All constants and enums
│   ├── hooks/                 # Custom React hooks
│   │   ├── useJobApplications.js # Job state management
│   │   ├── useVoiceSession.js # Voice chat hook
│   │   └── index.js           # Hook exports
│   ├── services/              # API and utility services
│   │   ├── audioUtils.js      # Audio encoding/decoding
│   │   ├── geminiService.js   # Gemini AI integration
│   │   └── index.js           # Service exports
│   ├── styles/                # CSS styles
│   │   └── index.css          # Global styles
│   ├── App.js                 # Main application component
│   └── main.js                # Application entry point
├── .env.example               # Environment variables template
├── .eslintrc.cjs              # ESLint configuration
├── .gitignore                 # Git ignore rules
├── index.html                 # HTML entry point
├── jsconfig.json              # JavaScript configuration
├── package.json               # Project dependencies
├── vite.config.js             # Vite configuration
└── README.md                  # This file
```

---

## 📄 File Descriptions

### Root Files

| File | Description |
|------|-------------|
| `package.json` | Project metadata, dependencies, and npm scripts |
| `vite.config.js` | Vite bundler configuration with path aliases |
| `index.html` | HTML template with Tailwind CDN |
| `jsconfig.json` | JavaScript/IDE configuration for path aliases |
| `.eslintrc.cjs` | ESLint rules for code quality |
| `.env.example` | Template for environment variables |
| `.gitignore` | Files to exclude from version control |

### Source Files (`src/`)

#### Entry Points

| File | Description |
|------|-------------|
| `main.js` | Application bootstrap - renders App to DOM |
| `App.js` | Root component - manages routing and global state |

#### Components (`src/components/`)

| File | Description |
|------|-------------|
| `AssistantView.js` | Main AI interaction view with voice/text input, message display, and waveform visualization |
| `JobDashboard.js` | Dashboard showing all job applications with add/edit/delete functionality |
| `JobCard.js` | Individual job application card displaying company, role, status, and date |
| `JobModal.js` | Modal dialog for creating or editing job applications |
| `ResumeValidator.js` | Upload resume (text/PDF) and job description to get AI-powered match analysis |
| `SettingsView.js` | Configure user profile, voice preferences, and manage data |
| `Sidebar.js` | Left navigation bar with tab switching |
| `StatusIcon.js` | Renders appropriate icon based on job application status |
| `TranscriptionLog.js` | Scrollable chat log showing user and assistant messages |
| `Waveform.js` | Canvas-based audio frequency visualization |
| `index.js` | Barrel export file for all components |

#### Constants (`src/constants/`)

| File | Description |
|------|-------------|
| `index.js` | Centralized constants including: `AssistantState` (IDLE, LISTENING, etc.), `AppTab` (navigation tabs), `JobStatus` (Applied, Interviewing, etc.), `VoiceNames`, `ConcisenessLevels`, `DEFAULT_SETTINGS`, `STORAGE_KEYS`, `AUDIO_CONFIG` |

#### Hooks (`src/hooks/`)

| File | Description |
|------|-------------|
| `useJobApplications.js` | Custom hook managing job applications state with localStorage persistence. Provides: `applications`, `saveJobApplication`, `deleteJobApplication`, `updateJobStatus`, `listJobs`, `findJobByCompany`, `clearAllJobs` |
| `useVoiceSession.js` | Custom hook managing Gemini Live voice session. Handles audio contexts, microphone input, speech output, and transcription |
| `index.js` | Barrel export file for all hooks |

#### Services (`src/services/`)

| File | Description |
|------|-------------|
| `audioUtils.js` | Audio utility functions: `decode` (base64→Uint8Array), `encode` (Uint8Array→base64), `decodeAudioData` (PCM→AudioBuffer), `createAudioBlob` (Float32→API format) |
| `geminiService.js` | Gemini AI integration: `createAIClient`, `jobTrackingTools` (function declarations), `getSystemInstruction`, `sendTextMessage`, `createVoiceSession`, `analyzeResume`, `syncGmailEmails` |
| `index.js` | Barrel export file for all services |

#### Styles (`src/styles/`)

| File | Description |
|------|-------------|
| `index.css` | Global CSS with custom classes: `.glass` (glassmorphism), `.glow` (purple glow), `.custom-scrollbar`, animations (fadeIn, zoomIn, slideIn, ping, spin) |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: Your Google Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

### Path Aliases

The project uses path aliases for cleaner imports:

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@services/*` | `src/services/*` |
| `@hooks/*` | `src/hooks/*` |
| `@constants/*` | `src/constants/*` |

**Example usage:**
```javascript
import { AssistantState } from '@/constants';
import { Sidebar } from '@/components';
import { useJobApplications } from '@/hooks';
```

---

## 📖 Usage Guide

### Voice Chat

1. Click the **microphone button** to start a voice session
2. Speak naturally - say things like:
   - "Add a job application for Google as a Software Engineer"
   - "What jobs have I applied to?"
   - "Update my Amazon application to Interviewing"
3. Click the **red button** to end the session

### Text Chat

1. Type in the input field at the bottom
2. Press **Enter** or click the **send button**
3. The AI will respond and execute any job-tracking actions

### Job Tracker

1. Navigate to the **Tracker** tab
2. Click **Add Application** to manually add jobs
3. Edit or delete jobs using the card buttons
4. Enable Gmail sync in Settings to auto-import (mock feature)

### Resume Lab

1. Navigate to the **Resume Lab** tab
2. Paste your resume or upload a PDF
3. Paste the target job description
4. Click **Validate Alignment** for AI analysis
5. Review your match score, strengths, gaps, and suggestions

### Settings

- **User Profile**: Set your name and target role
- **Voice Settings**: Choose AI voice and response detail level
- **Integrations**: Toggle Gmail sync (mock)
- **Data Management**: Export or clear your data

---

## 🔌 API Reference

### Gemini Models Used

| Feature | Model |
|---------|-------|
| Text Chat | `gemini-3-flash-preview` |
| Voice Chat | `gemini-2.5-flash-native-audio-preview-09-2025` |
| Resume Analysis | `gemini-3-flash-preview` |

### Tool Functions

The AI can execute these functions:

| Function | Description |
|----------|-------------|
| `save_job_application` | Add or update a job application |
| `list_job_applications` | Get summary of all applications |
| `update_job_status` | Change status of an application |
| `delete_job_application` | Remove an application |

---

## 🔧 Troubleshooting

### Common Issues

**"Microphone access denied"**
- Ensure your browser has microphone permissions
- Check that you're using HTTPS or localhost

**"API key invalid"**
- Verify your Gemini API key in `.env.local`
- Ensure the key has access to Gemini Live API

**"Voice session fails to connect"**
- Check your internet connection
- Try refreshing the page
- Verify API key permissions

**"PDF text extraction fails"**
- Ensure the PDF is not image-only (scanned)
- Try using the text input mode instead

### Browser Support

- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Firefox
- ⚠️ Safari (limited Web Audio API support)

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://deepmind.google/technologies/gemini/) - AI backbone
- [Lucide Icons](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vite](https://vitejs.dev/) - Lightning fast bundler
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF text extraction

---

<div align="center">
  <p>Built with ❤️ using React and Google Gemini</p>
  <p><strong>Astra AI</strong> - Your Personal Career Assistant</p>
</div>
