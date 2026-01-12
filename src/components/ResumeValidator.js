import { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  FileText,
  Search,
  Star,
  Edit3,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  FileUp,
  X
} from 'lucide-react';
import { analyzeResume } from '@/services';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Resume validation and analysis component
 * @param {Object} props - Component props
 * @param {Object} props.settings - App settings with API key
 */
function ResumeValidator({ settings }) {
  const [inputMode, setInputMode] = useState('text');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // SVG Circle Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const extractTextFromPDF = async (file) => {
    setIsExtracting(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      if (!fullText.trim()) {
        throw new Error(
          'Could not extract any text from this PDF. It might be an image-only scan.'
        );
      }

      setResumeText(fullText);
      setFileName(file.name);
    } catch (err) {
      console.error(err);
      setError(
        err.message || 'Failed to parse PDF. Please try pasting the text instead.'
      );
      setFileName(null);
      setResumeText('');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        return;
      }
      extractTextFromPDF(file);
    }
  };

  const resetFile = () => {
    setFileName(null);
    setResumeText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      setError('Please provide both your resume content and a job description.');
      return;
    }

    if (!settings?.geminiApiKey && !process.env.GEMINI_API_KEY) {
      setError('Please add your Gemini API key in Settings first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeResume(resumeText, jobDescription, settings);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to analyze resume. Please ensure your API key is valid.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Resume Lab</h2>
          <p className="text-gray-400">
            Validate and tailor your resume against specific job descriptions.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Resume Input Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <FileText size={16} className="text-violet-400" />
                Resume Input
              </label>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${inputMode === 'text'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setInputMode('pdf')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${inputMode === 'pdf'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  PDF
                </button>
              </div>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="flex-1 min-h-[300px] glass rounded-2xl p-4 bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-none transition-all placeholder:text-gray-600"
              />
            ) : (
              <div className="flex-1 min-h-[300px] flex flex-col">
                {fileName ? (
                  <div className="flex-1 glass rounded-2xl p-6 border border-violet-500/30 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                    <div className="p-4 bg-violet-600/20 rounded-2xl mb-4 text-violet-400">
                      <FileUp size={48} />
                    </div>
                    <p className="text-white font-medium mb-1 truncate max-w-full px-4">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                      Text extracted successfully
                    </p>
                    <button
                      onClick={resetFile}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <X size={14} /> Remove File
                    </button>
                  </div>
                ) : (
                  <label className="flex-1 glass rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.99]">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="hidden"
                    />
                    <div className="p-4 bg-white/5 rounded-2xl mb-4 text-gray-500 group-hover:text-violet-400 group-hover:bg-violet-500/5 transition-all">
                      {isExtracting ? (
                        <Loader2 size={40} className="animate-spin" />
                      ) : (
                        <Upload size={40} />
                      )}
                    </div>
                    <p className="text-gray-300 font-medium">
                      {isExtracting ? 'Reading PDF...' : 'Drop your resume PDF here'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      or click to browse files
                    </p>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* JD Input Section */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 px-1">
              <Search size={16} className="text-blue-400" />
              Target Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job requirements or description here..."
              className="flex-1 min-h-[300px] glass rounded-2xl p-4 bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-none transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !resumeText || !jobDescription || isExtracting}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] glow mb-12 shadow-lg shadow-violet-600/10"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Astra is analyzing your match...
            </>
          ) : (
            <>
              <Send size={20} />
              Validate Alignment
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-start gap-3 mb-8 animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Rating Section */}
            <div className="glass rounded-3xl p-8 border border-white/10 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Star size={120} className="text-violet-500" />
              </div>
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 128 128"
                  className="absolute inset-0 w-full h-full -rotate-90"
                >
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      circumference - (circumference * analysis.rating) / 10
                    }
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="z-10 flex items-baseline gap-0.5">
                  <span className="text-4xl font-black text-white">
                    {analysis.rating}
                  </span>
                  <span className="text-xl font-bold text-gray-500">/10</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Match Quality</h3>
              <p className="text-gray-400 max-w-md text-sm">
                Based on ATS standards and specific job requirements analyzed by
                Astra AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute -top-2 -right-2 p-4 text-green-500/5">
                  <CheckCircle size={80} />
                </div>
                <h4 className="flex items-center gap-2 text-green-400 font-bold mb-4">
                  <CheckCircle size={18} />
                  Top Strengths
                </h4>
                <ul className="space-y-3">
                  {analysis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-green-500/20 transition-all"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute -top-2 -right-2 p-4 text-red-500/5">
                  <AlertCircle size={80} />
                </div>
                <h4 className="flex items-center gap-2 text-red-400 font-bold mb-4">
                  <AlertCircle size={18} />
                  Critical Gaps
                </h4>
                <ul className="space-y-3">
                  {analysis.gaps.map((g, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-red-500/20 transition-all"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tailoring Suggestions */}
            <div className="glass rounded-2xl p-8 border border-white/10">
              <h4 className="flex items-center gap-2 text-violet-400 font-bold mb-6">
                <Edit3 size={18} />
                Strategic Recommendations
              </h4>
              <div className="space-y-8">
                <div>
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                    Experience Refinement
                  </h5>
                  <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {analysis.suggestions.experience}
                  </p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Skills & Keyword Optimization
                  </h5>
                  <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {analysis.suggestions.skills}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeValidator;
