// This file ensures client-side initialization happens in the correct order

// Load reflect-metadata first
import 'reflect-metadata';

// This flag helps us track if initialization has happened
let initialized = false;

/**
 * Initialize client-side dependencies
 * This should be called early in the client-side rendering process
 */
export function initializeClient() {
  // Only run once and only on the client
  if (initialized || typeof window === 'undefined') {
    return;
  }

  try {
    // Ensure Reflect is available globally
    if (!window.Reflect) {
      console.error('Reflect is still not available after import');
    } else {
      console.log('Reflect is available');
    }

    initialized = true;
  } catch (e) {
    console.error('Error initializing client:', e);
  }
}

// Auto-initialize if we're on the client
if (typeof window !== 'undefined') {
  initializeClient();
}

export default { initialized, initializeClient };
