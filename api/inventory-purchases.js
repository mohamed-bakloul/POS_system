const express = require('express');
const app = express.Router();
const Datastore = require('nedb');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbPath = path.join(process.env.APPDATA, 'POS', 'server', 'databases');
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('Created database directory:', dbPath);
}

// Database for inventory purchases
const purchasesDB = new Datastore({
    filename: path.join(dbPath, 'purchases.db'),
    autoload: true
});

// Database for products (to update stock)
const inventoryDB = new Datastore({
    filename: path.join(dbPath, 'inventory.db'),
    autoload: true
});

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
    const { supplier, items, totalAmount, notes } = req.body;
    
    if (!supplier || !items || items.length === 0) {
        return res.status(400).json({ error: 'Supplier and items are required' });
    }
    
    const purchase = {
        supplier: supplier,
        items: items, // Array of {productId, productName, quantity, buyingPrice}
        totalAmount: totalAmount || 0,
        notes: notes || '',
        date: new Date().toISOString(),
        createdAt: Date.now()
    };
    
    // Insert purchase record
    purchasesDB.insert(purchase, (err, newPurchase) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to add purchase' });
        }
        
        // Update stock for each product
        let updateCount = 0;
        let updateErrors = [];
        
        items.forEach((item, index) => {
            inventoryDB.findOne({ _id: item.productId }, (err, product) => {
                if (err || !product) {
                    updateErrors.push(`Product ${item.productName} not found`);
                    updateCount++;
                    checkCompletion();
                    return;
                }
                
                // Update stock quantity
                const newStock = (parseInt(product.stock) || 0) + parseInt(item.quantity);
                
                inventoryDB.update(
                    { _id: item.productId },
                    { $set: { stock: newStock } },
                    {},
                    (err, numReplaced) => {
                        if (err) {
                            updateErrors.push(`Failed to update stock for ${item.productName}`);
                        }
                        updateCount++;
                        checkCompletion();
                    }
                );
            });
        });
        
        function checkCompletion() {
            if (updateCount === items.length) {
                if (updateErrors.length > 0) {
                    return res.json({
                        success: true,
                        purchase: newPurchase,
                        warnings: updateErrors
                    });
                }
                res.json({
                    success: true,
                    purchase: newPurchase,
                    message: 'Purchase added and stock updated successfully'
                });
            }
        }
    });
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

