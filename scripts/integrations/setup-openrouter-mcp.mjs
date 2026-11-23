#!/usr/bin/env node
// Global credential export and configuration deletion are intentionally unsupported.
console.log('Manual setup only: review scripts/integrations/cursor-openrouter-mcp.example.json.');
console.log(
  'WARNING: an MCP server can use every credential supplied to it. Use a dedicated restricted credential.'
);
console.log(
  'No credentials read, configuration written, package installed, or launchctl setting changed.'
);
if (process.argv.includes('--with-chat')) {
  console.error(
    'The unpinned third-party chat installer is disabled. Review and pin a server before adding it.'
  );
  process.exitCode = 1;
}
