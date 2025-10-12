/**
 * API Status Indicator - Shows real-time AI availability
 */

let currentStatus = 'checking';

function updateStatusIndicator(status, message) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (!dot || !text) return;
    
    // Update dot color
    dot.className = 'api-status-dot ' + status;
    
    // Update message
    const messages = {
        online: '🟢 AI Online',
        offline: '🔴 AI Offline',
        'rate-limited': '🟠 Rate Limited',
        checking: '⚪ Checking...'
    };
    
    text.textContent = message || messages[status] || messages.checking;
    currentStatus = status;
}

// Listen for responses to detect API status
function monitorAPIStatus() {
    // Intercept fetch to monitor API responses
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        
        // Clone response to read it
        const cloned = response.clone();
        
        // Check if it's our API
        if (args[0] && args[0].includes('/api/chat')) {
            try {
                const data = await cloned.json();
                
                if (data.rateLimit === true || data.source === 'offline-knowledge') {
                    updateStatusIndicator('rate-limited', '🟠 Rate Limited');
                } else if (data.source && data.source.includes('openrouter')) {
                    updateStatusIndicator('online', `🟢 AI: ${data.winner || 'Active'}`);
                } else if (data.source && data.source.includes('gemini')) {
                    updateStatusIndicator('online', '🟢 AI: Gemini');
                } else {
                    updateStatusIndicator('offline', '🔴 AI Offline');
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }
        
        return response;
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    monitorAPIStatus();
    
    // Initial check
    setTimeout(() => {
        if (currentStatus === 'checking') {
            updateStatusIndicator('offline', '🔴 Not tested yet');
        }
    }, 3000);
});

// Export for use in other modules
export { updateStatusIndicator, monitorAPIStatus };
