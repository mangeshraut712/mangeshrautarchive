/**
 * WhoBurnedMore Public Leaderboard & Token Burn Telemetry
 * Source of truth: https://whoburnedmore.com/u/mrcommando712
 * Last updated: 2026-09-07
 */

export const whoburnedmoreProfile = {
  username: 'mrcommando712',
  displayName: 'Mangesh Raut',
  profileUrl: 'https://whoburnedmore.com/u/mrcommando712',
  badgeUrl: 'https://api.whoburnedmore.com/v1/badge/mrcommando712.svg',
  lastSynced: 'September 2026',

  // Lifetime headline totals
  lifetimeBurn: '13.66B',
  lifetimeBurnRaw: 13_655_470_383,
  estimatedCost: '$13,625',
  estimatedCostRaw: 13_624.91,
  activeDays: 198,
  currentStreak: '10d',
  longestStreak: '16d',
  dailyAvgBurn: '69.0M',
  dailyAvgSpend: '$68.81',
  totalMessages: '88.6K',
  userMessages: '24.6K',
  subagentShare: '0%',

  // Leaderboard standings
  rankings: {
    allTime: 53,
    weekly: 25,
    daily: 38,
    totalDevs: 301,
    percentile: 'Top 18%',
  },

  // Benchmarks vs average developer on leaderboard
  benchmarks: {
    burnRatio: '1.5×',
    burnAvg: '9.02B',
    spendRatio: '1.9×',
    spendAvg: '$7,043',
    percentile: 'Top 18%',
    rankText: '#53 of 301 devs',
  },

  // Prompt cache economics
  cache: {
    hitRate: '94.62%',
    dollarsSaved: '$27,510',
    cacheReads: '12.85B',
    inputTokens: '730.6M',
    outputTokens: '49.3M',
  },

  // Telemetry breakdown by tool / IDE (8 tracked on WhoBurnedMore + 1 active orchestrator = 9 items)
  tools: [
    {
      name: 'Codex',
      tokens: '9.18B',
      tokensRaw: 9_177_262_518,
      share: '67.2%',
      spend: '$11,045',
      context: 'Primary codebase generation, unit test scaffolding, and multi-file code synthesis',
    },
    {
      name: 'Cursor',
      tokens: '3.74B',
      tokensRaw: 3_740_299_606,
      share: '27.4%',
      spend: '$2,527',
      context: 'Primary AI-native IDE environment & full-repo context orchestration',
    },
    {
      name: 'Kilo',
      tokens: '611.0M',
      tokensRaw: 610_967_596,
      share: '4.5%',
      spend: '$0',
      context: 'Pair programming, multi-model evaluation, and interactive chat interface',
    },
    {
      name: 'Cline',
      tokens: '61.4M',
      tokensRaw: 61_393_505,
      share: '0.4%',
      spend: '$7.47',
      context: 'Agentic file editing, browser automation, and precision refactoring',
    },
    {
      name: 'Droid',
      tokens: '38.2M',
      tokensRaw: 38_207_288,
      share: '0.3%',
      spend: '$40.62',
      context: 'Mobile and edge automation workflows and task execution',
    },
    {
      name: 'OpenClaw',
      tokens: '26.4M',
      tokensRaw: 26_439_815,
      share: '0.2%',
      spend: '$4.54',
      context: 'CLI command automation and terminal agent scripts',
    },
    {
      name: 'OpenCode',
      tokens: '883K',
      tokensRaw: 882_944,
      share: '<0.1%',
      spend: '$0',
      context: 'Open-weights script automation and local pair programming',
    },
    {
      name: 'Hermes',
      tokens: '17.1K',
      tokensRaw: 17_111,
      share: '<0.1%',
      spend: '$0',
      context: 'Tool-assisted exploratory chat and quick prompt evaluation',
    },
    {
      name: 'Antigravity',
      tokens: null,
      tokensRaw: 0,
      share: 'Active',
      spend: 'Live',
      context: 'Autonomous multi-agent pair programming & architectural refactoring',
    },
  ],

  // Top AI models burned across all workflows
  models: [
    {
      name: 'GPT-5.4',
      tokens: '3.75B',
      tokensRaw: 3_753_121_430,
      share: '27.5%',
      spend: '$5,618',
      context: 'Primary heavy reasoning, architectural refactors, and systems contracts',
    },
    {
      name: 'GPT-5.5',
      tokens: '1.28B',
      tokensRaw: 1_284_191_523,
      share: '9.4%',
      spend: '$2,428',
      context: 'Next-gen multimodal code synthesis and advanced reasoning pipelines',
    },
    {
      name: 'GPT-5.3 Codex',
      tokens: '1.16B',
      tokensRaw: 1_155_276_068,
      share: '8.5%',
      spend: '$654',
      context: 'Fast generative pair programming and iterative codebase patches',
    },
    {
      name: 'GPT-5 Codex',
      tokens: '1.05B',
      tokensRaw: 1_047_342_157,
      share: '7.7%',
      spend: '$200',
      context: 'Codebase scaffolding, test suite generation, and API contract mocks',
    },
    {
      name: 'GPT-5.6 Sol',
      tokens: '979.2M',
      tokensRaw: 979_163_518,
      share: '7.2%',
      spend: '$1,650',
      context: 'High-speed agentic execution loops and rapid terminal automation',
    },
    {
      name: 'Grok Code Fast & Bot',
      tokens: '1.33B',
      tokensRaw: 1_327_934_470,
      share: '9.7%',
      spend: '$389',
      context: 'Real-time inference, assistMe chat, and high-velocity terminal scripting',
    },
    {
      name: 'Cursor Grok 4.5 / 4.6',
      tokens: '988.0M',
      tokensRaw: 988_037_711,
      share: '7.2%',
      spend: '$988',
      context: 'Context-aware editor completions, in-IDE refactors, and inline edits',
    },
    {
      name: 'Claude Opus 4.8 / Opus 5',
      tokens: '260.0M',
      tokensRaw: 260_033_827,
      share: '1.9%',
      spend: '$192',
      context: 'Deep conceptual blueprints, longform tech field notes, and security audits',
    },
    {
      name: 'Gemini 2.5 Flash / DeepSeek',
      tokens: '141.2M',
      tokensRaw: 141_219_215,
      share: '1.0%',
      spend: '$28',
      context: 'Multi-viewport visual auditing, layout debugging, and open-weights tests',
    },
  ],
};
