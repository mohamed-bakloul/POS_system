const express = require('express');
const app = express.Router();
const Datastore = require('nedb');
const fs = require('fs');
const path = require('path');

// Import the shared inventory database instance from inventory.js
// This ensures we're using the same database instance and avoiding sync issues
console.log('📦 Loading inventory-purchases module...');
const InventoryModule = require('./inventory');
let inventoryDB = InventoryModule.inventoryDB;

console.log('🔍 Checking inventoryDB from inventory module...');
console.log('  - InventoryModule type:', typeof InventoryModule);
console.log('  - inventoryDB exists:', !!inventoryDB);
console.log('  - inventoryDB type:', typeof inventoryDB);

// Ensure database directory exists
const dbPath = path.join(process.env.APPDATA, 'POS', 'server', 'databases');
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('Created database directory:', dbPath);
}

// Initialize purchases database
const purchasesDBFile = path.join(dbPath, 'purchases.db');

// Database for inventory purchases
const purchasesDB = new Datastore({
    filename: purchasesDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading purchases database:', err);
        } else {
            console.log('Purchases database loaded successfully');
        }
    }
});

// Use shared inventoryDB from inventory.js module, or create fallback
if (!inventoryDB) {
    console.error('⚠️  WARNING: Could not get shared inventoryDB, creating new instance');
    const inventoryDBFile = path.join(dbPath, 'inventory.db');
    inventoryDB = new Datastore({
        filename: inventoryDBFile,
        autoload: true,
        onload: function(err) {
            if (err) {
                console.error('Error loading inventory database (fallback):', err);
            } else {
                console.log('Inventory database loaded successfully (fallback instance)');
            }
        }
    });
} else {
    console.log('✅ Using shared inventory database instance from inventory.js');
    console.log('  - Database filename:', inventoryDB.filename || 'N/A');
}

// Files will be created automatically by NeDB on first write operation

// Get all purchases (with pagination and sorting)
app.get('/all', (req, res) => {
    purchasesDB.find({}).sort({ date: -1 }).exec((err, purchases) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch purchases' });
        }
        res.json(purchases);
    });
});

// Get purchase by ID
app.post('/byId', (req, res) => {
    const { id } = req.body;
    
    purchasesDB.findOne({ _id: id }, (err, purchase) => {
        if (err || !purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }
        res.json(purchase);
    });
});

// Add new purchase and update product stock
app.post('/add', (req, res) => {
    try {
        console.log('═══════════════════════════════════════════════════');
        console.log('🛒 PURCHASE ADD REQUEST RECEIVED');
        console.log('═══════════════════════════════════════════════════');
        
        const { supplier, items, totalAmount, notes } = req.body;
    
    console.log('📦 Purchase Data:');
    console.log('  - Supplier:', supplier);
    console.log('  - Total Amount:', totalAmount);
    console.log('  - Notes:', notes);
    console.log('  - Items Count:', items ? items.length : 0);
    console.log('  - Items:', JSON.stringify(items, null, 2));
    console.log('  - Inventory DB File:', inventoryDB ? inventoryDB.filename : 'N/A');
    
    if (!supplier || !items || items.length === 0) {
        console.error('❌ Validation failed: Supplier and items are required');
        return res.status(400).json({ error: 'Supplier and items are required' });
    }
    
    if (!inventoryDB) {
        console.error('❌ Inventory database not available');
        return res.status(500).json({ error: 'Inventory database not available' });
    }
    
    const purchase = {
        supplier: supplier,
        items: items, // Array of {productId, productName, quantity, buyingPrice}
        totalAmount: totalAmount || 0,
        notes: notes || '',
        date: new Date().toISOString(),
        createdAt: Date.now()
    };
    
    console.log('💾 Inserting purchase record...');
    
    // Insert purchase record
    purchasesDB.insert(purchase, (err, newPurchase) => {
        if (err) {
            console.error('❌ Failed to insert purchase:', err);
            return res.status(500).json({ error: 'Failed to add purchase' });
        }
        
        console.log('✅ Purchase record inserted:', newPurchase._id);
        console.log('📊 Starting stock update process for', items.length, 'item(s)...');
        
        // Update stock for each product
        let updateCount = 0;
        let updateErrors = [];
        let updateSuccesses = [];
        
        items.forEach((item, index) => {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📦 Processing Item ${index + 1}/${items.length}:`);
            console.log(`  - Product ID (raw):`, item.productId, `(type: ${typeof item.productId})`);
            console.log(`  - Product Name:`, item.productName);
            console.log(`  - Quantity (raw):`, item.quantity, `(type: ${typeof item.quantity})`);
            
            // Ensure productId is parsed as integer
            const productId = parseInt(item.productId);
            const purchaseQuantity = parseInt(item.quantity) || 0;
            
            console.log(`  - Product ID (parsed):`, productId);
            console.log(`  - Quantity (parsed):`, purchaseQuantity);
            
            if (!productId || isNaN(productId)) {
                const errorMsg = `Invalid product ID for ${item.productName || 'Unknown'}`;
                console.error(`  ❌ ${errorMsg}`);
                updateErrors.push(errorMsg);
                updateCount++;
                checkCompletion();
                return;
            }
            
            if (purchaseQuantity <= 0) {
                const errorMsg = `Invalid quantity for ${item.productName || productId}`;
                console.error(`  ❌ ${errorMsg}`);
                updateErrors.push(errorMsg);
                updateCount++;
                checkCompletion();
                return;
            }
            
            console.log(`  🔍 Looking up product in database...`);
            console.log(`  🔍 Search query: { _id: ${productId} }`);
            
            inventoryDB.findOne({ _id: productId }, (err, product) => {
                if (err) {
                    console.error(`  ❌ Database error finding product ${productId}:`, err);
                    updateErrors.push(`Error finding product ${item.productName || productId}: ${err.message}`);
                    updateCount++;
                    checkCompletion();
                    return;
                }
                
                if (!product) {
                    console.error(`  ❌ Product not found in database!`);
                    console.error(`  🔍 Searched for _id: ${productId}`);
                    
                    // Try to find all products to see what IDs exist
                    inventoryDB.find({}, (err, allProducts) => {
                        if (!err && allProducts) {
                            console.error(`  📋 Available product IDs in database:`, allProducts.map(p => p._id).join(', '));
                        }
                    });
                    
                    updateErrors.push(`Product ${item.productName || productId} not found in database`);
                    updateCount++;
                    checkCompletion();
                    return;
                }
                
                console.log(`  ✅ Product found!`);
                console.log(`  📋 Product Details:`);
                console.log(`     - _id: ${product._id}`);
                console.log(`     - name: ${product.name}`);
                console.log(`     - quantity (current): ${product.quantity} (type: ${typeof product.quantity})`);
                console.log(`     - stock flag: ${product.stock}`);
                console.log(`     - Full product:`, JSON.stringify(product, null, 2));
                
                // Update stock quantity - use 'quantity' field, not 'stock' (stock is a flag)
                const currentQuantity = parseInt(product.quantity) || 0;
                const newQuantity = currentQuantity + purchaseQuantity;
                
                console.log(`  📊 Stock Calculation:`);
                console.log(`     - Current: ${currentQuantity}`);
                console.log(`     - Adding: ${purchaseQuantity}`);
                console.log(`     - New Total: ${newQuantity}`);
                
                console.log(`  💾 Updating database...`);
                console.log(`  🔧 Update query: { _id: ${productId} }`);
                console.log(`  🔧 Update operation: { $set: { quantity: ${newQuantity} } }`);
                
                inventoryDB.update(
                    { _id: productId },
                    { $set: { quantity: newQuantity } },
                    {},
                    (err, numReplaced) => {
                        if (err) {
                            console.error(`  ❌ Database error during update:`, err);
                            updateErrors.push(`Failed to update stock for ${item.productName}: ${err.message}`);
                        } else if (numReplaced === 0) {
                            console.error(`  ❌ Update returned 0 replaced documents!`);
                            console.error(`  🔍 This means no product matched the query { _id: ${productId} }`);
                            
                            // Verify the product still exists
                            inventoryDB.findOne({ _id: productId }, (err, verifyProduct) => {
                                if (err) {
                                    console.error(`  ❌ Error verifying product:`, err);
                                } else if (!verifyProduct) {
                                    console.error(`  ❌ Product no longer exists after initial find!`);
                                } else {
                                    console.error(`  ⚠️  Product still exists with quantity: ${verifyProduct.quantity}`);
                                }
                            });
                            
                            updateErrors.push(`Product ${item.productName} update failed (0 documents replaced)`);
                        } else {
                            console.log(`  ✅ Stock updated successfully!`);
                            console.log(`  ✅ Documents replaced: ${numReplaced}`);
                            console.log(`  ✅ ${item.productName}: ${currentQuantity} -> ${newQuantity}`);
                            
                            // Verify the update
                            inventoryDB.findOne({ _id: productId }, (err, verifyProduct) => {
                                if (!err && verifyProduct) {
                                    console.log(`  ✅ Verification: Product now has quantity: ${verifyProduct.quantity}`);
                                    if (parseInt(verifyProduct.quantity) === newQuantity) {
                                        console.log(`  ✅ Update verified successfully!`);
                                    } else {
                                        console.error(`  ⚠️  WARNING: Quantity mismatch! Expected: ${newQuantity}, Got: ${verifyProduct.quantity}`);
                                    }
                                }
                            });
                            
                            updateSuccesses.push({
                                productName: item.productName,
                                oldQuantity: currentQuantity,
                                newQuantity: newQuantity
                            });
                        }
                        updateCount++;
                        checkCompletion();
                    }
                );
            });
        });
        
        function checkCompletion() {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📊 Update Progress: ${updateCount}/${items.length}`);
            
            if (updateCount === items.length) {
                console.log(`\n═══════════════════════════════════════════════════`);
                console.log(`🏁 STOCK UPDATE PROCESS COMPLETE`);
                console.log(`═══════════════════════════════════════════════════`);
                console.log(`  ✅ Successful updates: ${updateSuccesses.length}`);
                console.log(`  ❌ Failed updates: ${updateErrors.length}`);
                
                if (updateSuccesses.length > 0) {
                    console.log(`\n  📊 Successful Updates:`);
                    updateSuccesses.forEach(success => {
                        console.log(`     - ${success.productName}: ${success.oldQuantity} -> ${success.newQuantity}`);
                    });
                }
                
                if (updateErrors.length > 0) {
                    console.log(`\n  ❌ Errors:`);
                    updateErrors.forEach(error => {
                        console.log(`     - ${error}`);
                    });
                    return res.json({
                        success: true,
                        purchase: newPurchase,
                        warnings: updateErrors
                    });
                }
                
                console.log(`\n  ✅ All stock updates completed successfully!`);
                console.log(`═══════════════════════════════════════════════════\n`);
                
                res.json({
                    success: true,
                    purchase: newPurchase,
                    message: 'Purchase added and stock updated successfully'
                });
            }
        }
    });
    } catch (error) {
        console.error('❌ Unexpected error in purchase add endpoint:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
            error: 'Failed to add purchase', 
            details: error.message 
        });
    }
});

// Delete purchase (without affecting stock - for correction purposes)
app.post('/delete', (req, res) => {
    const { id } = req.body;
    
    purchasesDB.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete purchase' });
        }
        res.json({ success: true, message: 'Purchase deleted successfully' });
    });
});

// Get purchases summary/statistics
app.get('/stats', (req, res) => {
    purchasesDB.find({}, (err, purchases) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        
        const totalPurchases = purchases.length;
        const totalAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        
        // Group by supplier
        const supplierStats = {};
        purchases.forEach(p => {
            if (!supplierStats[p.supplier]) {
                supplierStats[p.supplier] = {
                    count: 0,
                    totalAmount: 0
                };
            }
            supplierStats[p.supplier].count++;
            supplierStats[p.supplier].totalAmount += p.totalAmount || 0;
        });
        
        res.json({
            totalPurchases,
            totalAmount,
            supplierStats
        });
    });
});

module.exports = app;

