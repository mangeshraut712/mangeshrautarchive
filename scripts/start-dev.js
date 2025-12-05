// Auto-start development environment
// Run with: node scripts/start-dev.js

import { exec } from 'child_process';

console.log('🚀 Starting development environment...\n');

// Start the HTTP server
exec('node scripts/local-server.js', (error, stdout, _stderr) => {
  if (error) {
    console.error(`Server error: ${error}`);
    return;
  }
  console.log('Server output:', stdout);
});

// Wait 2 seconds for server to start, then open browser
setTimeout(() => {
  console.log('🌐 Opening browser...\n');

  // Try to open browser (works on macOS, may need adjustment for other OS)
  exec('open http://localhost:3000 || xdg-open http://localhost:3000 || start http://localhost:3000 || echo "Please open http://localhost:3000 in your browser"', (error, _stdout, _stderr) => {
    if (error) {
      console.log('📋 Please manually open: http://localhost:3000');
    }
  });

  console.log('✅ Development environment ready!');
  console.log('💡 Use Ctrl+C to stop the server');
}, 2000);
