import { api } from './config.js';
import { agenticActions } from '../modules/agentic-actions.js';
let API_BASE = '';
const VERCEL_BACKEND = 'https://mangeshraut.pro';
if ('undefined' != typeof window)
  if (window.APP_CONFIG?.apiBaseUrl)
    ((API_BASE = window.APP_CONFIG.apiBaseUrl), console.log('⚙️ Using custom API base:', API_BASE));
  else {
    const e = window.location.hostname || '';
    e.includes('run.app')
      ? ((API_BASE = ''), console.log('🌐 Running on Cloud Run (self-hosted mode)'))
      : e.includes('vercel.app')
        ? ((API_BASE = ''), console.log('🌐 Running on Vercel (self-hosted mode)'))
        : ((API_BASE = VERCEL_BACKEND),
          console.log('🔗 Using Vercel backend (API keys configured):', API_BASE));
  }
else
  'undefined' != typeof process &&
    process.env?.VERCEL_URL &&
    (API_BASE = `https://${process.env.VERCEL_URL}`);
function buildApiUrl(e) {
  return API_BASE
    ? e.startsWith('http://') || e.startsWith('https://')
      ? e
      : `${API_BASE}${e.startsWith('/') ? e : `/${e}`}`
    : e;
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
  },
  SOURCE_LABELS = {
    assistme: 'AssistMe Portfolio',
    'assistme-portfolio': 'AssistMe Portfolio',
    'assistme-math': 'AssistMe Math Engine',
    'assistme-utility': 'AssistMe Utility',
    'assistme-general': 'AssistMe',
    openrouter: 'OpenRouter AI',
  };
class IntelligentAssistant {
  constructor(e = {}) {
    if (
      ((this.cache = null),
      (this.isReadyState = !1),
      (this.defaultGreetings = [
        "Hello! I'm AssistMe, Mangesh's AI portfolio assistant. I can walk you through his projects, experience, and technical skills. How can I help you today?",
      ]),
      (this.processing = !1),
      (this.history = []),
      (this.conversation = []),
      (this.canUseServerAI = !!api.baseUrl),
      'undefined' != typeof window)
    ) {
      const e = window.location.hostname;
      this.canUseServerAI =
        this.canUseServerAI ||
        e.endsWith('.vercel.app') ||
        'localhost' === e ||
        '127.0.0.1' === e ||
        e.endsWith('mangeshraut.pro') ||
        (e.includes('github.io') && api.baseUrl);
    }
  }
  async initialize(e = {}) {
    const s = 'undefined' != typeof window ? window.location.hostname : '';
    if (
      s.includes('github.io') ||
      s.includes('mangeshraut712.github.io') ||
      !navigator.onLine ||
      ('https:' === window.location.protocol &&
        !['localhost', '127.0.0.1', '0.0.0.0'].includes(s) &&
        !s.endsWith('.vercel.app') &&
        !s.endsWith('.herokuapp.com') &&
        !s.endsWith('.netlify.app'))
    )
      return (
        console.log('🤖 GitHub Pages detected - checking API availability...'),
        console.log('Current hostname:', s),
        console.log('Protocol:', window.location.protocol),
        console.log('API Base URL:', api.baseUrl),
        API_BASE && (API_BASE.includes('vercel.app') || API_BASE.startsWith('http'))
          ? (console.log('✅ Remote API configured - hybrid mode enabled'),
            (this.canUseServerAI = !0),
            (this.isReadyState = !0),
            !0)
          : (console.log('📴 No API configured - offline mode only'), (this.isReadyState = !0), !1)
      );
    if (!navigator.onLine)
      return (console.log('📴 Offline mode - no network connection'), (this.isReadyState = !0), !1);
    if (API_BASE && API_BASE.length > 0)
      return (
        console.log('✅ API Base configured:', API_BASE),
        console.log('   Enabling server AI optimistically (will verify on first request)'),
        (this.canUseServerAI = !0),
        (this.isReadyState = !0),
        !0
      );
    try {
      console.log('🖥️ Testing server connectivity...');
      const e = async (e, s) =>
        (
          await fetch(buildApiUrl(e), {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(s),
          })
        ).ok;
      return (await e('/api/health', 15e3).catch(() => !1)) ||
        (await e('/api/status', 15e3).catch(() => !1))
        ? (console.log('✅ Server connectivity test successful'),
          (this.canUseServerAI = !0),
          (this.isReadyState = !0),
          !0)
        : (console.warn('⚠️ Server connectivity test failed - will try API calls anyway'),
          (this.canUseServerAI = !0),
          (this.isReadyState = !0),
          !0);
    } catch (e) {
      return (
        console.warn('Server initialization failed - enabling optimistic mode:', e.message),
        (this.canUseServerAI = !0),
        (this.isReadyState = !0),
        !0
      );
    }
  }
  isReady() {
    return this.isReadyState;
  }
  async ask(e, s = {}) {
    if (!e || 'string' != typeof e) throw new Error('Question must be a valid string');
    if (this.processing) return this.handleConcurrency(s);
    this.processing = !0;
    try {
      this.history.push({ question: e, timestamp: Date.now() });
      const t = e.trim();
      this._pushConversation('user', t);
      const i = Date.now(),
        o = await agenticActions.detectAndExecute(t);
      if (o.actionDetected) {
        console.log('✅ Action executed:', o);
        const e = Date.now() - i,
          s = {
            answer: o.message,
            type: 'action',
            confidence: 1,
            source: 'agentic-action',
            sourceLabel: 'Agentic AI',
            model: 'Action Handler',
            action: o.actionName,
            actionResult: o.result,
            processingTime: e,
            runtime: `${e}ms`,
            providers: ['Agentic AI'],
            category: 'Action',
            charCount: o.message.length,
            safetyScore: 1,
            timestamp: Date.now(),
          };
        return (
          (this.history[this.history.length - 1].response = s),
          (this.history[this.history.length - 1].processingTime = e),
          this._pushConversation('assistant', o.message),
          s
        );
      }
      const n = await this.processQuery(t, s);
      ((this.history[this.history.length - 1].response = n),
        (this.history[this.history.length - 1].processingTime =
          Date.now() - this.history[this.history.length - 1].timestamp));
      const r = this._extractAnswerText(n);
      return (r && this._pushConversation('assistant', r), n);
    } catch (s) {
      console.error('Error processing query:', s);
      const t = this.handleError(e, s),
        i = this._extractAnswerText(t);
      return (i && this._pushConversation('assistant', i), t);
    } finally {
      this.processing = !1;
    }
  }
  async processQuery(e, s = {}) {
    const t = e.trim(),
      i = [];
    if (!this.isReady())
      try {
        await this.initialize();
      } catch (e) {
        console.warn('Assistant initialization failed before processing:', e);
      }
    const o = await this.callApi(t, s),
      n = this.normalizeResponse(o, 'AssistMe Server');
    if (n && (i.push(n), this.isMeaningfulResponse(n))) return n;
    const r = await this.callClientService(t),
      a = this.normalizeResponse(r, 'AssistMe');
    a && i.push(a);
    const c = this.chooseBestResponse(i);
    return c || this.basicQueryProcessing(t);
  }
  async callApi(e, s = {}) {
    const t = 'undefined' != typeof window ? window.location.hostname : '';
    if (
      !(
        this.canUseServerAI ||
        (t.includes('github.io') && API_BASE && API_BASE.includes('vercel.app'))
      )
    )
      return (
        console.log('🔄 Skipping server API call - offline mode or no API configured'),
        console.log('   canUseServerAI:', this.canUseServerAI),
        console.log('   API_BASE:', API_BASE),
        null
      );
    console.log('📡 API Base URL:', API_BASE);
    try {
      const t = buildApiUrl('/api/chat');
      console.log('🖥️ Calling API:', t);
      const i = 'function' == typeof s.onChunk,
        o = await fetch(t, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: i ? 'application/x-ndjson' : 'application/json',
            Origin: window.location.origin,
          },
          body: JSON.stringify({
            message: e,
            messages: this._getConversationForServer(),
            context: s.context || {},
            stream: i,
          }),
          signal: AbortSignal.timeout(3e4),
        });
      if (!o.ok) {
        const e = await o.text().catch(() => 'No error details');
        throw (
          console.error(`❌ Server error ${o.status}: ${e}`),
          new Error(`Server responded with ${o.status}: ${o.statusText}`)
        );
      }
      if (i) {
        const e = o.body.getReader(),
          t = new TextDecoder();
        let i = '',
          n = {},
          r = '';
        for (;;) {
          const { done: o, value: a } = await e.read();
          if (o) break;
          r += t.decode(a, { stream: !0 });
          const c = r.split('\n');
          r = r.endsWith('\n') ? '' : c.pop();
          for (const e of c) {
            const t = e.trim();
            if (t)
              try {
                const e = JSON.parse(t);
                if ('chunk' === e.type && e.content) ((i += e.content), s.onChunk(e.content));
                else if (e.chunk) ((i += e.chunk), s.onChunk(e.chunk));
                else if (e.error || 'error' === e.type) {
                  console.error('Stream error:', e.error);
                  const t = `\n\n**Neural Interrupt**: ${e.error || 'Connection lost.'}`;
                  ((i += t), 'function' == typeof s.onChunk && s.onChunk(t));
                } else
                  'done' === e.type
                    ? (Object.assign(n, e.metadata || {}),
                      e.full_content && !i && (i = e.full_content))
                    : Object.assign(n, e);
              } catch (e) {
                console.warn('Error parsing stream chunk:', e);
              }
          }
        }
        return (
          (this.isReadyState = !0),
          {
            answer: i,
            source: 'OpenRouter',
            model: n.model || 'Gemini 2.0 Flash',
            type: 'general',
            confidence: 0.9,
            ...n,
          }
        );
      }
      {
        const e = await o.text();
        if (!e) throw new Error('Empty response from server');
        const s = JSON.parse(e);
        return (
          console.log('✅ API response received:', {
            source: s.source,
            type: s.type,
            confidence: s.confidence,
            answerLength: s.answer?.length || 0,
          }),
          (this.isReadyState = !0),
          s
        );
      }
    } catch (e) {
      return (
        console.error('❌ API call failed:', e.message),
        console.log('💡 Falling back to client-side processing'),
        this.markServerUnavailable(),
        null
      );
    }
  }
  async callClientService(e) {
    return null;
  }
  _pushConversation(e, s) {
    if (!s || 'string' != typeof s) return;
    const t = s.trim();
    t &&
      (this.conversation.push({ role: 'assistant' === e ? 'assistant' : 'user', content: t }),
      this.conversation.length > 16 && this.conversation.splice(0, this.conversation.length - 16));
  }
  _extractAnswerText(e) {
    return e || 0 === e
      ? 'string' == typeof e
        ? e.trim()
        : 'number' == typeof e
          ? String(e)
          : e?.html && 'string' == typeof e.html
            ? e.html.replace(/<[^>]+>/g, ' ').trim()
            : e?.answer && 'string' == typeof e.answer
              ? e.answer.trim()
              : e?.text && 'string' == typeof e.text
                ? e.text.trim()
                : e?.content && 'string' == typeof e.content
                  ? e.content.trim()
                  : ''
      : '';
  }
  _getConversationForServer() {
    return this.conversation
      .slice(-12)
      .map(e => ({ role: 'assistant' === e.role ? 'assistant' : 'user', content: e.content }));
  }
  normalizeResponse(e, s = 'AssistMe') {
    if (!e) return null;
    if ('string' == typeof e) {
      const t = this.normalizeSourceKey(s) || 'assistme-general';
      return {
        answer: e,
        type: 'general',
        confidence: 0.3,
        source: t,
        sourceLabel: this.getSourceLabelForKey(t, 'general'),
        sourceMessage: '',
        providers: [],
        processingTime: void 0,
      };
    }
    const { key: t, label: i } = this.identifySource(e, s),
      o = [
        ...(Array.isArray(e.providers) ? e.providers : []),
        ...(Array.isArray(e.consensus) ? e.consensus : []),
      ],
      n = {
        answer: e.answer ?? e.text ?? '',
        type: e.type || 'general',
        confidence: 'number' == typeof e.confidence ? e.confidence : 0.5,
        source: t,
        sourceLabel: i,
        sourceMessage: e.sourceMessage || '',
        providers: this.normalizeProviders(o, t),
        processingTime: e.processingTime,
      };
    return (
      this.isGenericFallback(n.answer) &&
        ((n.source = 'assistme-general'),
        (n.sourceLabel = this.getSourceLabelForKey('assistme-general', n.type)),
        (n.providers = []),
        'number' == typeof n.confidence && (n.confidence = Math.min(n.confidence, 0.25))),
      n
    );
  }
  isMeaningfulResponse(e) {
    return (
      !(!e || !e.answer) &&
      !this.isGenericFallback(e.answer) &&
      (!(!e.type || 'general' === e.type) || (e.confidence ?? 0) >= 0.55)
    );
  }
  isGenericFallback(e) {
    if (!e) return !0;
    const s = String(e).toLowerCase();
    return (
      s.includes("i can help with information about mangesh raut's portfolio") ||
      s.includes("i'm still learning") ||
      s.includes('technical difficulties') ||
      s.includes('try rephrasing')
    );
  }
  chooseBestResponse(e = []) {
    const s = e.filter(Boolean);
    return s.length ? s.sort((e, s) => (s.confidence ?? 0) - (e.confidence ?? 0))[0] || s[0] : null;
  }
  basicQueryProcessing(e) {
    const s = {
        answer: '',
        type: 'general',
        confidence: 0.3,
        source: 'assistme-general',
        sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
        sourceMessage: '',
        providers: [],
      },
      t = e.toLowerCase();
    return t.includes('hello') || t.includes('hi')
      ? ((s.answer =
          this.defaultGreetings[Math.floor(Math.random() * this.defaultGreetings.length)]),
        (s.type = 'greeting'),
        (s.source = 'assistme-utility'),
        (s.sourceLabel = this.getSourceLabelForKey('assistme-utility', 'utility')),
        s)
      : t.includes('experience') || t.includes('employment')
        ? ((s.answer =
            'Mangesh is currently a Software Engineer at IoasiZ, building scalable microservices. Previously, he worked at Aramark as a Student Software Engineer, optimizing cloud resources and automating workflows.'),
          (s.type = 'portfolio'),
          (s.source = 'assistme-portfolio'),
          (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
          s)
        : t.includes('portfolio') || t.includes('work') || t.includes('experience')
          ? ((s.answer =
              'Mangesh is a Software Engineer specializing in Java Spring Boot, AngularJS, AWS, and machine learning. Check out his GitHub: github.com/mangeshraut712'),
            (s.type = 'portfolio'),
            (s.source = 'assistme-portfolio'),
            (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
            s)
          : t.includes('contact') || t.includes('email')
            ? ((s.answer =
                'You can reach Mangesh at mbr63@drexel.edu or connect on LinkedIn: linkedin.com/in/mangeshraut71298'),
              (s.type = 'portfolio'),
              (s.source = 'assistme-portfolio'),
              (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
              s)
            : t.includes('java')
              ? ((s.answer =
                  'Mangesh has extensive experience with Java, particularly Spring Boot. He refactored legacy monoliths into microservices at IoasiZ and built energy analytics dashboards using Java backend.'),
                (s.type = 'portfolio'),
                (s.source = 'assistme-portfolio'),
                (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
                s)
              : t.includes('aws') || t.includes('cloud')
                ? ((s.answer =
                    'Mangesh is skilled in AWS services like Lambda, EC2, and RDS. He automated workflows using Terraform and Python, and managed cloud infrastructure at Aramark and IoasiZ.'),
                  (s.type = 'portfolio'),
                  (s.source = 'assistme-portfolio'),
                  (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
                  s)
                : t.includes('machine learning') || t.includes('ml') || t.includes('ai')
                  ? ((s.answer =
                      'Mangesh has worked on Machine Learning projects, including demand forecasting using LSTM models (TensorFlow) and other Python-based data science initiatives.'),
                    (s.type = 'portfolio'),
                    (s.source = 'assistme-portfolio'),
                    (s.sourceLabel = this.getSourceLabelForKey('assistme-portfolio', 'portfolio')),
                    s)
                  : t.includes('education') || t.includes('university') || t.includes('degree')
                    ? ((s.answer =
                        'Mangesh holds a Master of Science in Computer Science from Drexel University (GPA 3.76) and a Bachelor of Engineering in Computer Engineering from Savitribai Phule Pune University.'),
                      (s.type = 'portfolio'),
                      (s.source = 'assistme-portfolio'),
                      (s.sourceLabel = this.getSourceLabelForKey(
                        'assistme-portfolio',
                        'portfolio'
                      )),
                      s)
                    : t.includes('code') || t.includes('github') || t.includes('project')
                      ? ((s.answer =
                          "You can explore Mangesh's code on GitHub. He has projects demonstrating Microservices, AWS integration, and Machine Learning. Visit: github.com/mangeshraut712"),
                        (s.type = 'portfolio'),
                        (s.source = 'assistme-portfolio'),
                        (s.sourceLabel = this.getSourceLabelForKey(
                          'assistme-portfolio',
                          'portfolio'
                        )),
                        s)
                      : ((s.answer =
                          "I'm here to help! Ask me about Mangesh's skills, experience, or general questions."),
                        s);
  }
  handleError(e, s) {
    const t = [
      "I'm experiencing some technical difficulties. Please try again in a moment.",
      "Sorry, I couldn't process that right now. Feel free to try a different question!",
      "I'm having trouble connecting right now. Please check your internet and try again.",
    ];
    return {
      answer: t[Math.floor(Math.random() * t.length)],
      type: 'fallback',
      confidence: 0.2,
      source: 'assistme-general',
      sourceLabel: this.getSourceLabelForKey('assistme-general', 'general'),
      sourceMessage: '',
      providers: [],
    };
  }
  normalizeSourceKey(e) {
    if (null == e) return '';
    const s = String(e).trim();
    if (!s) return '';
    const t = s.toLowerCase();
    return SOURCE_KEY_ALIASES[t] ? SOURCE_KEY_ALIASES[t] : t.replace(/\s+/g, '-');
  }
  getSourceLabelForKey(e, s = 'general') {
    const t = this.normalizeSourceKey(e);
    if (!t)
      return 'portfolio' === s
        ? SOURCE_LABELS['assistme-portfolio']
        : 'math' === s
          ? SOURCE_LABELS['assistme-math']
          : 'utility' === s
            ? SOURCE_LABELS['assistme-utility']
            : SOURCE_LABELS['assistme-general'];
    if (SOURCE_LABELS[t]) return SOURCE_LABELS[t];
    if ('assistme' === t && 'portfolio' === s) return SOURCE_LABELS['assistme-portfolio'];
    const i = t.split(/[-_]/g).filter(Boolean);
    return i.length
      ? i.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(' ')
      : SOURCE_LABELS['assistme-general'];
  }
  inferSourceFromAnswer(e) {
    if (!e || 'string' != typeof e) return '';
    const s = e.toLowerCase();
    return s.includes('powered by openai')
      ? 'openai'
      : s.includes('powered by claude')
        ? 'claude'
        : s.includes('powered by grok')
          ? 'grok'
          : s.includes('powered by gemini')
            ? 'gemini'
            : s.includes('(source: wikipedia')
              ? 'wikipedia'
              : s.includes('(source: duckduckgo')
                ? 'duckduckgo'
                : s.includes('(source: stack overflow')
                  ? 'stackoverflow'
                  : s.includes('source: portfolio') || s.includes('source: linkedin')
                    ? 'assistme-portfolio'
                    : s.includes('offline knowledge')
                      ? 'offline'
                      : s.includes('restcountries')
                        ? 'country_facts'
                        : '';
  }
  identifySource(e, s = 'AssistMe') {
    const t = this.normalizeSourceKey(s) || 'assistme-general';
    let i = this.normalizeSourceKey(e?.source);
    if (
      (!i && e?.origin && (i = this.normalizeSourceKey(e.origin)),
      !i && e?.provider && (i = this.normalizeSourceKey(e.provider)),
      !i && Array.isArray(e?.providers) && e.providers.length > 0)
    ) {
      const s = e.providers[0];
      'string' == typeof s
        ? (i = this.normalizeSourceKey(s))
        : s && (i = this.normalizeSourceKey(s.provider || s.name || s.source));
    }
    if (!i && Array.isArray(e?.consensus) && e.consensus.length > 0) {
      const s = e.consensus[0];
      'string' == typeof s
        ? (i = this.normalizeSourceKey(s))
        : s && (i = this.normalizeSourceKey(s.provider || s.name || s.source));
    }
    if (!i) {
      const s = this.inferSourceFromAnswer(e?.answer ?? e?.text ?? '');
      s && (i = s);
    }
    i ||
      (i =
        'portfolio' === e?.type
          ? 'assistme-portfolio'
          : 'math' === e?.type
            ? 'assistme-math'
            : 'utility' === e?.type
              ? 'assistme-utility'
              : t || 'assistme-general');
    const o = e?.answer ?? e?.text ?? '';
    this.isGenericFallback(o) && (i = 'assistme-general');
    return { key: i, label: this.getSourceLabelForKey(i, e?.type) };
  }
  normalizeProviders(e = [], s = '') {
    if (!Array.isArray(e) || 0 === e.length) return [];
    const t = [],
      i = new Set(),
      o = this.normalizeSourceKey(s);
    return (
      e.forEach(e => {
        if (!e) return;
        let s,
          n = '';
        if (
          ('string' == typeof e
            ? (n = this.normalizeSourceKey(e))
            : 'object' == typeof e &&
              ((n = this.normalizeSourceKey(e.provider || e.name || e.source || e.id || e.value)),
              'number' == typeof e.confidence && (s = e.confidence)),
          !n)
        )
          return;
        if (n === o) return;
        const r = this.getSourceLabelForKey(n);
        if (!r) return;
        const a = 'number' == typeof s ? `${r} (${Math.round(100 * s)}%)` : r;
        i.has(a) || (i.add(a), t.push(a));
      }),
      t
    );
  }
  handleConcurrency(e) {
    return e.queue
      ? new Promise((s, t) => {
          const i = setTimeout(async () => {
            try {
              if (!this.isDestroyed && this.ask) {
                const t = await this.ask(e.queue);
                s(t);
              } else s('Processing was cancelled due to context being closed.');
            } catch (e) {
              t(e);
            }
          }, 1e3);
          if (
            (this.pendingTimeouts || (this.pendingTimeouts = new Set()),
            this.pendingTimeouts.add(i),
            e.onCancel)
          ) {
            const s = () => {
              (clearTimeout(i), this.pendingTimeouts.delete(i));
            };
            e.onCancel(s);
          }
        })
      : "I'm already processing your previous request. Please wait...";
  }
  markServerUnavailable() {
    ((this.isReadyState = !1),
      (this.canUseServerAI = !1),
      setTimeout(() => this.initialize(), 3e4));
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
    const e = this.history
      .slice(-3)
      .map(e => {
        if (e.question && e.question.length < 50) return e.question;
      })
      .filter(Boolean);
    return [
      ...new Set([
        "Tell me about Mangesh's experience",
        'Show me Java projects',
        "What are Mangesh's AWS skills?",
        'Explain his machine learning work',
        'Tell me about his education',
        ...e,
      ]),
    ];
  }
  clearHistory() {
    return ((this.history = []), (this.conversation = []), !0);
  }
  getHistory(e = 10) {
    return this.history.slice(-e).reverse();
  }
  destroy() {
    ((this.isDestroyed = !0),
      this.pendingTimeouts &&
        (this.pendingTimeouts.forEach(e => {
          clearTimeout(e);
        }),
        this.pendingTimeouts.clear()),
      (this.processing = !1),
      (this.history = []),
      (this.conversation = []),
      (this.cache = null),
      console.log('Assistant destroyed and cleaned up'));
  }
}
const intelligentAssistant = new IntelligentAssistant();
export { intelligentAssistant };
export { IntelligentAssistant };
export default intelligentAssistant;
