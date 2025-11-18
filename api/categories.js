/**
 * Categories API - Category management endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
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
const uploadsPath = path.join(process.env.APPDATA, 'POS', 'uploads', 'categories');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Created categories uploads directory:', uploadsPath);
}

// Configure multer for category image uploads
const storage = multer.diskStorage({
    destination: uploadsPath,
    filename: function(req, file, callback) {
        callback(null, Date.now() + '.jpg');
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());

module.exports = app;

// Initialize database - let NeDB create the file naturally
const categoryDBFile = path.join(dbPath, 'categories.db');

// Don't pre-create the file - let NeDB handle it
// Just ensure directory exists (done above)

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
app.post('/category', upload.single('imagename'), async (req, res) => {
    try {
        const categoryData = req.body;
        let image = '';

        if (!categoryData.name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Handle existing image
        if (req.body.img && req.body.img !== '') {
            image = req.body.img;
        }

        // Handle new upload
        if (req.file) {
            image = 'categories/' + req.file.filename;
        }

        // Handle image removal
        if (req.body.remove == 1) {
            const imagePath = path.join(process.env.APPDATA, 'POS', 'uploads', req.body.img);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error removing category image:', err);
            }

            if (!req.file) {
                image = '';
            }
        }

        categoryData._id = Math.floor(Date.now() / 1000);
        categoryData.img = image;

        categoryDB.insert(categoryData, (err, category) => {
            if (err) {
                console.error('Error creating category:', err);
                return res.status(500).json({ error: 'Failed to create category' });
            }
            console.log('✓ Category created:', category.name);
            res.json(category);
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
app.put('/category', upload.single('imagename'), async (req, res) => {
    try {
        const categoryId = parseInt(req.body.id);
        let image = '';

        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        if (!req.body.name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Handle existing image
        if (req.body.img && req.body.img !== '') {
            image = req.body.img;
        }

        // Handle new upload
        if (req.file) {
            image = 'categories/' + req.file.filename;
        }

        // Handle image removal
        if (req.body.remove == 1) {
            const imagePath = path.join(process.env.APPDATA, 'POS', 'uploads', req.body.img);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error removing category image:', err);
            }

            if (!req.file) {
                image = '';
            }
        }

        const updateData = {
            name: req.body.name,
            img: image
        };

        categoryDB.update(
            { _id: categoryId },
            { $set: updateData },
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
