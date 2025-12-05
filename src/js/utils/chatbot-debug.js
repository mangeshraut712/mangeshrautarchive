/**
 * Chatbot Debug & Fix Script
 * Ensures chatbot toggle works properly
 */

(function () {
    console.log('🔧 Chatbot Debug Script Running...');

    // Wait for DOM to be ready
    function init() {
        const toggle = document.getElementById('chatbot-toggle');
        const widget = document.getElementById('chatbot-widget');

        console.log('Toggle button:', toggle);
        console.log('Widget:', widget);

        if (!toggle) {
            console.error('❌ Chatbot toggle button not found!');
            return;
        }

        if (!widget) {
            console.error('❌ Chatbot widget not found!');
            return;
        }

        // Manual click handler as fallback
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('🖱️ Toggle clicked!');

            const isHidden = widget.classList.contains('hidden');
            console.log('Is hidden:', isHidden);

            if (isHidden) {
                // Open
                widget.classList.remove('hidden');
                widget.classList.add('visible');
                widget.setAttribute('aria-hidden', 'false');
                toggle.setAttribute('aria-expanded', 'true');
                console.log('✅ Chatbot opened');
            } else {
                // Close
                widget.classList.add('hidden');
                widget.classList.remove('visible');
                widget.setAttribute('aria-hidden', 'true');
                toggle.setAttribute('aria-expanded', 'false');
                console.log('✅ Chatbot closed');
            }
        });

        // Close button handler
        const closeBtn = document.querySelector('.chatbot-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('❌ Close button clicked');
                widget.classList.add('hidden');
                widget.classList.remove('visible');
                widget.setAttribute('aria-hidden', 'true');
                toggle.setAttribute('aria-expanded', 'false');
            });
        }

        console.log('✅ Chatbot debug handlers attached');
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
