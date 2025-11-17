/**
 * POS Application - Refactored (Browser Compatible)
 * All modules in one file for Electron renderer compatibility
 */

// External dependencies
const moment = require('moment');
const Swal = require('sweetalert2');
const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const electronApp = remote.app;
const btoa = require('btoa');
const printJS = require('print-js');
const JsBarcode = require('jsbarcode');

const API_PORT = '8001';
const DEFAULT_TIMEOUT = 8000;

// ==================== STORAGE MODULE ====================

class SimpleStorage {
    constructor() {
        this.storageKey = 'pos_storage_v1';
        this.data = {};
        this.load();
    }
    
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.data = JSON.parse(saved);
                console.log('✓ Storage loaded');
            }
        } catch (error) {
            console.error('Storage load error:', error);
            this.data = {};
        }
    }
    
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Storage save error:', error);
        }
    }
    
    get(key) {
        return this.data[key];
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save();
        return value;
    }
    
    delete(key) {
        delete this.data[key];
        this.save();
    }
    
    clear() {
        this.data = {};
        localStorage.removeItem(this.storageKey);
    }
}

// ==================== UTILS MODULE ====================

function generateId() {
    return Math.floor(Date.now() / 1000);
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function formatCurrency(amount, symbol = '$') {
    try {
        return symbol + parseFloat(amount).toFixed(2);
    } catch (error) {
        return symbol + '0.00';
    }
}

function showLoading() {
    $('.loading, #loading').show();
}

function hideLoading() {
    $('.loading, #loading').hide();
}

// ==================== API CLIENT MODULE ====================

class APIClient {
    constructor(host = 'localhost', port = API_PORT) {
        this.baseUrl = `http://${host}:${port}/api/`;
        this.timeout = DEFAULT_TIMEOUT;
    }

    setHost(host) {
        this.baseUrl = `http://${host}:${API_PORT}/api/`;
    }

    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        
        try {
            const response = await $.ajax({
                url: url,
                method: options.method || 'GET',
                data: options.body ? options.body : undefined,
                contentType: options.contentType || 'application/json',
                dataType: 'json',
                timeout: this.timeout
            });
            
            return response;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// ==================== AUTH MODULE ====================

class AuthManager {
    constructor(storage, apiClient) {
        this.storage = storage;
        this.apiClient = apiClient;
        this.currentUser = null;
    }

    isAuthenticated() {
        const auth = this.storage.get('auth');
        return auth !== undefined && auth.auth === true;
    }

    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = this.storage.get('user');
        }
        return this.currentUser;
    }

    async login(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        try {
            const user = await this.apiClient.post('users/login', {
                username,
                password
            });

            if (!user || !user._id) {
                throw new Error('Invalid credentials');
            }

            this.storage.set('auth', { auth: true });
            this.storage.set('user', user);
            this.currentUser = user;

            console.log('✓ User logged in:', user.fullname);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Login failed: ' + error.message);
        }
    }

    async logout() {
        try {
            const user = this.getCurrentUser();
            
            if (user && user._id) {
                await this.apiClient.get(`users/logout/${user._id}`);
            }

            this.storage.delete('auth');
            this.storage.delete('user');
            this.currentUser = null;

            console.log('✓ User logged out');
        } catch (error) {
            console.error('Logout error:', error);
            this.storage.delete('auth');
            this.storage.delete('user');
            this.currentUser = null;
        }
    }

    async ensureDefaultAdmin() {
        try {
            await this.apiClient.get('users/check');
        } catch (error) {
            console.error('Error checking default admin:', error);
        }
    }

    getPermissions() {
        const user = this.getCurrentUser();
        
        if (!user) {
            return {
                products: false,
                categories: false,
                transactions: false,
                users: false,
                settings: false
            };
        }

        return {
            products: user.perm_products === 1,
            categories: user.perm_categories === 1,
            transactions: user.perm_transactions === 1,
            users: user.perm_users === 1,
            settings: user.perm_settings === 1
        };
    }

    async refreshUser() {
        try {
            const user = this.getCurrentUser();
            
            if (!user || !user._id) {
                throw new Error('No user logged in');
            }

            const updatedUser = await this.apiClient.get(`users/user/${user._id}`);
            this.storage.set('user', updatedUser);
            this.currentUser = updatedUser;

            return updatedUser;
        } catch (error) {
            console.error('Error refreshing user:', error);
            throw error;
        }
    }
}

// ==================== CART MODULE ====================

class CartManager {
    constructor() {
        this.items = [];
        this.discount = 0;
        this.holdOrderId = 0;
    }

    addItem(product) {
        try {
            const existingIndex = this.findItemIndex(product._id);
            
            if (existingIndex >= 0) {
                return this.incrementQuantity(existingIndex);
            } else {
                this.items.push({
                    id: product._id,
                    product_name: product.name,
                    sku: product._id,
                    price: parseFloat(product.price),
                    quantity: 1
                });
                return true;
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return false;
        }
    }

    removeItem(index) {
        try {
            if (index >= 0 && index < this.items.length) {
                this.items.splice(index, 1);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }

    incrementQuantity(index, maxQuantity = Infinity, trackStock = false) {
        try {
            if (index < 0 || index >= this.items.length) {
                return false;
            }

            const item = this.items[index];
            
            if (trackStock && item.quantity >= maxQuantity) {
                return false;
            }

            item.quantity += 1;
            return true;
        } catch (error) {
            console.error('Error incrementing quantity:', error);
            return false;
        }
    }

    decrementQuantity(index) {
        try {
            if (index < 0 || index >= this.items.length) {
                return false;
            }

            const item = this.items[index];
            
            if (item.quantity > 1) {
                item.quantity -= 1;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error decrementing quantity:', error);
            return false;
        }
    }

    setQuantity(index, quantity) {
        try {
            if (index < 0 || index >= this.items.length) {
                return false;
            }

            const parsedQty = parseInt(quantity);
            if (isNaN(parsedQty) || parsedQty < 1) {
                return false;
            }

            this.items[index].quantity = parsedQty;
            return true;
        } catch (error) {
            console.error('Error setting quantity:', error);
            return false;
        }
    }

    findItemIndex(productId) {
        return this.items.findIndex(item => item.id === productId);
    }

    calculateTotals(vatPercentage = 0, chargeVat = false) {
        try {
            let subtotal = this.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            subtotal = Math.max(0, subtotal - this.discount);

            const vat = chargeVat ? (subtotal * vatPercentage / 100) : 0;
            const total = subtotal + vat;

            return {
                itemCount: this.items.length,
                subtotal: parseFloat(subtotal.toFixed(2)),
                vat: parseFloat(vat.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                discount: parseFloat(this.discount)
            };
        } catch (error) {
            console.error('Error calculating totals:', error);
            return {
                itemCount: 0,
                subtotal: 0,
                vat: 0,
                total: 0,
                discount: 0
            };
        }
    }

    setDiscount(amount) {
        const discount = parseFloat(amount);
        this.discount = isNaN(discount) ? 0 : Math.max(0, discount);
    }

    getDiscount() {
        return this.discount;
    }

    clear() {
        this.items = [];
        this.discount = 0;
        this.holdOrderId = 0;
    }

    getItems() {
        return [...this.items];
    }

    getItemCount() {
        return this.items.length;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// ==================== MAIN APPLICATION ====================

class POSApplication {
    constructor() {
        console.log('🚀 Initializing POS Application...');
        
        this.moment = moment;
        this.ipcRenderer = ipcRenderer;
        this.imgPath = electronApp.getPath('appData') + '/POS/uploads/';
        
        this.storage = new SimpleStorage();
        this.apiClient = new APIClient();
        this.auth = new AuthManager(this.storage, this.apiClient);
        this.cart = new CartManager();
        
        this.initialized = false;
    }

    async start() {
        try {
            console.log('Starting application...');
            
            if (!this.auth.isAuthenticated()) {
                console.log('User not authenticated');
                await this.auth.ensureDefaultAdmin();
                showLoading();
                return; // Let old pos.js handle login
            }

            // If authenticated, the old system will handle the rest
            console.log('✓ New modules loaded successfully');
            this.initialized = true;

        } catch (error) {
            console.error('Error starting application:', error);
        }
    }
}

// Create global instance
window.posApp = new POSApplication();

// Start when ready
$(document).ready(function() {
    window.posApp.start();
});

console.log('✓ Refactored POS modules loaded');


