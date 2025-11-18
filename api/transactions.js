/**
 * Transactions API - Sales transaction endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
const Inventory = require('./inventory');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbPath = path.join(process.env.APPDATA, 'POS', 'server', 'databases');
if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('Created database directory:', dbPath);
}

app.use(bodyParser.json());

module.exports = app;

// Initialize database - let NeDB create the file naturally
const transactionsDBFile = path.join(dbPath, 'transactions.db');

// Don't pre-create the file - let NeDB handle it
// Just ensure directory exists (done above)

const transactionsDB = new Datastore({
    filename: transactionsDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading transactions database:', err);
        } else {
            console.log('Transactions database loaded successfully');
        }
    }
});

// File will be created automatically by NeDB on first write operation

transactionsDB.ensureIndex({ fieldName: '_id', unique: true });

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Transactions API');
});

/**
 * Get all transactions
 */
app.get('/all', async (req, res) => {
    try {
        transactionsDB.find({}, (err, docs) => {
            if (err) {
                console.error('Error finding transactions:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(docs);
        });
    } catch (error) {
        console.error('Error in get all transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get held orders (open tabs)
 */
app.get('/on-hold', async (req, res) => {
    try {
        transactionsDB.find(
            { $and: [{ ref_number: { $ne: '' } }, { status: 0 }] },
            (err, docs) => {
                if (err) {
                    console.error('Error finding held orders:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(docs || []);
            }
        );
    } catch (error) {
        console.error('Error in get held orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get customer orders
 */
app.get('/customer-orders', async (req, res) => {
    try {
        transactionsDB.find(
            { $and: [{ customer: { $ne: '0' } }, { status: 0 }, { ref_number: '' }] },
            (err, docs) => {
                if (err) {
                    console.error('Error finding customer orders:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(docs || []);
            }
        );
    } catch (error) {
        console.error('Error in get customer orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get transactions by date range
 */
app.get('/by-date', async (req, res) => {
    try {
        const startDate = new Date(req.query.start);
        const endDate = new Date(req.query.end);
        const userId = parseInt(req.query.user) || 0;
        const tillId = parseInt(req.query.till) || 0;
        const status = parseInt(req.query.status);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Build query based on filters
        let query = {
            $and: [
                { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } },
                { status: status }
            ]
        };

        if (userId !== 0) {
            query.$and.push({ user_id: userId });
        }

        if (tillId !== 0) {
            query.$and.push({ till: tillId });
        }

        transactionsDB.find(query, (err, docs) => {
            if (err) {
                console.error('Error finding transactions by date:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(docs || []);
        });

    } catch (error) {
        console.error('Error in get transactions by date:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create new transaction
 */
app.post('/new', async (req, res) => {
    try {
        const newTransaction = req.body;

        // Validate required fields
        if (!newTransaction.items || !Array.isArray(newTransaction.items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        if (!newTransaction.total) {
            return res.status(400).json({ error: 'Total amount is required' });
        }

        transactionsDB.insert(newTransaction, (err, transaction) => {
            if (err) {
                console.error('Error creating transaction:', err);
                return res.status(500).json({ error: 'Failed to create transaction' });
            }

            // Decrement inventory if fully paid
            if (newTransaction.paid && parseFloat(newTransaction.paid) >= parseFloat(newTransaction.total)) {
                Inventory.decrementInventory(newTransaction.items);
                console.log('✓ Transaction completed, inventory decremented');
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in create transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update existing transaction
 */
app.put('/new', async (req, res) => {
    try {
        const orderId = req.body._id;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        transactionsDB.update(
            { _id: orderId },
            req.body,
            {},
            (err, numReplaced) => {
                if (err) {
                    console.error('Error updating transaction:', err);
                    return res.status(500).json({ error: 'Failed to update transaction' });
                }

                if (numReplaced === 0) {
                    return res.status(404).json({ error: 'Transaction not found' });
                }

                // Decrement inventory if now fully paid
                if (req.body.paid && parseFloat(req.body.paid) >= parseFloat(req.body.total)) {
                    Inventory.decrementInventory(req.body.items);
                    console.log('✓ Transaction updated, inventory decremented');
                }

                res.sendStatus(200);
            }
        );

    } catch (error) {
        console.error('Error in update transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete transaction
 */
app.post('/delete', async (req, res) => {
    try {
        const orderId = req.body.orderId;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        transactionsDB.remove({ _id: orderId }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting transaction:', err);
                return res.status(500).json({ error: 'Failed to delete transaction' });
            }

            if (numRemoved === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in delete transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get transaction by ID
 */
app.get('/:transactionId', async (req, res) => {
    try {
        if (!req.params.transactionId) {
            return res.status(400).json({ error: 'Transaction ID is required' });
        }

        transactionsDB.find({ _id: req.params.transactionId }, (err, docs) => {
            if (err) {
                console.error('Error finding transaction:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!docs || docs.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json(docs[0]);
        });

    } catch (error) {
        console.error('Error in get transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
