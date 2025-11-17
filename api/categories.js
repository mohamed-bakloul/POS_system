/**
 * Categories API - Category management endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');

app.use(bodyParser.json());

module.exports = app;

// Initialize database
const categoryDB = new Datastore({
    filename: process.env.APPDATA + '/POS/server/databases/categories.db',
    autoload: true
});

categoryDB.ensureIndex({ fieldName: '_id', unique: true });

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Category API');
});

/**
 * Get all categories
 */
app.get('/all', async (req, res) => {
    try {
        categoryDB.find({}, (err, categories) => {
            if (err) {
                console.error('Error finding categories:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(categories);
        });
    } catch (error) {
        console.error('Error in get all categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create new category
 */
app.post('/category', async (req, res) => {
    try {
        const categoryData = req.body;

        if (!categoryData.name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        categoryData._id = Math.floor(Date.now() / 1000);

        categoryDB.insert(categoryData, (err, category) => {
            if (err) {
                console.error('Error creating category:', err);
                return res.status(500).json({ error: 'Failed to create category' });
            }
            console.log('✓ Category created:', category.name);
            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in create category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete category
 */
app.delete('/category/:categoryId', async (req, res) => {
    try {
        if (!req.params.categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        categoryDB.remove({ _id: parseInt(req.params.categoryId) }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting category:', err);
                return res.status(500).json({ error: 'Failed to delete category' });
            }

            if (numRemoved === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in delete category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update category
 */
app.put('/category', async (req, res) => {
    try {
        const categoryId = parseInt(req.body.id);

        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        categoryDB.update(
            { _id: categoryId },
            req.body,
            {},
            (err, numReplaced) => {
                if (err) {
                    console.error('Error updating category:', err);
                    return res.status(500).json({ error: 'Failed to update category' });
                }

                if (numReplaced === 0) {
                    return res.status(404).json({ error: 'Category not found' });
                }

                console.log('✓ Category updated:', req.body.name);
                res.sendStatus(200);
            }
        );

    } catch (error) {
        console.error('Error in update category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
