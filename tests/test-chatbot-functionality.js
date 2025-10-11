// Test script to simulate chatbot functionality
// Global mocks must be defined before any imports
global.window = {
    location: { hostname: 'mangeshraut712.github.io', protocol: 'https:' },
    APP_CONFIG: {},
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.document = {
    getElementById: (id) => {
        const elements = {
            'portfolio-chat-toggle': {
                addEventListener: (event, callback) => {
                    console.log(`✅ Event listener added to ${id}: ${event}`);
                },
                setAttribute: (attr, value) => {
                    console.log(`✅ ${id} attribute set: ${attr}=${value}`);
                },
                classList: {
                    add: (className) => console.log(`✅ ${id} class added: ${className}`),
                    remove: (className) => console.log(`✅ ${id} class removed: ${className}`),
                    contains: (className) => className === 'active' ? false : className === 'hidden' ? true : false
                },
                ariaExpanded: false
            },
            'portfolio-chat-widget': {
                classList: {
                    remove: (className) => console.log(`✅ Widget class removed: ${className}`),
                    add: (className) => console.log(`❌ Widget class added: ${className}`),
                    contains: (className) => className === 'hidden' ? true : false
                },
                style: {},
                setAttribute: (attr, value) => {
                    console.log(`✅ Widget attribute set: ${attr}=${value}`);
                }
            },
            'portfolio-chat-close': {
                addEventListener: (event, callback) => {
                    console.log(`✅ Close button event listener added: ${event}`);
                }
            }
        };
        return elements[id] || null;
    },
    createElement: (tag) => ({
        className: '',
        innerHTML: '',
        appendChild: () => {},
        addEventListener: () => {}
    }),
    addEventListener: () => {},
    querySelector: () => null
};

global.navigator = { onLine: true };

// Now import after globals are set
import { ChatUI } from '../src/js/script.js';

console.log('🧪 Testing Chatbot Functionality...\n');

// Test the ChatUI initialization
console.log('🔧 Testing ChatUI Initialization...');

try {
    const chatUI = new ChatUI();

    console.log('✅ ChatUI initialized successfully');

    // Simulate clicking the toggle button
    console.log('\n🖱️ Simulating click on chatbot toggle button...');

    // Check if widget is initially hidden
    const widget = document.getElementById('portfolio-chat-widget');
    const isHidden = widget.classList.contains('hidden');
    console.log(`📱 Widget initially hidden: ${isHidden} (should be true)`);

    // Simulate the click
    console.log('🎯 Triggering toggle widget...');
    chatUI._toggleWidget();

    // Check if widget is now visible
    setTimeout(() => {
        const isHiddenAfter = chatUI.elements.widget.classList.contains('hidden');
        console.log(`📱 Widget hidden after click: ${isHiddenAfter} (should be false)`);

        if (!isHiddenAfter) {
            console.log('🎉 SUCCESS: Chatbot widget is now visible!');
        } else {
            console.log('❌ FAILURE: Chatbot widget is still hidden');
        }

        console.log('\n🔍 Checking widget state:');
        console.log('- Widget element exists:', !!chatUI.elements.widget);
        console.log('- Toggle button exists:', !!chatUI.elements.toggleButton);
        console.log('- Close button exists:', !!chatUI.elements.closeButton);

    }, 100);

} catch (error) {
    console.error('❌ ChatUI initialization failed:', error);
    console.error('Stack:', error.stack);
}

// Test CSS class functionality
console.log('\n🎨 Testing CSS Class Functionality...');

// Mock the widget element for CSS testing
const mockWidget = {
    classList: {
        contains: (className) => className === 'hidden' ? true : false,
        remove: (className) => console.log(`CSS: Removing class "${className}"`),
        add: (className) => console.log(`CSS: Adding class "${className}"`)
    }
};

// Simulate JavaScript logic for toggle
function simulateToggle(widget) {
    if (widget.classList.contains('hidden')) {
        widget.classList.remove('hidden');
        widget.classList.add('visible');
        console.log('✅ Toggle: hidden → visible');
        return true;
    } else {
        widget.classList.add('hidden');
        widget.classList.remove('visible');
        console.log('✅ Toggle: visible → hidden');
        return false;
    }
}

const isVisibleAfterSimulate = simulateToggle(mockWidget);
console.log(`📊 Final visibility state: ${isVisibleAfterSimulate}`);
