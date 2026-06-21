/**
 * Blog Data Module
 * Stores technical articles and insights for the portfolio.
 *
 * Writing pattern for new posts:
 * - Open with a concrete reader promise.
 * - Give a short TL;DR before the detail.
 * - Split the article into what shines, what needs scrutiny, and what to do next.
 * - Include a practical workflow so the post feels useful, not just informative.
 * - End with a clear bottom line a reader can remember.
 */

export const articlePlaybook = Object.freeze([
  'Lead with the real engineering question, not the announcement list.',
  'Give readers a fast TL;DR before asking them to invest attention.',
  'Use three strong points and three caveats to keep the piece balanced.',
  'Turn ideas into a workflow, checklist, or architecture pattern.',
  'Close with one memorable bottom line.',
]);

const toList = items => items.map(item => `- ${item}`).join('\n');

const makeArticle = ({
  opening,
  readerPromise,
  tldr,
  shines,
  watch,
  workflow,
  learned,
  apply,
  bottomLine,
  note,
}) => `
${opening}

> Reader promise: ${readerPromise}

## Fast Context

The useful question is not "what was announced?" The useful question is "what changes for builders, teams, and products after this?" This field note keeps the answer practical: what is strong now, what still needs proof, and how I would use the idea in a real engineering workflow.

## TL;DR

${tldr}

## 3 Things That Shine

${toList(shines)}

## 3 Things I Would Watch

${toList(watch)}

## The Workflow I Would Use

${workflow}

## Things I Learned

${toList(learned)}

## How I Would Apply This

${apply}

${note ? `> Note: ${note}\n\n` : ''}## Bottom Line

${bottomLine}
`;

export const blogPosts = [
  {
    id: 'google-io-2026-developer-insights',
    title: 'Google I/O 2026 Field Notes: Agentic Web, Gemini, Gemma, and WebNN',
    kicker: 'Agentic web systems',
    summary:
      'A practical read on Google I/O through an engineering lens: what looks useful now, what still needs validation, and how agentic browser-side AI changes web architecture.',
    readerPromise:
      'You will leave with a clear map for splitting AI work between browser, device, and cloud instead of adding another generic chatbot.',
    pullQuote:
      'The agentic web is strongest when the browser becomes a trusted execution surface, not just a window into a remote model.',
    highlights: ['Hybrid AI stack', 'Browser-side inference', 'Tool-aware product design'],
    date: '2026-05-20',
    tags: ['Google I/O', 'Gemini', 'Gemma', 'WebNN', 'Agentic Web'],
    readTime: '7 min read',
    content: makeArticle({
      title: 'Google I/O 2026 Field Notes: Agentic Web, Gemini, Gemma, and WebNN',
      opening:
        'Google I/O matters when it reveals architecture, not when it adds one more model name to the slide deck. The signal this year is a web stack that can mix cloud reasoning, open local models, browser acceleration, and tool-calling workflows.',
      readerPromise:
        'You will leave with a clear map for splitting AI work between browser, device, and cloud instead of adding another generic chatbot.',
      tldr: 'The big shift is hybrid intelligence. Use cloud models for hard reasoning, local models for private low-latency tasks, and browser APIs for small repeated actions that should feel instant. The winning product is not a chat panel. It is a workflow where context, tools, permissions, and fallback behavior are designed together.',
      shines: [
        'Long-context Gemini workflows make document-heavy and code-heavy products more believable because the model can carry more of the working set.',
        'Gemma-style open models give teams a path to private, low-latency experiences when a task does not need frontier-scale reasoning.',
        'WebNN and WebGPU move AI closer to the user, which can reduce round trips for summarization, accessibility, search, and UI assistance.',
      ],
      watch: [
        'Local AI is still uneven because browser support, hardware capability, memory, and thermal limits vary by device.',
        'Agentic features can become expensive or unreliable when tool access is broad and success criteria are vague.',
        'Privacy language only becomes real when the product shows what context was used, where it ran, and what leaves the device.',
      ],
      workflow:
        'I would design a three-layer workflow: device-side helpers for instant private actions, cloud reasoning for expensive synthesis, and a thin orchestration layer that records tool calls, consent, and outputs. Every feature should declare its data boundary before it ships.',
      learned: [
        'The strongest AI apps will split work across local and cloud layers instead of treating one model as the whole product.',
        'A model is not an architecture. State, permissions, tool scopes, retries, and observability decide whether the feature feels reliable.',
        'Browser-side AI is most valuable when it removes repeated friction without asking the user to manage a new interface.',
      ],
      apply:
        'For this portfolio, I would use local-first assistance for search, project summaries, contact prep, and accessibility hints, then reserve cloud reasoning for deeper portfolio analysis. The UI should make the boundary visible: private local help, explicit cloud analysis, and a clear audit trail.',
      bottomLine:
        'The agentic web is not about making every page talk. It is about letting web apps understand context, choose bounded tools, and respond quickly without making privacy or control feel vague.',
    }),
  },
  {
    id: 'grok-x-algorithm-systems-2026',
    title: 'X Algorithm Field Notes: Retrieval, Hydration, Ranking, and Real-Time Feeds',
    kicker: 'Ranking pipelines',
    summary:
      'A system-design breakdown of modern feed ranking: candidate retrieval, context hydration, model scoring, filtering, and the product discipline behind real-time recommendations.',
    readerPromise:
      'You will understand why the feed is a pipeline problem before it is a ranking-model problem.',
    pullQuote:
      'Ranking starts long before scoring. Candidate quality sets the ceiling for everything that follows.',
    highlights: ['Candidate retrieval', 'Context hydration', 'Measurable ranking stages'],
    date: '2026-05-15',
    tags: ['Grok', 'X Algorithm', 'Real-Time AI', 'Ranking'],
    readTime: '7 min read',
    content: makeArticle({
      title: 'X Algorithm Field Notes: Retrieval, Hydration, Ranking, and Real-Time Feeds',
      opening:
        'Modern feeds look magical from the outside because the final surface hides the plumbing. Underneath, a feed is a chain of retrieval, enrichment, ranking, policy, deduplication, and serving decisions.',
      readerPromise:
        'You will understand why the feed is a pipeline problem before it is a ranking-model problem.',
      tldr: 'Real-time recommendations work when many small systems cooperate. In-network retrieval, out-of-network discovery, context hydration, learned ranking, filters, and blending all matter. The model is important, but the pipeline decides what the model is allowed to see.',
      shines: [
        'Retrieval can pull from multiple candidate sources, which creates diversity before the ranker ever scores a post.',
        'Hydration turns raw objects into useful inputs by adding user history, graph signals, metadata, safety context, freshness, and language.',
        'The final feed remains a product decision, so policy filters, duplication controls, quality thresholds, and exploration rules stay first class.',
      ],
      watch: [
        'One score can hide too much complexity and make feed failures hard to debug.',
        'Engagement optimization needs safety, quality, and repetition controls or it drifts toward shallow feedback loops.',
        'A smart ranker cannot recover candidates that retrieval never found.',
      ],
      workflow:
        'I would instrument the feed in stages: retrieval recall, hydration completeness, ranking quality, filter reasons, duplicate rate, latency, and user-visible satisfaction. Debug each stage separately before blaming the model.',
      learned: [
        'Ranking starts before scoring, because candidate quality defines the ceiling of the final result.',
        'Hydrators are underrated because they turn scattered product objects into model-ready context.',
        'A measurable pipeline is easier to improve than a single black-box ranking function.',
      ],
      apply:
        'The same shape works for portfolio search and project discovery. Retrieve from several sources, enrich each result with context, score it, filter it, and explain why it was shown. That turns "smart" search into a debuggable system.',
      bottomLine:
        'The future of feeds and assistants is not only bigger models. It is cleaner retrieval, richer context hydration, and ranking systems where every stage has a measurable job.',
    }),
  },
  {
    id: 'google-ai-ecosystem-2026',
    title: 'Google AI Ecosystem Field Notes: Multimodal Intelligence as a Product Layer',
    kicker: 'Ecosystem AI',
    summary:
      'A practical look at Google’s AI ecosystem strategy across Android, Workspace, Gemini, and device-side context.',
    readerPromise:
      'You will see how AI becomes useful when it appears inside existing surfaces instead of demanding a separate destination.',
    pullQuote:
      'The best ecosystem AI reduces steps. It does not ask users to move work into a new box.',
    highlights: ['Multimodal context', 'Workspace integration', 'Permission-aware UX'],
    date: '2026-01-10',
    tags: ['Google AI', 'Gemini', 'Android', 'Multimodal'],
    readTime: '6 min read',
    content: makeArticle({
      title: 'Google AI Ecosystem Field Notes: Multimodal Intelligence as a Product Layer',
      opening:
        'Google’s advantage is not one model in isolation. It is distribution across Android, Chrome, Search, Photos, Gmail, Docs, Maps, and YouTube. That distribution becomes powerful when AI can help inside the place where the user already has context.',
      readerPromise:
        'You will see how AI becomes useful when it appears inside existing surfaces instead of demanding a separate destination.',
      tldr: 'The ecosystem strategy is straightforward: put intelligence where user context already lives. The hard part is making that context useful without making users feel watched, overloaded, or trapped.',
      shines: [
        'Multimodal input lets camera, voice, files, screen state, and text combine into a more natural workflow.',
        'Workspace integration can turn AI from a novelty into a collaboration layer when it edits, summarizes, and prepares drafts in place.',
        'Android gives Google a path to device-aware features that feel native instead of app-specific.',
      ],
      watch: [
        'Cross-product intelligence needs clear permission boundaries and visible context controls.',
        'Every app adding its own assistant UI can create clutter instead of leverage.',
        'Reliability matters more than surprise; a convenient assistant that edits the wrong object loses trust quickly.',
      ],
      workflow:
        'I would map each AI feature to an existing user moment: read, write, search, compare, share, or automate. Then I would limit context to the smallest set needed and show the user what the system is about to do before it acts.',
      learned: [
        'AI becomes more useful when it is embedded into the workflow rather than bolted onto the side.',
        'Multimodal products need interaction design as much as model quality.',
        'The best ecosystem features save steps while preserving user control.',
      ],
      apply:
        'For my own product work, I would design AI as a contextual layer: small, available, and specific to the screen the user is already using. The interface should show what context was used and what action is next.',
      bottomLine:
        'The winning AI ecosystems will not have the loudest assistant. They will make intelligence appear exactly where the user needs it and disappear when it does not help.',
    }),
  },
  {
    id: 'openclaw-revolution-2026',
    title: 'OpenClaw Field Notes: Open-Source Agents Need More Than Autonomy',
    kicker: 'Open agent systems',
    summary:
      'A sharper look at open-source agent frameworks: why transparency, tools, evaluation, and governance matter more than raw autonomy.',
    readerPromise:
      'You will get a practical checklist for evaluating open-source agents without getting distracted by autonomy hype.',
    pullQuote: 'Autonomy is useful only when the team can inspect, constrain, and verify it.',
    highlights: ['Tool permissions', 'Agent observability', 'Evaluation loops'],
    date: '2026-01-25',
    tags: ['OpenClaw', 'Open Source', 'AI Agents', 'Decentralization'],
    readTime: '6 min read',
    content: makeArticle({
      title: 'OpenClaw Field Notes: Open-Source Agents Need More Than Autonomy',
      opening:
        'Open-source agent frameworks are exciting because they make the loop inspectable. Prompts, tools, state, retries, logs, and failures can become part of the engineering surface instead of a hidden product behavior.',
      readerPromise:
        'You will get a practical checklist for evaluating open-source agents without getting distracted by autonomy hype.',
      tldr: 'The next phase of open-source agents is not just more tools or longer loops. It is better control surfaces: task boundaries, evals, permissioning, observability, and clean human review points.',
      shines: [
        'Open implementations make it easier to audit tool calls and understand failure modes.',
        'Community-built connectors can move faster than closed product roadmaps when permissions are clear.',
        'Local customization lets teams adapt the agent to their repo, stack, and workflow instead of accepting one universal pattern.',
      ],
      watch: [
        'Plugin ecosystems become security risks when permissions are vague.',
        'Agent loops need measurable goals or they burn time without converging.',
        'Open-source projects still need strong defaults so new users do not assemble unsafe workflows.',
      ],
      workflow:
        'I would evaluate an agent framework by asking five questions: what tools can it call, how is permission granted, what logs does it leave, how are failures retried, and what verification command proves the task is done?',
      learned: [
        'A useful agent is a constrained worker, not an unconstrained explorer.',
        'Observability is a feature because developers need traces, diffs, decisions, and test results.',
        'The best open-source advantage is inspectability, not hype.',
      ],
      apply:
        'In a production repo, I would define tool permissions, success criteria, and verification commands first. Then I would add repo-specific skills for bug fixes, UI checks, security review, and deploy readiness.',
      bottomLine:
        'Open-source agents will win when they make automation understandable. The point is not maximum autonomy; it is automation the team can trust.',
    }),
  },
  {
    id: 'wispr-flow-dictation-2026',
    title: 'Wispr Flow Field Notes: Voice Input as a Power Tool',
    kicker: 'Voice productivity',
    summary:
      'A product-focused read on voice dictation: why speed, correction, intent capture, and workflow integration matter.',
    readerPromise:
      'You will learn how voice input becomes a serious workflow tool when it captures intent, not just words.',
    pullQuote:
      'The product is not transcription. The product is turning messy spoken intent into useful work.',
    highlights: ['Intent capture', 'Correction UX', 'Cross-app writing'],
    date: '2026-02-10',
    tags: ['Wispr Flow', 'HCI', 'Voice AI', 'Productivity'],
    readTime: '6 min read',
    content: makeArticle({
      title: 'Wispr Flow Field Notes: Voice Input as a Power Tool',
      opening:
        'Voice input is usually framed as accessibility or convenience. The more interesting version is voice as a power tool: fast capture, low friction, and high-quality cleanup across the places where work already happens.',
      readerPromise:
        'You will learn how voice input becomes a serious workflow tool when it captures intent, not just words.',
      tldr: 'The keyboard is still precise, but voice is better for getting rough intent out quickly. The product challenge is not transcription alone. It is correction, formatting, privacy, and making spoken ideas useful in the destination app.',
      shines: [
        'Voice removes blank-page delay when the user already knows what they want to say.',
        'AI cleanup can turn rough speech into structured messages, docs, tickets, notes, and outlines.',
        'Cross-app availability matters because dictation is only useful if it works where the user is already working.',
      ],
      watch: [
        'Latency has to be low enough that speaking feels continuous.',
        'Privacy expectations are high because spoken content often includes sensitive context.',
        'The system must preserve intent instead of over-polishing everything into generic writing.',
      ],
      workflow:
        'I would use voice in three passes: capture the raw thought, choose the destination format, then review a diff-like cleanup before sending. That keeps speed without giving the model silent control over tone or meaning.',
      learned: [
        'The best voice tools do not merely transcribe. They shape output for the destination.',
        'Correction UX is as important as recognition accuracy.',
        'Voice is strongest for first drafts, status updates, notes, bug reports, and long-form thinking.',
      ],
      apply:
        'For portfolio and productivity tools, I would use voice input for quick capture: project notes, daily logs, blog drafts, reminders, and issue reports. The output should be editable, attributed, and easy to revert.',
      bottomLine:
        'Voice AI becomes serious when it respects user intent, speeds up capture, and produces text that fits the workflow without making the user babysit every sentence.',
    }),
  },
  {
    id: 'nvidia-ai-dominance-2026',
    title: 'NVIDIA Field Notes: Why AI Infrastructure Became the Product',
    kicker: 'AI infrastructure',
    summary:
      'A practical breakdown of NVIDIA’s AI advantage across GPUs, CUDA, networking, software, and developer lock-in.',
    readerPromise: 'You will see why NVIDIA’s moat is the full execution path, not only the chip.',
    pullQuote:
      'In AI, the product is increasingly the infrastructure path from idea to deployed workload.',
    highlights: ['CUDA ecosystem', 'Cluster-scale training', 'Developer gravity'],
    date: '2026-02-24',
    tags: ['NVIDIA', 'AI', 'Hardware', 'GPU'],
    readTime: '7 min read',
    content: makeArticle({
      title: 'NVIDIA Field Notes: Why AI Infrastructure Became the Product',
      opening:
        'NVIDIA is often described as a GPU company, but that is too small a frame. The real advantage is an infrastructure stack: chips, networking, CUDA, libraries, deployment tooling, developer habits, and a supply chain built around AI workloads.',
      readerPromise:
        'You will see why NVIDIA’s moat is the full execution path, not only the chip.',
      tldr: 'NVIDIA’s moat is not only faster silicon. It is the fact that the fastest path from research idea to production training job usually runs through NVIDIA’s software and hardware ecosystem.',
      shines: [
        'CUDA created a long-running developer advantage that compounds with every library, tutorial, and production workflow.',
        'Networking and systems design matter because frontier AI training is a cluster problem, not a single-chip problem.',
        'The platform gives teams a predictable path for training, inference, optimization, and deployment.',
      ],
      watch: [
        'Demand concentration can create cost pressure for startups and research labs.',
        'Alternative accelerators can win specific workloads if they offer better economics, availability, or energy profiles.',
        'Infrastructure dependency becomes a strategic risk when one stack controls too much of the path.',
      ],
      workflow:
        'I would plan AI infrastructure from product requirements backward: latency target, throughput, model size, memory needs, batch behavior, observability, fallback path, and cost envelope. Hardware choice should follow that map, not precede it.',
      learned: [
        'In AI, hardware and software are inseparable.',
        'Developer experience can be as strong a moat as raw performance.',
        'The bottleneck keeps moving across compute, memory, networking, power, cooling, scheduling, and deployment.',
      ],
      apply:
        'When designing AI systems, I would treat infrastructure as part of the product roadmap. Model choice, latency, batch size, logging, and cost controls should be decided together instead of patched in after the feature is built.',
      bottomLine:
        'NVIDIA dominates because it sells the full path to AI execution. The lesson for builders is clear: platforms win when they remove friction from the entire workflow, not just one layer.',
    }),
  },
  {
    id: 'ai-models-global-race-2026',
    title: 'Global AI Race Field Notes: Models, Nations, and the Infrastructure Layer',
    kicker: 'AI strategy',
    summary:
      'A grounded overview of the AI race across model quality, compute supply, regulation, talent, and product distribution.',
    readerPromise:
      'You will get a sharper lens for comparing AI ecosystems without reducing everything to model leaderboards.',
    pullQuote:
      'The AI race is not one race. It is research, infrastructure, product, and policy moving at different speeds.',
    highlights: ['Compute access', 'Open models', 'Governed deployment'],
    date: '2026-03-11',
    tags: ['AI', 'LLM', 'Geopolitics', 'Technology'],
    readTime: '8 min read',
    content: makeArticle({
      title: 'Global AI Race Field Notes: Models, Nations, and the Infrastructure Layer',
      opening:
        'The global AI race is usually told as a leaderboard story. That misses the bigger picture. Model quality matters, but durable advantage also depends on compute access, energy, chip supply, data policy, research talent, deployment channels, and trust.',
      readerPromise:
        'You will get a sharper lens for comparing AI ecosystems without reducing everything to model leaderboards.',
      tldr: 'The strongest AI ecosystems combine frontier research, infrastructure, distribution, and governance. A country or company can have one of those and still fall behind if the others are weak.',
      shines: [
        'Open models make advanced AI more available to smaller teams, local markets, and public-sector builders.',
        'Competition pushes faster progress in reasoning, multimodal interfaces, coding, and agent tooling.',
        'Regional AI strategies can produce systems better aligned with local languages, laws, and public needs.',
      ],
      watch: [
        'Compute access is becoming a strategic constraint, especially where power and chips are limited.',
        'Regulation can build trust or slow adoption depending on how clearly it maps to real risk.',
        'Benchmark chasing can hide weak product reliability and poor deployment discipline.',
      ],
      workflow:
        'I would compare AI ecosystems using four lenses: research quality, compute supply, deployment channels, and governance. If one lens is missing, the strategy is incomplete even when the model demo looks strong.',
      learned: [
        'The AI race is not one race. It is research, infrastructure, product, and policy moving at different speeds.',
        'Open-weight models change bargaining power by reducing dependency on a few closed APIs.',
        'The best model is not always the best system because latency, privacy, price, and integration decide adoption.',
      ],
      apply:
        'For product engineering, I would stay model-flexible. Build adapters, logging, evaluation sets, and fallback paths so the product can move between providers without rewriting the stack.',
      bottomLine:
        'The global AI race will be won by ecosystems that turn model progress into reliable, affordable, governed products. Raw capability is only the first layer.',
    }),
  },
  {
    id: 'ai-code-editors-revolution-2026',
    title: 'AI Code Editors Field Notes: VS Code, Cursor, Windsurf, and Antigravity',
    kicker: 'Agentic coding',
    summary:
      'A practical comparison of AI coding environments through the lens of daily engineering work, loops, context, review, and verification.',
    readerPromise:
      'You will get a daily-driver workflow for using AI coding tools without losing engineering discipline.',
    pullQuote:
      'The best AI coding tool is the one that keeps context clean, checks real work, and makes review easier.',
    highlights: ['Goal loops', 'Context hygiene', 'Verifier-reviewer workflow'],
    date: '2026-03-25',
    tags: ['AI', 'Developer Tools', 'IDE', 'Productivity'],
    readTime: '8 min read',
    content: makeArticle({
      title: 'AI Code Editors Field Notes: VS Code, Cursor, Windsurf, and Antigravity',
      opening:
        'AI code editors are no longer just autocomplete surfaces. They are becoming engineering workbenches: context gathering, implementation, verification, review, and iteration inside one loop.',
      readerPromise:
        'You will get a daily-driver workflow for using AI coding tools without losing engineering discipline.',
      tldr: 'The best AI coding tool is not the one that writes the most code. It is the one that keeps context clean, runs the right checks, exposes the diff clearly, and helps the engineer stay in control.',
      shines: [
        'Agentic workflows can handle multi-file changes when the tool understands the repo and canonical test commands.',
        'Background verification is a major unlock because implementation and feedback can happen in the same workspace.',
        'Editor-native context makes the assistant more useful than a detached chat window.',
      ],
      watch: [
        'A fast agent can still create cleanup debt if it edits outside the requested scope.',
        'Long sessions need context hygiene or the assistant starts optimizing against stale assumptions.',
        'Tools should make review easier, not hide changes behind a polished final answer.',
      ],
      workflow:
        'My default loop is: read the repo, define the goal, make the smallest useful edit, run canonical checks, inspect the diff, then commit only the intended scope. For bigger UI work, add a verifier pass for browser screenshots and a reviewer pass for code quality before human review.',
      learned: [
        'Define the goal before coding because agents perform better when success is measurable.',
        'Use verifier loops for UI, tests, and builds before asking for human review.',
        'Treat generated code like high-throughput junior code: useful, fast, and still reviewed.',
      ],
      apply:
        'For this project, the strongest workflow is already visible: keep changes scoped, run lint and rendered checks, verify browser behavior, clean generated artifacts, and only then commit. AI is useful when it reinforces that discipline.',
      bottomLine:
        'AI code editors are becoming serious engineering tools, but the winning workflow is still disciplined software engineering: scope, context, tests, review, and clean commits.',
      note: 'This post adapts a field-note structure because AI coding tools change quickly. The durable lesson is the workflow, not a fixed product ranking.',
    }),
  },
  {
    id: 'apple-50th-anniversary-2026',
    title: 'Apple at 50 Field Notes: The Product Discipline Behind the Myth',
    kicker: 'Product taste',
    summary:
      'A design and engineering reflection on Apple’s first 50 years: integration, taste, restraint, ecosystem leverage, and the risks of polish becoming inertia.',
    readerPromise:
      'You will understand Apple as an operating discipline: integration, restraint, defaults, and ecosystem leverage.',
    pullQuote:
      'Apple’s lesson is not minimalism for its own sake. It is complexity resolved before it reaches the user.',
    highlights: ['Vertical integration', 'Calm interface design', 'Ecosystem continuity'],
    date: '2026-04-01',
    tags: ['Apple', 'Technology', 'Innovation', 'History'],
    readTime: '9 min read',
    content: makeArticle({
      title: 'Apple at 50 Field Notes: The Product Discipline Behind the Myth',
      opening:
        'Apple’s story is often told through products: Mac, iPod, iPhone, iPad, Watch, Vision, and services. The deeper lesson is product discipline. Apple repeatedly wins when hardware, software, interaction design, retail, and ecosystem strategy are treated as one system.',
      readerPromise:
        'You will understand Apple as an operating discipline: integration, restraint, defaults, and ecosystem leverage.',
      tldr: 'Apple’s advantage is not only taste. It is integration under constraint. The company says no to many options so the user sees fewer seams, fewer decisions, and a more coherent experience.',
      shines: [
        'Vertical integration lets Apple tune performance, battery life, security, and interaction details together.',
        'Design restraint creates products that feel calm even when the underlying technology is complex.',
        'Ecosystem continuity makes devices more valuable together than separately.',
      ],
      watch: [
        'A polished ecosystem can become limiting when interoperability is treated as a threat.',
        'Premium design expectations raise the cost of every new product category.',
        'When Apple waits too long, restraint can look like hesitation.',
      ],
      workflow:
        'I would apply the Apple lens by removing visible decisions from the interface. Start with the user goal, remove nonessential choices, make defaults excellent, and use motion only when it clarifies state.',
      learned: [
        'The best interface is often the one that removes a decision.',
        'Product quality compounds through defaults, transitions, typography, materials, and support.',
        'Ecosystem design works when it saves time, not when it traps the user.',
      ],
      apply:
        'For my portfolio and product interfaces, the lesson is to reduce visible complexity. Use solid surfaces, clear hierarchy, restrained motion, predictable navigation, and make every card answer a real user question.',
      bottomLine:
        'Apple’s first 50 years show that technology becomes memorable when engineering and taste point in the same direction. The hard part is keeping that discipline while the platform keeps expanding.',
    }),
  },
  {
    id: 'anthropic-mythos-2026',
    title: 'Anthropic Mythos Field Notes: Philosophy, Simulation, and AI Safety',
    kicker: 'AI philosophy',
    summary:
      'A clearer version of a philosophical AI essay: what anthropic reasoning is useful for, where it becomes speculative, and why safety engineering still needs practical controls.',
    readerPromise:
      'You will get a grounded way to read anthropic arguments without confusing speculation for safety work.',
    pullQuote: 'A good philosophical frame should change how we build, test, or govern systems.',
    highlights: ['Observer bias', 'Safety humility', 'Operational controls'],
    date: '2026-04-20',
    tags: ['Philosophy', 'Anthropics', 'AI Ethics', 'Consciousness'],
    readTime: '8 min read',
    content: makeArticle({
      title: 'Anthropic Mythos Field Notes: Philosophy, Simulation, and AI Safety',
      opening:
        'Anthropic reasoning asks a strange but useful question: what should we infer from the fact that we are observers inside this world? It touches cosmology, simulation arguments, consciousness, and AI safety. The topic gets abstract quickly, so the practical move is to separate useful frames from speculative claims.',
      readerPromise:
        'You will get a grounded way to read anthropic arguments without confusing speculation for safety work.',
      tldr: 'Anthropic philosophy is valuable when it improves humility about assumptions. It becomes dangerous when speculation replaces engineering controls, evidence, and measurable safety work.',
      shines: [
        'Anthropic reasoning forces us to notice observer bias and hidden assumptions.',
        'Simulation arguments can be useful thought experiments for evidence, agency, and model uncertainty.',
        'AI safety benefits from philosophical humility because intelligence, consciousness, and agency remain poorly bounded concepts.',
      ],
      watch: [
        'Speculative arguments can sound profound while producing no operational guidance.',
        'Philosophy should not become an excuse to avoid concrete safety evaluations.',
        'Claims about consciousness or simulation need careful language because confidence can outrun evidence.',
      ],
      workflow:
        'I would translate any philosophical claim into an engineering question: what should we measure, what failure should we prevent, what control should exist, and what uncertainty should remain visible to users?',
      learned: [
        'A good philosophical frame should change how we build, test, or govern systems.',
        'Uncertainty is not weakness. It is a requirement for responsible AI work.',
        'The bridge from philosophy to engineering is measurement: evals, red teaming, monitoring, and incident response.',
      ],
      apply:
        'In AI product work, I would use anthropic humility as a design posture. Assume the model can surprise you, assume users will find edge cases, and build review, logging, permission boundaries, and rollback paths accordingly.',
      bottomLine:
        'The useful part of anthropic thinking is not the most dramatic theory. It is the reminder that our viewpoint is limited, and powerful AI systems should be built with that limitation in mind.',
    }),
  },
  {
    id: 'wwdc-2026-apple-intelligence-siri-ai',
    title: 'WWDC 2026 Field Notes: Apple Intelligence, Siri, and Private AI',
    kicker: 'Private AI',
    summary:
      'A product-engineering read on Apple Intelligence: on-device reasoning, privacy boundaries, Siri workflows, app intents, and what developers should actually build.',
    readerPromise:
      'You will see what developers should expose to Apple Intelligence: structured actions, clear permissions, and calm automation.',
    pullQuote:
      'The best Apple Intelligence feature may look like a normal button, shortcut, or suggestion.',
    highlights: ['App Intents', 'Private Cloud Compute', 'Calm automation'],
    date: '2026-06-12',
    tags: ['WWDC 2026', 'Apple Intelligence', 'Siri AI', 'Core AI', 'Private Cloud Compute'],
    readTime: '7 min read',
    content: makeArticle({
      title: 'WWDC 2026 Field Notes: Apple Intelligence, Siri, and Private AI',
      opening:
        'Apple’s AI direction is easiest to understand through product constraints. The company is not trying to make every interaction look like chat. It is trying to make intelligence feel native to the device, private by default, and useful inside existing app workflows.',
      readerPromise:
        'You will see what developers should expose to Apple Intelligence: structured actions, clear permissions, and calm automation.',
      tldr: 'The Apple Intelligence opportunity for developers is not another assistant panel. It is app intent design, privacy-aware context, system-level actions, and small automations that feel like part of the operating system.',
      shines: [
        'On-device execution is strong for private, low-latency tasks.',
        'Private cloud patterns can extend capability without exposing every interaction as a generic server request.',
        'App Intents make AI more useful because the system can take structured actions, not just generate text.',
      ],
      watch: [
        'Siri improvements need reliability more than novelty.',
        'Developers must design clear actions and permissions or the system cannot safely automate them.',
        'Privacy messaging has to be matched by observable technical boundaries.',
      ],
      workflow:
        'I would start with five high-confidence intents: search projects, summarize recent work, create a reminder, open a case study, and prepare a contact draft. Each action should have predictable input, reversible output, and a confirmation point when it changes user data.',
      learned: [
        'The best AI feature on Apple platforms may look like a normal button, shortcut, or suggestion.',
        'Structured app actions are easier to trust than open-ended automation.',
        'A premium AI experience should feel calm, reversible, and explainable.',
      ],
      apply:
        'For an iOS or portfolio companion, I would expose small, high-quality App Intents instead of one broad assistant. The system should know exactly what it can do and when it must ask first.',
      bottomLine:
        'Apple’s AI strategy is about making intelligence part of the system contract. Developers who expose high-quality actions will get more value than those who simply add a chat box.',
    }),
  },
  {
    id: 'notebooklm-2026-ai-research-agent',
    title: 'NotebookLM 2026 Field Notes: From Document Q&A to Research Workflow',
    kicker: 'Research agents',
    summary:
      'A practical look at NotebookLM as a research agent: source grounding, synthesis, study tools, collaboration, and what still needs careful verification.',
    readerPromise:
      'You will get a practical model for turning source-grounded AI into a research workflow, not just a Q&A toy.',
    pullQuote: 'The winning research tool keeps the evidence close to the answer.',
    highlights: ['Source grounding', 'Research synthesis', 'Citation discipline'],
    date: '2026-06-10',
    tags: ['NotebookLM', 'Gemini', 'AI Research', 'Antigravity', 'Google AI'],
    readTime: '7 min read',
    content: makeArticle({
      title: 'NotebookLM 2026 Field Notes: From Document Q&A to Research Workflow',
      opening:
        'NotebookLM is most interesting when you stop treating it as document chat. The larger opportunity is a research workflow: gather sources, ask questions, compare evidence, create study artifacts, and turn messy material into something usable.',
      readerPromise:
        'You will get a practical model for turning source-grounded AI into a research workflow, not just a Q&A toy.',
      tldr: 'The product works best when source grounding remains visible. The moment it becomes generic answer generation, it loses the main advantage: helping users reason over a known corpus.',
      shines: [
        'Source-grounded answers are valuable for students, researchers, analysts, and builders working with dense material.',
        'Audio, study, and summary formats make the same source material useful in different modes.',
        'Collaboration features can turn a notebook into a shared research space instead of a private scratchpad.',
      ],
      watch: [
        'Generated summaries still need citation discipline and human review.',
        'Large source collections can create false confidence if the corpus is incomplete or biased.',
        'Research tools should make uncertainty visible instead of smoothing every answer into certainty.',
      ],
      workflow:
        'I would run research in five steps: collect sources, extract claims, compare evidence, draft synthesis, and mark uncertainty. The AI should help move between those steps while preserving citations and source context.',
      learned: [
        'The value of a research agent is not only answers. It is navigation through the source set.',
        'Good outputs preserve provenance: what source, what claim, what evidence, what uncertainty.',
        'The best study tools help users recall, compare, and challenge ideas instead of passively consuming summaries.',
      ],
      apply:
        'For portfolio research, I would collect docs, pull out claims, draft summaries, create comparison notes, and keep a clear source trail before publishing anything public.',
      bottomLine:
        'NotebookLM points toward AI research tools that are grounded, collaborative, and multi-format. The winning version is not the one that answers fastest. It is the one that keeps the evidence close to the answer.',
    }),
  },
];

export default blogPosts;
