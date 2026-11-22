export const hackathonProjects = {
  fieldfix: {
    event: 'Meta Global AI Developer Hackathon 2026',
    evidence: 'https://github.com/mangeshraut712/fieldfix#readme',
  },
  'threadpulse-daily': {
    event: 'Reddit Daily Games Hackathon 2026',
    evidence: 'https://github.com/mangeshraut712/ThreadPulse-Daily#readme',
  },
  hindai: {
    event: 'Gemma developer-agent build',
    evidence: 'https://github.com/mangeshraut712/Hindai#readme',
  },
  gravekeeper: {
    event: 'Kiroween 2026',
    evidence: 'https://github.com/mangeshraut712/gravekeeper#readme',
  },
  'repair-proof': {
    event: 'Meta Model API prototype · not submitted',
    evidence: 'https://github.com/mangeshraut712/repair-proof#readme',
  },
  'actions-nurse': {
    event: 'Open Agent Hackathon · submitted build',
    evidence: 'https://github.com/mangeshraut712/actions-nurse#readme',
  },
  'uidai-data-hackathon-2026': {
    event: 'UIDAI Data Hackathon 2026',
    evidence: 'https://github.com/mangeshraut712/UIDAI-Data-Hackathon-2026#readme',
  },
  'asset-intelligence-copilot': {
    event: 'FlytBase AHC × Hacktoberfest 2026',
    evidence: 'https://github.com/mangeshraut712/asset-intelligence-copilot#readme',
  },
};

export const contributionStories = [
  {
    url: 'https://github.com/apple/pkl-intellij/pull/294',
    label: 'Developer experience',
    title: 'A failed launch should not leave a task running.',
    description:
      'Prevented a background download task from hanging when the Pkl CLI fails to start.',
  },
  {
    url: 'https://github.com/adobe/react-spectrum/pull/10868',
    label: 'Everyday interaction',
    title: 'Small interactions. Real consequences.',
    description: 'Restored select-all for ComboBox input text while its multi-select menu is open.',
  },
  {
    url: 'https://github.com/awslabs/social-messaging-agent-runtime-toolkit/pull/207',
    label: 'Reliable systems',
    title: 'When a limit cannot be checked, stop safely.',
    description:
      'Made schedule creation fail closed when the runtime cannot count existing schedules.',
  },
];

export const publicSecurityWork = [
  'https://github.com/microsoft/physical-ai-toolchain/pull/2071',
  'https://github.com/microsoft/semantic-kernel/pull/14668',
  'https://github.com/awslabs/social-messaging-agent-runtime-toolkit/pull/207',
];

export function getWorkStream(repo) {
  const name = String(repo.name || '').toLowerCase();
  if (
    repo.fork ||
    repo.archived ||
    ['.github', 'mangeshraut712', 'mangeshraut712.github.io', 'rs-10871-demo'].includes(name)
  )
    return null;
  return hackathonProjects[name] || repo.topics?.includes('hackathon') ? 'hackathons' : 'projects';
}
