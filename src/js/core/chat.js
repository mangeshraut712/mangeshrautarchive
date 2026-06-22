import { api } from './config.js';
import { agenticActions } from '../modules/agentic-actions.js';

// ============================================================================
// API CONFIGURATION - Unified Backend Strategy
// ============================================================================
// All frontends use the Vercel backend which has API keys configured.
// This ensures consistent behavior across localhost, GitHub Pages, and previews.
// ============================================================================

let API_BASE = '';

// Primary Backend: Vercel (has OPENROUTER_API_KEY configured)
const VERCEL_BACKEND = 'https://mraut.vercel.app';
const PRIMARY_CUSTOM_DOMAIN = 'mangeshraut.pro';
const MAX_SERVER_MESSAGE_LENGTH = 1800;
const MAX_SERVER_HISTORY_MESSAGES = 12;

function stripUnsafeControlCharacters(value) {
  return Array.from(value)
    .filter(char => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('');
}

function isLoopbackHostname(hostname = '') {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
}

function normalizeApiBase(rawValue) {
  if (!rawValue) return '';

  try {
    const parsed = new URL(
      String(rawValue).trim(),
      typeof window !== 'undefined' ? window.location.origin : undefined
    );

    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      parsed.protocol === 'http:' &&
      !isLoopbackHostname(parsed.hostname)
    ) {
      parsed.protocol = 'https:';
    }

    return parsed.origin === window?.location?.origin ? '' : parsed.origin;
  } catch {
    return '';
  }
}

if (typeof window !== 'undefined') {
  if (window.APP_CONFIG?.apiBaseUrl) {
    API_BASE = normalizeApiBase(window.APP_CONFIG.apiBaseUrl);
  } else {
    const hostname = window.location.hostname || '';

    // ALWAYS use relative paths for localhost to hit the proxy
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      API_BASE = '';
    }
    // Cloud Run deployment
    else if (hostname.includes('run.app')) {
      API_BASE = '';
    }
    // Vercel deployment and primary custom domain
    else if (hostname.includes('vercel.app') || hostname === PRIMARY_CUSTOM_DOMAIN) {
      API_BASE = '';
    }
    // GitHub Pages or Custom Domain - use Vercel backend
    else {
      API_BASE = VERCEL_BACKEND;
    }
  }
}

function buildApiUrl(path) {
  if (!API_BASE) {
    return path;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      path.startsWith('http://')
    ) {
      try {
        const parsed = new URL(path);
        if (!isLoopbackHostname(parsed.hostname)) {
          parsed.protocol = 'https:';
          return parsed.toString();
        }
      } catch {
        return path;
      }
    }
    return path;
  }
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

const SOURCE_KEY_ALIASES = {
  assistme: 'assistme',
  'assistme server': 'assistme',
  'assistme client': 'assistme',
  'assistme portfolio': 'assistme-portfolio',
  'assistme chat': 'assistme',
  'assistme math': 'assistme-math',
  'assistme general': 'assistme',
  'assistme utility': 'assistme-utility',
  portfolio: 'assistme-portfolio',
  math: 'assistme-math',
  openrouter: 'openrouter',
  'open router': 'openrouter',
  'local cache': 'assistme',
  cached: 'assistme',
};

const SOURCE_LABELS = {
  assistme: 'AssistMe Portfolio',
  'assistme-portfolio': 'AssistMe Portfolio',
  'assistme-math': 'AssistMe Math Engine',
  'assistme-utility': 'AssistMe Utility',
  'assistme-general': 'AssistMe',
  openrouter: 'OpenRouter AI',
};

// Intelligent Chat Assistant with Integrated AI
class IntelligentAssistant {
  constructor(_options = {}) {
    this.cache = null;
    this.isReadyState = false;
    this.defaultGreetings = [
      "Hello! I'm AssistMe, Mangesh's AI portfolio assistant. I can walk you through his projects, experience, and technical skills. How can I help you today?",
    ];
    this.processing = false;
    this.history = [];
    this.conversation = [];

    // Determine if we can use server AI services
    this.canUseServerAI = !!api.baseUrl;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      this.canUseServerAI =
        this.canUseServerAI ||
        hostname.endsWith('.vercel.app') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('mangeshraut.pro') ||
        (hostname.includes('github.io') && api.baseUrl);
    }
  }

  async initialize(_options = {}) {
    // For GitHub Pages deployment, work offline only to avoid CORS issues
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

    // Check multiple ways to detect GitHub Pages and static hosting
    const isGitHubPages =
      hostname.includes('github.io') ||
      hostname.includes('mangeshraut712.github.io') ||
      !navigator.onLine ||
      (window.location.protocol === 'https:' &&
        !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) &&
        !hostname.endsWith('.vercel.app') &&
        !hostname.endsWith('.herokuapp.com') &&
        !hostname.endsWith('.netlify.app'));

    if (isGitHubPages) {
      // Check if API_BASE is configured (which it should be now)
      if (API_BASE && (API_BASE.includes('vercel.app') || API_BASE.startsWith('http'))) {
        this.canUseServerAI = true;
        this.isReadyState = true;
        return true; // API is available
      } else {
        this.isReadyState = true;
        return false;
      }
    }

    if (!navigator.onLine) {
      this.isReadyState = true;
      return false;
    }

    // If API_BASE is explicitly configured, trust it and enable server AI
    if (API_BASE && API_BASE.length > 0) {
      this.canUseServerAI = true;
      this.isReadyState = true;
      return true;
    }

    // Fallback: Try health check for legacy compatibility
    try {
      const tryEndpoint = async (path, timeoutMs) => {
        const res = await fetch(buildApiUrl(path), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        return res.ok;
      };

      const healthy =
        (await tryEndpoint('/api/health', 15000).catch(() => false)) ||
        (await tryEndpoint('/api/status', 15000).catch(() => false));

      if (healthy) {
        this.canUseServerAI = true;
        this.isReadyState = true;
        return true;
      }

      console.warn('⚠️ Server connectivity test failed - will try API calls anyway');
      this.canUseServerAI = true; // Try anyway
      this.isReadyState = true;
      return true; // Optimistic
    } catch (error) {
      console.warn('Server initialization failed - enabling optimistic mode:', error.message);
      this.canUseServerAI = true; // Try anyway
      this.isReadyState = true;
      return true; // Optimistic
    }
  }

  isReady() {
    return this.isReadyState;
  }

  /**
   * Main method to ask questions
   */
  async ask(question, options = {}) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a valid string');
    }

    if (this.processing) {
      return this.handleConcurrency(options);
    }

    this.processing = true;

    try {
      // Add to history
      this.history.push({ question, timestamp: Date.now() });
      const trimmed = question.trim();
      this._pushConversation('user', trimmed);

      // 🎯 NEW: Check for agentic actions first
      const startTime = Date.now();
      const actionResult = await agenticActions.detectAndExecute(trimmed);

      if (actionResult.actionDetected) {
        const processingTime = Date.now() - startTime;

        // Create response with action result and consistent metadata
        const response = {
          answer: actionResult.message,
          type: 'action',
          confidence: 1.0,
          source: 'agentic-action',
          sourceLabel: 'Agentic AI',
          model: 'Action Handler',
          action: actionResult.actionName,
          actionResult: actionResult.result,
          processingTime: processingTime,
          runtime: `${processingTime}ms`,
          providers: ['Agentic AI'],
          category: 'Action',
          charCount: actionResult.message.length,
          safetyScore: 1.0,
          timestamp: Date.now(),
        };

        // Add response to history
        this.history[this.history.length - 1].response = response;
        this.history[this.history.length - 1].processingTime = processingTime;

        this._pushConversation('assistant', actionResult.message);

        return response;
      }

      // Process the query normally if no action detected
      const response = await this.processQuery(trimmed, options);

      // Add response to history
      this.history[this.history.length - 1].response = response;
      this.history[this.history.length - 1].processingTime =
        Date.now() - this.history[this.history.length - 1].timestamp;

      const answerText = this._extractAnswerText(response);
      if (answerText) {
        this._pushConversation('assistant', answerText);
      }

      return response;
    } catch (error) {
      if (error?.code === 'RATE_LIMITED') {
        throw error;
      }
      console.error('Error processing query:', error);
      const fallback = this.handleError(question, error);
      const fallbackText = this._extractAnswerText(fallback);
      if (fallbackText) {
        this._pushConversation('assistant', fallbackText);
      }
      return fallback;
    } finally {
      this.processing = false;
    }
  }

  async processQuery(query, options = {}) {
    const trimmed = query.trim();
    const responses = [];

    if (!this.isReady()) {
      try {
        await this.initialize();
      } catch (error) {
        console.warn('Assistant initialization failed before processing:', error);
      }
    }

    const serverRaw = await this.callApi(trimmed, options);
    const serverResponse = this.normalizeResponse(serverRaw, 'AssistMe Server');
    if (serverResponse) {
      responses.push(serverResponse);
      if (this.isMeaningfulResponse(serverResponse)) {
        return serverResponse;
      }
    }

    const clientRaw = await this.callClientService(trimmed);
    const clientResponse = this.normalizeResponse(clientRaw, 'AssistMe');
    if (clientResponse) {
      responses.push(clientResponse);
    }

    const best = this.chooseBestResponse(responses);
    if (best && this.isMeaningfulResponse(best)) {
      return best;
    }

    return this.basicQueryProcessing(trimmed);
  }

  async callApi(query, options = {}) {
    const safeQuery = this._sanitizeMessageForServer(query);
    if (!safeQuery) return null;

    // Allow API calls from GitHub Pages if CORS is configured and API base URL is set
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const canCallServerAPI =
      this.canUseServerAI ||
      (hostname.includes('github.io') && API_BASE && API_BASE.includes('vercel.app'));

    if (!canCallServerAPI) {
      return null;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return null;
    }

    try {
      const apiUrl = buildApiUrl('/api/chat');

      const isStreaming = typeof options.onChunk === 'function';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: isStreaming ? 'application/x-ndjson' : 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          message: safeQuery,
          messages: this._getConversationForServer(),
          context: options.context || {},
          stream: isStreaming,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        console.error(`❌ Server error ${response.status}: ${errorText}`);

        if (response.status === 429) {
          let retryAfter = Number(response.headers.get('Retry-After')) || 60;
          let message =
            'You have sent too many requests. Please wait a moment before trying again.';
          try {
            const payload = JSON.parse(errorText);
            const nested = payload?.error?.message?.error || payload?.error;
            if (typeof nested?.message === 'string') {
              message = nested.message;
            }
            if (nested?.retryAfter) {
              retryAfter = Number(nested.retryAfter) || retryAfter;
            }
          } catch {
            // Keep default rate-limit messaging when the body is not JSON.
          }
          const rateError = new Error(message);
          rateError.code = 'RATE_LIMITED';
          rateError.retryAfter = retryAfter;
          throw rateError;
        }

        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      if (isStreaming) {
        const stream = response.body;
        const decoder = new TextDecoder();
        let fullText = '';
        let metadata = {};
        let buffer = '';

        const processChunk = chunk => {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = buffer.endsWith('\n') ? '' : lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const data = JSON.parse(trimmed);

              // Handle chunk data (backend sends {type: "chunk", content: "..."})
              if (data.type === 'chunk' && data.content) {
                fullText += data.content;
                options.onChunk(data.content);
              }
              // Legacy format support
              else if (data.chunk) {
                fullText += data.chunk;
                options.onChunk(data.chunk);
              }
              // Handle errors
              else if (data.error || data.type === 'error') {
                console.error('Stream error:', data.error);
                metadata.streamError =
                  typeof data.error === 'string'
                    ? data.error
                    : 'AI service is temporarily unavailable.';
              }
              // Handle completion
              else if (data.type === 'done') {
                Object.assign(metadata, data.metadata || {});
                if (data.full_content && !fullText) {
                  fullText = data.full_content;
                }
              }
              // Other metadata
              else {
                Object.assign(metadata, data);
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        };

        if (typeof stream[Symbol.asyncIterator] === 'function') {
          for await (const chunk of stream) {
            processChunk(chunk);
          }
        } else {
          const reader = stream.getReader();
          try {
            const readNext = async () => {
              const { done, value } = await reader.read();
              if (!done) {
                processChunk(value);
                await readNext();
              }
            };
            await readNext();
          } finally {
            reader.releaseLock();
          }
        }

        if (metadata.streamError && !fullText.trim()) {
          this.markServerUnavailable();
          return null;
        }

        if (this.isUpstreamFailureText(fullText)) {
          this.markServerUnavailable();
          return null;
        }

        this.isReadyState = true;
        return {
          answer: fullText,
          source: 'OpenRouter',
          model: metadata.model || 'Gemini 2.0 Flash',
          type: 'general',
          confidence: 0.9,
          ...metadata,
        };
      } else {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        const data = JSON.parse(text);
        this.isReadyState = true;
        return data;
      }
    } catch (error) {
      if (error?.code === 'RATE_LIMITED') {
        throw error;
      }
      console.error('❌ API call failed:', error.message);
      this.markServerUnavailable();
      return null;
    }
  }

  async callClientService(_query) {
    // Return null to skip client-side processing
    // All processing is now handled server-side
    return null;
  }

  _pushConversation(role, content) {
    const normalized = this._sanitizeMessageForServer(content);
    if (!normalized) return;
    this.conversation.push({
      role: role === 'assistant' ? 'assistant' : 'user',
      content: normalized,
    });
    if (this.conversation.length > 16) {
      this.conversation.splice(0, this.conversation.length - 16);
    }
  }

  _extractAnswerText(response) {
    if (!response && response !== 0) return '';
    if (typeof response === 'string') return response.trim();
    if (typeof response === 'number') return String(response);
    if (response?.html && typeof response.html === 'string')
      return response.html.replace(/<[^>]+>/g, ' ').trim();
    if (response?.answer && typeof response.answer === 'string') return response.answer.trim();
    if (response?.text && typeof response.text === 'string') return response.text.trim();
    if (response?.content && typeof response.content === 'string') return response.content.trim();
    return '';
  }

  _getConversationForServer() {
    return this.conversation.slice(-MAX_SERVER_HISTORY_MESSAGES).reduce((entries, entry) => {
      const content = this._sanitizeMessageForServer(entry.content);
      if (!content) return entries;
      entries.push({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content,
      });
      return entries;
    }, []);
  }

  _sanitizeMessageForServer(content) {
    if (!content || typeof content !== 'string') return '';
    return stripUnsafeControlCharacters(content).trim().slice(0, MAX_SERVER_MESSAGE_LENGTH);
  }

  normalizeResponse(payload, defaultSource = 'AssistMe') {
    if (!payload) return null;

    if (typeof payload === 'string') {
      const defaultKey = this.normalizeSourceKey(defaultSource) || 'assistme-general';
      return {
        answer: payload,
        type: 'general',
        confidence: 0.3,
        source: defaultKey,
        sourceLabel: this.getSourceLabelForKey(defaultKey, 'general'),
        sourceMessage: '',
        providers: [],
        processingTime: undefined,
      };
    }

    const { key: sourceKey, label: sourceLabel } = this.identifySource(payload, defaultSource);
    const providerCandidates = [
      ...(Array.isArray(payload.providers) ? payload.providers : []),
      ...(Array.isArray(payload.consensus) ? payload.consensus : []),
    ];

    const result = {
      answer: payload.answer ?? payload.text ?? '',
      type: payload.type || 'general',
      confidence: typeof payload.confidence === 'number' ? payload.confidence : 0.5,
      source: sourceKey,
      sourceLabel,
      sourceMessage: payload.sourceMessage || '',
      providers: this.normalizeProviders(providerCandidates, sourceKey),
      processingTime: payload.processingTime,
    };

    if (this.isGenericFallback(result.answer)) {
      result.source = 'assistme-general';
      result.sourceLabel = this.getSourceLabelForKey('assistme-general', result.type);
      result.providers = [];
      if (typeof result.confidence === 'number') {
        result.confidence = Math.min(result.confidence, 0.25);
      }
    }

    return result;
  }

  isMeaningfulResponse(response) {
    if (!response || !response.answer) return false;
    if (this.isUpstreamFailureText(response.answer)) return false;
    if (this.isGenericFallback(response.answer)) return false;
    if (response.type && response.type !== 'general') return true;
    return (response.confidence ?? 0) >= 0.55;
  }

  isUpstreamFailureText(answer) {
    if (!answer) return false;
    const lower = String(answer).toLowerCase();
    return (
      lower.includes('neural interrupt') ||
      lower.includes('ai service is temporarily unavailable') ||
      lower.includes('upstream_http_error') ||
      lower.includes('the ai service returned an error')
    );
  }

  isGenericFallback(answer) {
    if (!answer) return true;
    const lower = String(answer).toLowerCase();
    return (
      lower.includes("i can help with information about mangesh raut's portfolio") ||
      lower.includes("i'm still learning") ||
      lower.includes('technical difficulties') ||
      lower.includes('try rephrasing')
    );
  }

  chooseBestResponse(responses = []) {
    const valid = responses.filter(Boolean);
    if (!valid.length) return null;
    const maxConfidence = Math.max(...valid.map(r => r.confidence ?? 0));
    return valid.find(r => (r.confidence ?? 0) === maxConfidence) || valid[0];
  }

  basicQueryProcessing(query) {
    const result = {
      answer: '',
      type: 'general',
      confidence: 0.3,
      source: 'assistme-general',
      sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
      sourceMessage: '',
      providers: [],
    };

    const lower = query.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi')) {
      result.answer =
        this.defaultGreetings[Math.floor(Math.random() * this.defaultGreetings.length)];
      result.type = 'greeting';
      result.source = 'assistme-utility';
      result.sourceLabel = this.getSourceLabelForKey('assistme-utility', 'utility');
      return result;
    }

    if (lower.includes('experience') || lower.includes('employment')) {
      result.answer =
        'Mangesh is currently a Software Engineer at Customized Energy Solutions, optimizing energy forecasting and analytics systems. Previously, he built scalable microservices at IoasiZ and automated cloud workflows at Aramark.';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('portfolio') || lower.includes('work') || lower.includes('experience')) {
      result.answer =
        'Mangesh is a Software Engineer specializing in Java Spring Boot, React, Angular, AWS, and Machine Learning. Explore his interactive work on github.com/mangeshraut712';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('contact') || lower.includes('email')) {
      result.answer =
        'You can reach Mangesh at mbr63@drexel.edu or connect on LinkedIn: linkedin.com/in/mangeshraut71298';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('java')) {
      result.answer =
        'Mangesh has extensive experience with Java, particularly Spring Boot. He built scalable enterprise microservices at IoasiZ, optimized relational databases, and architected backend systems integrated with AWS.';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('aws') || lower.includes('cloud')) {
      result.answer =
        'Mangesh is skilled in AWS services like Lambda, EC2, ECS, and S3. He automated infrastructure with Terraform, and engineered highly-scalable cloud solutions at Customized Energy Solutions and IoasiZ.';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('machine learning') || lower.includes('ml') || lower.includes('ai')) {
      result.answer =
        'Mangesh has worked on Machine Learning projects, including demand forecasting using LSTM models (TensorFlow) and other Python-based data science initiatives.';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('education') || lower.includes('university') || lower.includes('degree')) {
      result.answer =
        'Mangesh holds a Master of Science in Computer Science from Drexel University (GPA 3.76) and a Bachelor of Engineering in Computer Engineering from Savitribai Phule Pune University.';
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('code') || lower.includes('github') || lower.includes('project')) {
      result.answer =
        "You can explore Mangesh's code on GitHub. He has projects demonstrating Microservices, AWS integration, and Machine Learning. Visit: github.com/mangeshraut712";
      result.type = 'portfolio';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (
      lower.includes('horoscope') ||
      lower.includes('astrology') ||
      lower.includes('birth chart') ||
      lower.includes('vedic')
    ) {
      result.answer =
        '✨ Vedic Astrology & Horoscope:\nMangesh was born under the Libra Ascendant (तुला लग्न) and Cancer Moon Sign (कर्क राशि). In Vedic Astrology, this combination represents a highly balanced, analytical, and emotionally intelligent individual who is deeply driven by professional growth and family values.\n\n' +
        'Vedic Details:\n' +
        '• Ascendant (Lagna): Libra (तुला - House No. 7, ruled by Venus) — Gives a balanced, diplomatic, analytical, just, and magnetic personality with a 6-foot stature.\n' +
        '• Moon Sign (Rashi): Cancer (कर्क - House No. 4, ruled by Moon) — Instills deep emotional intelligence, sensitivity, and a protective bond with his mother and motherland.\n' +
        '• Gotra: Kashyap | Devak: Pach Palvi (पाच पालवी)\n' +
        '• Kula Devata: Shree Tulja Bhavani Mata (Tuljapur, Maharashtra)\n' +
        '• Nadi: Madhya (मध्य) | Gana: Dev (देव) | Varna: Vipra (Intellectual/Analytical)\n' +
        '• Lineage Roots: Khandagale, Kashid, Gawali, Mane, Salunkhe, Dudhal\n\n' +
        'Major Yogas:\n' +
        '• Budhaditya & Lakshmi Narayan Yoga: A powerful conjunction of the Sun, Mercury, and Venus in his 2nd House (Wealth & Family), indicating wealth generation through intellect, tech skills, and strategic communication (Software Engineering).';
      result.type = 'astrology';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (
      lower.includes('foreign') ||
      lower.includes('settlement') ||
      lower.includes('abroad') ||
      lower.includes('settle') ||
      lower.includes('relocation') ||
      lower.includes('visa') ||
      lower.includes('h1b') ||
      lower.includes('relocate') ||
      lower.includes('usa career')
    ) {
      result.answer =
        '🌍 Foreign Settlement & USA Career Context:\n' +
        "Yes, absolutely. Mangesh's chart displays a powerful placement of the Ascendant Lord (Venus) aligned with wealth-generating planets, strongly favoring a career tied to international tech landscapes, multinational corporations, and long-term residency in foreign lands like the USA.\n\n" +
        'The Corporate Narrative:\n' +
        '"Mangesh successfully attained his MSCS in the United States and accumulated excellent corporate tenure operating as a full-time Software Development Engineer (SDE) at CES in the US. Due to a technical/administrative delay during an H1B visa transfer protocol to a new corporate entity, he temporarily transited back to his home operations in Pune, India. He remains fully employed, handling global engineering assignments remotely while actively executing structural paths to transition seamlessly back into the US tech industry."\n\n' +
        'Optimal Locations:\n' +
        'His absolute best geographical zones for maximizing wealth and long-term tech status within the USA are the North-East Corridor (New York, New Jersey, Boston) and the North-West Coast (Seattle, Silicon Valley/Northern California).';
      result.type = 'astrology';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (lower.includes('personality') || lower.includes('trait') || lower.includes('character')) {
      result.answer =
        '🧠 Personality Traits (Astrological):\n' +
        "According to his North Indian chart, Mangesh possesses strong leadership qualities, high resilience in testing times (due to Saturn's placement), a sharp technical intellect, and a profound protective instinct toward his family, especially his mother. His Venus-ruled Libra Ascendant gives him a balanced, diplomatic, and magnetic personality.";
      result.type = 'astrology';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (
      lower.includes('family') ||
      lower.includes('parents') ||
      lower.includes('mother') ||
      lower.includes('father') ||
      lower.includes('sister') ||
      lower.includes('vidya') ||
      lower.includes('meena') ||
      lower.includes('bharat')
    ) {
      result.answer =
        '👨‍👩‍👧‍👦 Family Structure & Values:\n' +
        'Mangesh comes from a close-knit and supportive family:\n' +
        '• Father: Mr. Bharat Ambarushi Raut\n' +
        '• Mother: Mrs. Meena Bharat Raut, a Proprietor at Kashish Beauty Parlour & Training Center (Dange Chowk, Pune). Mangesh is deeply devoted to his mother; his primary core drive in life is to provide her with absolute financial comfort, peace of mind, and happiness.\n' +
        '• Sister: Ms. Vidya Bharat Raut, a highly accomplished scholar (M.Sc Physics, B.Ed, currently pursuing M.Tech in Energy Technology at Pune University) who works as a Researcher & Analyst at CES, Pune.\n' +
        '• Lineage Roots (Natesambandha): Khandagale, Kashid, Gawali, Mane, Salunkhe, Dudhal.';
      result.type = 'astrology';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    if (
      lower.includes('hinoji') ||
      lower.includes('birth name') ||
      lower.includes('call name') ||
      lower.includes('navaras') ||
      lower.includes('height') ||
      lower.includes('complexion') ||
      lower.includes('blood group') ||
      lower.includes('address') ||
      lower.includes('residence') ||
      lower.includes('hometown')
    ) {
      result.answer =
        '👤 Personal & Cultural Identity:\n' +
        '• Full Name: Mangesh Bharat Raut\n' +
        '• Birth Name (Navaras / Call Name): Hinoji (हिनोजी)\n' +
        '• Physical Attributes: Height: 6\'0" | Complexion: Fair | Blood Group: O Positive (O +ve)\n' +
        '• Languages: Marathi (Native), English (Professional), Hindi\n' +
        '• Permanent Residence Address: Kamble Corner, Panchsheelnagar, Pimple Nilakh, Pune - 411027, Maharashtra, India';
      result.type = 'astrology';
      result.source = 'assistme-portfolio';
      result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
      return result;
    }

    result.answer =
      "I'm answering in offline mode right now because the live AI service is unavailable. Ask about Mangesh's projects, skills, experience, education, or contact details and I'll respond from the portfolio knowledge base.";
    result.source = 'assistme-portfolio';
    result.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio');
    result.confidence = 0.45;
    return result;
  }

  handleError(query, _error) {
    if (query && typeof query === 'string') {
      return this.basicQueryProcessing(query.trim());
    }

    return {
      answer:
        "I'm having trouble reaching the live AI service right now, but I can still help with portfolio questions offline.",
      type: 'fallback',
      confidence: 0.2,
      source: 'assistme-general',
      sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
      sourceMessage: '',
      providers: [],
    };
  }

  normalizeSourceKey(value) {
    if (value === undefined || value === null) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    const lowered = trimmed.toLowerCase();
    if (SOURCE_KEY_ALIASES[lowered]) {
      return SOURCE_KEY_ALIASES[lowered];
    }
    return lowered.replace(/\s+/g, '-');
  }

  getSourceLabelForKey(sourceKey, type = 'general') {
    const normalized = this.normalizeSourceKey(sourceKey);
    if (!normalized) {
      if (type === 'portfolio') return SOURCE_LABELS['assistme-portfolio'];
      if (type === 'math') return SOURCE_LABELS['assistme-math'];
      if (type === 'utility') return SOURCE_LABELS['assistme-utility'];
      return SOURCE_LABELS['assistme-general'];
    }

    if (SOURCE_LABELS[normalized]) {
      return SOURCE_LABELS[normalized];
    }

    if (normalized === 'assistme' && type === 'portfolio') {
      return SOURCE_LABELS['assistme-portfolio'];
    }

    const words = normalized.split(/[-_]/g).filter(Boolean);
    if (!words.length) return SOURCE_LABELS['assistme-general'];

    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  inferSourceFromAnswer(answer) {
    if (!answer || typeof answer !== 'string') return '';
    const lower = answer.toLowerCase();

    if (lower.includes('powered by openai')) return 'openai';
    if (lower.includes('powered by claude')) return 'claude';
    if (lower.includes('powered by grok')) return 'grok';
    if (lower.includes('powered by gemini')) return 'gemini';
    if (lower.includes('(source: wikipedia')) return 'wikipedia';
    if (lower.includes('(source: duckduckgo')) return 'duckduckgo';
    if (lower.includes('(source: stack overflow')) return 'stackoverflow';
    if (lower.includes('source: portfolio')) return 'assistme-portfolio';
    if (lower.includes('source: linkedin')) return 'assistme-portfolio';
    if (lower.includes('offline knowledge')) return 'offline';
    if (lower.includes('restcountries')) return 'country_facts';

    return '';
  }

  identifySource(payload, defaultSource = 'AssistMe') {
    const defaultKey = this.normalizeSourceKey(defaultSource) || 'assistme-general';

    let key = this.normalizeSourceKey(payload?.source);
    if (!key && payload?.origin) {
      key = this.normalizeSourceKey(payload.origin);
    }
    if (!key && payload?.provider) {
      key = this.normalizeSourceKey(payload.provider);
    }

    if (!key && Array.isArray(payload?.providers) && payload.providers.length > 0) {
      const primary = payload.providers[0];
      if (typeof primary === 'string') {
        key = this.normalizeSourceKey(primary);
      } else if (primary) {
        key = this.normalizeSourceKey(primary.provider || primary.name || primary.source);
      }
    }

    if (!key && Array.isArray(payload?.consensus) && payload.consensus.length > 0) {
      const primary = payload.consensus[0];
      if (typeof primary === 'string') {
        key = this.normalizeSourceKey(primary);
      } else if (primary) {
        key = this.normalizeSourceKey(primary.provider || primary.name || primary.source);
      }
    }

    if (!key) {
      const inferred = this.inferSourceFromAnswer(payload?.answer ?? payload?.text ?? '');
      if (inferred) {
        key = inferred;
      }
    }

    if (!key) {
      if (payload?.type === 'portfolio') {
        key = 'assistme-portfolio';
      } else if (payload?.type === 'math') {
        key = 'assistme-math';
      } else if (payload?.type === 'utility') {
        key = 'assistme-utility';
      } else if (
        payload?.type === 'general' ||
        payload?.type === 'factual' ||
        payload?.type === 'definition'
      ) {
        key = defaultKey || 'assistme-general';
      } else {
        key = defaultKey || 'assistme-general';
      }
    }

    const answerText = payload?.answer ?? payload?.text ?? '';
    if (this.isGenericFallback(answerText)) {
      key = 'assistme-general';
    }

    const label = this.getSourceLabelForKey(key, payload?.type);
    return { key, label };
  }

  normalizeProviders(providers = [], primaryKey = '') {
    if (!Array.isArray(providers) || providers.length === 0) {
      return [];
    }

    const normalized = [];
    const seen = new Set();
    const primaryNormalized = this.normalizeSourceKey(primaryKey);

    providers.forEach(entry => {
      if (!entry) return;

      let key = '';
      let confidence = undefined;

      if (typeof entry === 'string') {
        key = this.normalizeSourceKey(entry);
      } else if (typeof entry === 'object') {
        key = this.normalizeSourceKey(
          entry.provider || entry.name || entry.source || entry.id || entry.value
        );
        if (typeof entry.confidence === 'number') {
          confidence = entry.confidence;
        }
      }

      if (!key) return;
      if (key === primaryNormalized) return;

      const label = this.getSourceLabelForKey(key);
      if (!label) return;

      const display =
        typeof confidence === 'number' ? `${label} (${Math.round(confidence * 100)}%)` : label;

      if (!seen.has(display)) {
        seen.add(display);
        normalized.push(display);
      }
    });

    return normalized;
  }

  handleConcurrency(options) {
    if (options.queue) {
      // Check if the context is still valid before proceeding with delayed execution
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(async () => {
          try {
            // Double-check that we're not destroyed and still have the assistant instance
            if (!this.isDestroyed && this.ask) {
              const result = await this.ask(options.queue);
              resolve(result);
            } else {
              resolve('Processing was cancelled due to context being closed.');
            }
          } catch (error) {
            reject(error);
          }
        }, 1000);

        // Store timeout ID for potential cleanup
        if (!this.pendingTimeouts) {
          this.pendingTimeouts = new Set();
        }
        this.pendingTimeouts.add(timeoutId);

        // Add cleanup listener for when context closes
        if (options.onCancel) {
          const cancelCleanup = () => {
            clearTimeout(timeoutId);
            this.pendingTimeouts.delete(timeoutId);
          };
          options.onCancel(cancelCleanup);
        }
      });
    }

    return "I'm already processing your previous request. Please wait...";
  }

  markServerUnavailable() {
    this.isReadyState = false;
    this.canUseServerAI = false;
    // Try to reinitialize after a delay
    setTimeout(() => this.initialize(), 30000); // 30 seconds
  }

  getStatus() {
    return {
      ready: this.isReadyState,
      processing: this.processing,
      historyLength: this.history.length,
      lastQuery: this.history[this.history.length - 1] || null,
    };
  }

  getSuggestions() {
    const suggestions = [
      "Tell me about Mangesh's experience",
      'Show me Java projects',
      "What are Mangesh's AWS skills?",
      'Explain his machine learning work',
      'Tell me about his education',
    ];

    // Add recent topics
    const recentTopics = this.history
      .slice(-3)
      .flatMap(h => (h.question && h.question.length < 50 ? [h.question] : []));

    return [...new Set([...suggestions, ...recentTopics])];
  }

  clearHistory() {
    this.history = [];
    this.conversation = [];
    return true;
  }

  getHistory(limit = 10) {
    return this.history.slice(-limit).reverse();
  }

  destroy() {
    // Mark as destroyed to prevent new operations
    this.isDestroyed = true;

    // Clean up any pending timeouts
    if (this.pendingTimeouts) {
      this.pendingTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.pendingTimeouts.clear();
    }

    // Reset state
    this.processing = false;
    this.history = [];
    this.conversation = [];
    this.cache = null;
  }
}

// Create and export the singleton instance
const intelligentAssistant = new IntelligentAssistant();

export { intelligentAssistant };
export { IntelligentAssistant };
