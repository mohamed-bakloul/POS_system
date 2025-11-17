/**
 * Renderer Process Entry Point
 * Loads the POS application
 */

// Load i18n first
require('./assets/js/i18n.js');

// Load UI translator
require('./assets/js/translate-ui.js');

// Load original POS (with improvements loaded first)
require('./assets/js/pos-refactored.js');
require('./assets/js/pos.js.backup');

// Load product filter
require('./assets/js/product-filter.js');

// Load print-js for receipt printing
require('print-js');

console.log('✓ Renderer process loaded');
