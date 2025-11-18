/**
 * Inventory API - Product management endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
const async = require('async');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbPath = path.join(process.env.APPDATA, 'POS', 'server', 'databases');
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('Created database directory:', dbPath);
}

// Ensure uploads directory exists
const uploadsPath = path.join(process.env.APPDATA, 'POS', 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Created uploads directory:', uploadsPath);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: uploadsPath,
    filename: function(req, file, callback) {
        callback(null, Date.now() + '.jpg');
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());

module.exports = app;

// Initialize databases - let NeDB create files naturally
const inventoryDBFile = path.join(dbPath, 'inventory.db');
const categoryDBFile = path.join(dbPath, 'categories.db');

// Don't pre-create files - let NeDB handle it
// Just ensure directory exists (done above)

const inventoryDB = new Datastore({
    filename: inventoryDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading inventory database:', err);
        } else {
            console.log('Inventory database loaded successfully');
        }
    }
});

const categoryDB = new Datastore({
    filename: categoryDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading categories database:', err);
        } else {
            console.log('Categories database loaded successfully');
        }
    }
});

// Files will be created automatically by NeDB on first write operation

inventoryDB.ensureIndex({ fieldName: '_id', unique: true });

// Export inventoryDB so other modules can use the same instance
module.exports.inventoryDB = inventoryDB;

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Inventory API');
});

/**
 * Get product by ID
 */
app.get('/product/:productId', async (req, res) => {
    try {
        if (!req.params.productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        inventoryDB.findOne({ _id: parseInt(req.params.productId) }, (err, product) => {
            if (err) {
                console.error('Error finding product:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json(product);
        });

    } catch (error) {
        console.error('Error in get product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all products
 */
app.get('/products', async (req, res) => {
    try {
        inventoryDB.find({}, (err, docs) => {
            if (err) {
                console.error('Error finding products:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(docs);
        });

    } catch (error) {
        console.error('Error in get products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all products with category names (for management page)
 */
app.get('/all', async (req, res) => {
    try {
        // Get all products
        inventoryDB.find({}, (err, products) => {
            if (err) {
                console.error('Error finding products:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Get all categories
            categoryDB.find({}, (catErr, categories) => {
                if (catErr) {
                    console.error('Error finding categories:', catErr);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Create a map of category IDs to names
                const categoryMap = {};
                categories.forEach(cat => {
                    categoryMap[cat._id] = cat.name;
                });

                // Join products with category names
                const productsWithCategories = products.map(product => ({
                    ...product,
                    category_name: categoryMap[product.category] || 'N/A'
                }));

                res.json(productsWithCategories);
            });
        });

    } catch (error) {
        console.error('Error in get all products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get product by ID (POST method for compatibility)
 */
app.post('/byId', async (req, res) => {
    try {
        if (!req.body.id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        inventoryDB.findOne({ _id: parseInt(req.body.id) }, (err, product) => {
            if (err) {
                console.error('Error finding product:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json(product);
        });

    } catch (error) {
        console.error('Error in get product by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create or update product (alias for /product)
 */
app.post('/save', upload.single('imagename'), async (req, res) => {
    try {
        let image = '';

        // Handle existing image
        if (req.body.img && req.body.img !== '') {
            image = req.body.img;
        }

        // Handle new upload
        if (req.file) {
            image = req.file.filename;
        }

        // Handle image removal
        if (req.body.remove == 1) {
            const imagePath = path.join(uploadsPath, req.body.img);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error removing image:', err);
            }

            if (!req.file) {
                image = '';
            }
        }

        // Prepare product object
        const Product = {
            _id: req.body.id ? parseInt(req.body.id) : Math.floor(Date.now() / 1000),
            price: parseFloat(req.body.price) || 0,
            category: parseInt(req.body.category) || 0,
            quantity: req.body.quantity === '' ? 0 : parseInt(req.body.quantity),
            name: req.body.name || '',
            barcode: req.body.barcode || '',
            stock: req.body.stock === 'on' ? 0 : 1,
            img: image,
            sku: req.body.sku || req.body.id || Math.floor(Date.now() / 1000)
        };

        // Create or update
        if (!req.body.id || req.body.id === '') {
            // Create new product
            inventoryDB.insert(Product, (err, product) => {
                if (err) {
                    console.error('Error creating product:', err);
                    return res.status(500).json({ error: 'Failed to create product' });
                }
                res.json(product);
            });
        } else {
            // Update existing product
            inventoryDB.update(
                { _id: parseInt(req.body.id) },
                Product,
                {},
                (err, numReplaced) => {
                    if (err) {
                        console.error('Error updating product:', err);
                        return res.status(500).json({ error: 'Failed to update product' });
                    }
                    res.json({ success: true });
                }
            );
        }

    } catch (error) {
        console.error('Error in save product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create or update product
 */
app.post('/product', upload.single('imagename'), async (req, res) => {
    try {
        let image = '';

        // Handle existing image
        if (req.body.img && req.body.img !== '') {
            image = req.body.img;
        }

        // Handle new upload
        if (req.file) {
            image = req.file.filename;
        }

        // Handle image removal
        if (req.body.remove == 1) {
            const imagePath = path.join(uploadsPath, req.body.img);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error removing image:', err);
            }

            if (!req.file) {
                image = '';
            }
        }

        // Prepare product object
        const Product = {
            _id: req.body.id ? parseInt(req.body.id) : Math.floor(Date.now() / 1000),
            price: parseFloat(req.body.price) || 0,
            category: parseInt(req.body.category) || 0,
            quantity: req.body.quantity === '' ? 0 : parseInt(req.body.quantity),
            name: req.body.name || '',
            stock: req.body.stock === 'on' ? 0 : 1,
            img: image,
            sku: req.body.id || Math.floor(Date.now() / 1000) // Use ID as SKU if not provided
        };

        // Create or update
        if (!req.body.id || req.body.id === '') {
            // Create new product
            inventoryDB.insert(Product, (err, product) => {
                if (err) {
                    console.error('Error creating product:', err);
                    return res.status(500).json({ error: 'Failed to create product' });
                }
                res.json(product);
            });
        } else {
            // Update existing product
            inventoryDB.update(
                { _id: parseInt(req.body.id) },
                Product,
                {},
                (err, numReplaced) => {
                    if (err) {
                        console.error('Error updating product:', err);
                        return res.status(500).json({ error: 'Failed to update product' });
                    }
                    res.sendStatus(200);
                }
            );
        }

    } catch (error) {
        console.error('Error in save product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete product (POST method for compatibility)
 */
app.post('/delete', async (req, res) => {
    try {
        if (!req.body.id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        inventoryDB.remove({ _id: parseInt(req.body.id) }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting product:', err);
                return res.status(500).json({ error: 'Failed to delete product' });
            }
            
            if (numRemoved === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ success: true });
        });

    } catch (error) {
        console.error('Error in delete product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete product
 */
app.delete('/product/:productId', async (req, res) => {
    try {
        if (!req.params.productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        inventoryDB.remove({ _id: parseInt(req.params.productId) }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting product:', err);
                return res.status(500).json({ error: 'Failed to delete product' });
            }
            
            if (numRemoved === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in delete product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get product by SKU
 */
app.post('/product/sku', async (req, res) => {
    try {
        const skuCode = req.body.skuCode;
        
        if (!skuCode) {
            return res.status(400).json({ error: 'SKU code is required' });
        }

        inventoryDB.findOne({ _id: parseInt(skuCode) }, (err, product) => {
            if (err) {
                console.error('Error finding product by SKU:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(product || {});
        });

    } catch (error) {
        console.error('Error in get product by SKU:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update stock directly (manual adjustment)
 */
app.post('/update-stock', (req, res) => {
    try {
        const { id, stock, reason } = req.body;
        
        if (!id || stock === undefined) {
            return res.status(400).json({ error: 'Product ID and stock are required' });
        }
        
        console.log(`Updating stock for product ${id}: ${stock} (Reason: ${reason || 'N/A'})`);
        
        // Update quantity field (not stock - stock is a flag for stock tracking)
        inventoryDB.update(
            { _id: parseInt(id) },
            { $set: { quantity: parseInt(stock) } },
            {},
            (err, numReplaced) => {
                if (err) {
                    console.error('Error updating stock:', err);
                    return res.status(500).json({ error: 'Failed to update stock' });
                }
                
                if (numReplaced === 0) {
                    return res.status(404).json({ error: 'Product not found' });
                }
                
                console.log(`✓ Stock updated for product ${id}: ${stock}`);
                res.json({
                    success: true,
                    message: 'Stock updated successfully',
                    newStock: parseInt(stock)
                });
            }
        );
        
    } catch (error) {
        console.error('Error in update stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Decrement inventory after sale
 * Called by transactions API
 * @param {Array} products - Array of products with id and quantity
 */
app.decrementInventory = function(products) {
    async.eachSeries(products, function(transactionProduct, callback) {
        inventoryDB.findOne({ _id: parseInt(transactionProduct.id) }, (err, product) => {
            if (err) {
                console.error('Error finding product for decrement:', err);
                return callback(err);
            }

            if (!product || !product.quantity) {
                console.log(`Product ${transactionProduct.id} - no stock tracking or not found`);
                return callback();
            }

            const updatedQuantity = Math.max(0, parseInt(product.quantity) - parseInt(transactionProduct.quantity));

            inventoryDB.update(
                { _id: parseInt(product._id) },
                { $set: { quantity: updatedQuantity } },
                {},
                (err) => {
                    if (err) {
                        console.error('Error updating inventory:', err);
                        return callback(err);
                    }
                    console.log(`✓ Inventory decremented: ${product.name} - ${transactionProduct.quantity} units`);
                    callback();
                }
            );
        });
    }, (err) => {
        if (err) {
            console.error('Error in inventory decrement batch:', err);
        }
    });
};
