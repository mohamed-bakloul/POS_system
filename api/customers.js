/**
 * Customers API - Customer management endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
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
const customerDBFile = path.join(dbPath, 'customers.db');

// Don't pre-create the file - let NeDB handle it
// Just ensure directory exists (done above)

const customerDB = new Datastore({
    filename: customerDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading customers database:', err);
        } else {
            console.log('Customers database loaded successfully');
        }
    }
});

// File will be created automatically by NeDB on first write operation

customerDB.ensureIndex({ fieldName: '_id', unique: true });

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Customer API');
});

/**
 * Get customer by ID
 */
app.get('/customer/:customerId', async (req, res) => {
    try {
        if (!req.params.customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        customerDB.findOne({ _id: req.params.customerId }, (err, customer) => {
            if (err) {
                console.error('Error finding customer:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            res.json(customer);
        });

    } catch (error) {
        console.error('Error in get customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all customers
 */
app.get('/all', async (req, res) => {
    try {
        customerDB.find({}, (err, customers) => {
            if (err) {
                console.error('Error finding customers:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(customers);
        });
    } catch (error) {
        console.error('Error in get all customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create new customer
 */
app.post('/customer', async (req, res) => {
    try {
        const customerData = req.body;

        if (!customerData.name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        customerDB.insert(customerData, (err, customer) => {
            if (err) {
                console.error('Error creating customer:', err);
                return res.status(500).json({ error: 'Failed to create customer' });
            }
            console.log('✓ Customer created:', customer.name);
            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in create customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete customer
 */
app.delete('/customer/:customerId', async (req, res) => {
    try {
        if (!req.params.customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        customerDB.remove({ _id: req.params.customerId }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting customer:', err);
                return res.status(500).json({ error: 'Failed to delete customer' });
            }

            if (numRemoved === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in delete customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update customer
 */
app.put('/customer', async (req, res) => {
    try {
        const customerId = req.body._id;

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        customerDB.update(
            { _id: customerId },
            req.body,
            {},
            (err, numReplaced) => {
                if (err) {
                    console.error('Error updating customer:', err);
                    return res.status(500).json({ error: 'Failed to update customer' });
                }

                if (numReplaced === 0) {
                    return res.status(404).json({ error: 'Customer not found' });
                }

                console.log('✓ Customer updated:', req.body.name);
                res.sendStatus(200);
            }
        );

    } catch (error) {
        console.error('Error in update customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
