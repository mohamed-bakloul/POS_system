/**
 * Settings API - Application settings endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
const multer = require('multer');
const fs = require('fs');

// Configure multer for logo uploads
const storage = multer.diskStorage({
    destination: process.env.APPDATA + '/POS/uploads',
    filename: function(req, file, callback) {
        callback(null, Date.now() + '.jpg');
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());

module.exports = app;

// Initialize database
const settingsDB = new Datastore({
    filename: process.env.APPDATA + '/POS/server/databases/settings.db',
    autoload: true
});

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Settings API');
});

/**
 * Get settings
 */
app.get('/get', async (req, res) => {
    try {
        settingsDB.findOne({ _id: 1 }, (err, settings) => {
            if (err) {
                console.error('Error finding settings:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!settings) {
                return res.json(null);
            }

            res.json(settings);
        });

    } catch (error) {
        console.error('Error in get settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Save settings (create or update)
 */
app.post('/post', upload.single('imagename'), async (req, res) => {
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
            const imagePath = process.env.APPDATA + '/POS/uploads/' + req.body.img;
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error removing logo:', err);
            }

            if (!req.file) {
                image = '';
            }
        }

        // Prepare settings object
        const Settings = {
            _id: 1,
            settings: {
                app: req.body.app || 'Standalone Point of Sale',
                store: req.body.store || '',
                address_one: req.body.address_one || '',
                address_two: req.body.address_two || '',
                contact: req.body.contact || '',
                tax: req.body.tax || '',
                symbol: req.body.symbol || '$',
                percentage: req.body.percentage || '0',
                charge_tax: req.body.charge_tax || 'off',
                footer: req.body.footer || '',
                img: image
            }
        };

        if (!req.body.id || req.body.id === '') {
            // Create new settings
            settingsDB.insert(Settings, (err, settings) => {
                if (err) {
                    console.error('Error creating settings:', err);
                    return res.status(500).json({ error: 'Failed to create settings' });
                }
                console.log('✓ Settings created');
                res.json(settings);
            });
        } else {
            // Update existing settings
            settingsDB.update(
                { _id: 1 },
                Settings,
                {},
                (err, numReplaced) => {
                    if (err) {
                        console.error('Error updating settings:', err);
                        return res.status(500).json({ error: 'Failed to update settings' });
                    }
                    console.log('✓ Settings updated');
                    res.sendStatus(200);
                }
            );
        }

    } catch (error) {
        console.error('Error in save settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
