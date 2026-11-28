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
];
