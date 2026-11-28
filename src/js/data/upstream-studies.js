export const upstreamStudies = [
  {
    slug: 'carbon-datepicker',
    title: 'IBM Carbon: the calendar that wouldn’t reopen',
    tagline:
      'The calendar disappeared on Enter, but the next click revealed what its state still said.',
    prUrl: 'https://github.com/carbon-design-system/carbon/pull/24019',
    sections: [
      [
        'What broke',
        'In a single date picker, I could type a date and press Enter to dismiss the calendar. Clicking the input again did nothing until focus moved away. The handler had removed the open CSS class while flatpickr still considered the calendar open. Escape had the same mismatch.',
      ],
      [
        'How I tested it',
        'I wrote a React interaction test that clicked the input, typed a date, pressed Enter, and clicked again. The final assertion failed on main: the calendar should have reopened. During review I added Escape coverage for the single and range pickers. The focused Jest run passed all 102 tests across three DatePicker suites. These were jsdom interaction tests.',
      ],
      [
        'What the maintainer merged',
        'On November 25, 2026, kennylam merged the change to call flatpickr’s close() when an open calendar is dismissed. That keeps the visible calendar and its internal state in sync. A regression test also checks that pressing Escape on an already closed picker does not fire onClose.',
      ],
    ],
  },
  {
    slug: 'aws-audit-clock',
    title: 'AWS Labs: the test that aged while it waited',
    tagline: 'An audit slot could appear expired before the test that created it had even started.',
    prUrl: 'https://github.com/awslabs/visual-asset-management-system/pull/1822',
    sections: [
      [
        'What broke',
        'In the Visual Asset Management System audit tests, a module-level timestamp was captured when pytest collected the file. If earlier tests took about 1,000 seconds, a slot intended to be valid could already look expired when the service checked the clock. Running the test by itself could hide the problem.',
      ],
      [
        'How I tested it',
        'I ran the 11 TestAtomicCaps cases on their own, then ran the audit handler file from the backend directory with pytest and parallel execution disabled. All 119 tests in the file passed. I repeated the file-level run after reconciling the patch with the development branch.',
      ],
      [
        'What the maintainer merged',
        'On November 24, 2026, scheurik merged a now() helper that reads the clock when each test constructs its timestamps and deadlines. The change was confined to the test setup and release notes. Production expiry handling stayed as it was.',
      ],
    ],
  },
  {
    slug: 'adk-go-history',
    title: 'Google ADK-Go: carrying code history between models',
    tagline: 'A conversation that worked in Gemini stopped at the next OpenAI request.',
    prUrl: 'https://github.com/google/adk-go/pull/1956',
    sections: [
      [
        'What broke',
        'A Gemini turn can contain executable code and its output as distinct parts. When I replayed that history through ADK-Go’s OpenAI adapter, both request builders rejected those parts before sending the request.',
      ],
      [
        'How I tested it',
        'I checked the serialized payload for Chat Completions and Responses. The tests assert that code and output appear in order beside ordinary text and images, including when the code is empty or the history contains reasoning. This verifies the conversion locally.',
      ],
      [
        'What the maintainer merged',
        'On November 6, 2026, wolo-lab merged support for representing those two parts as fenced text in both adapters. The next model receives the earlier code and result as conversation context.',
      ],
    ],
  },
  {
    slug: 'semantic-kernel-url-policy',
    title: 'Microsoft Semantic Kernel: checking the destination before sending',
    tagline: 'An allowlist check and its HTTP client disagreed about where a request would go.',
    prUrl: 'https://github.com/microsoft/semantic-kernel/pull/14668',
    sections: [
      [
        'What broke',
        'Semantic Kernel checked whether a URL started with an allowed base path. The HTTP client normalized the path before sending it, so the validator could approve a destination outside the configured boundary.',
      ],
      [
        'How I tested it',
        'I compared validator decisions with paths produced by httpx and covered both allowed destinations and paths that should be rejected. Runner tests also check that a rejection happens before authentication or network dispatch.',
      ],
      [
        'What the maintainer merged',
        'On November 2, 2026, eavanvalkenburg merged the validator change. It checks the normalized path boundary before the OpenAPI runner proceeds and preserves valid paths, including meaningful empty segments.',
      ],
    ],
  },
  {
    slug: 'postgres-mcp-event-loop',
    title: 'AWS Labs: keeping a PostgreSQL pool on the serving loop',
    tagline: 'Startup validation succeeded, but the first query could still fail.',
    prUrl: 'https://github.com/awslabs/mcp/pull/4846',
    sections: [
      [
        'What broke',
        'The PostgreSQL MCP server initialized its wire-protocol pool and lock during a temporary event loop. Startup then closed that loop. The first tool call ran on a different loop and could fail while trying to reuse the pool.',
      ],
      [
        'How I tested it',
        'I exercised startup, lifespan validation and the first query with a fake wire pool. Separate tests covered shutdown when closing a connection failed or stalled. The PR records 2,501 passing tests in the server package.',
      ],
      [
        'What the maintainer merged',
        'On November 9, 2026, kennthhz merged the change that moves wire-protocol validation into the server lifespan. Pool creation, queries and cleanup now share the serving loop.',
      ],
    ],
  },
  {
    slug: 'alchemy-go-log-headers',
    title: 'IBM Alchemy Logging: aligning goroutine IDs',
    tagline: 'One extra digit in a goroutine ID shifted the start of the log message.',
    prUrl: 'https://github.com/IBM/alchemy-logging/pull/807',
    sections: [
      [
        'What broke',
        'With goroutine IDs enabled, the pretty-print formatter wrote each ID at its natural width. As different goroutines logged messages, the message column moved back and forth, making interleaved output harder to scan.',
      ],
      [
        'How I tested it',
        'Real goroutine IDs cannot be chosen on demand, so I exercised the padding helper with IDs of different widths. I also checked a real emitted header and verified that resetting the logger clears the remembered width.',
      ],
      [
        'What the maintainer merged',
        'On November 11, 2026, gabe-l-hart merged right-padding to the widest ID observed so far. The formatter updates that width atomically while holding its existing read lock. JSON output keeps the numeric thread ID.',
      ],
    ],
  },
  {
    slug: 'agentscript-topic-handoff',
    title: 'Salesforce AgentScript: restoring a missing topic handoff',
    tagline:
      'A valid transition compiled without an error, yet the agent stayed on the same topic.',
    prUrl: 'https://github.com/salesforce/agentscript/pull/106',
    sections: [
      [
        'What broke',
        'After a reasoning action, a transition written directly after its input and state statements could disappear from the compiled output. The compiler already handled a transition inside a conditional. It skipped the standalone form.',
      ],
      [
        'How I tested it',
        'I compiled an action that explicitly transitions to the dashboard topic. The regression checked both the unconditional next-topic update and the handoff to dashboard. It failed on main and passed with the change.',
      ],
      [
        'What the maintainer merged',
        'On November 14, 2026, setu4993 merged the compiler branch that reuses the existing transition logic. It emits the state update after the tool call and schedules the handoff after all tool calls finish.',
      ],
    ],
  },
];
