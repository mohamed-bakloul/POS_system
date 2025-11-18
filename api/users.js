/**
 * Users API - User management endpoints
 * Refactored with async/await and error handling
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Datastore = require('nedb');
const btoa = require('btoa');
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
const usersDBFile = path.join(dbPath, 'users.db');

// Don't pre-create the file - let NeDB handle it
// Just ensure directory exists (done above)

const usersDB = new Datastore({
    filename: usersDBFile,
    autoload: true,
    onload: function(err) {
        if (err) {
            console.error('Error loading users database:', err);
        } else {
            console.log('Users database loaded successfully');
        }
    }
});

// File will be created automatically by NeDB on first write operation

usersDB.ensureIndex({ fieldName: '_id', unique: true });

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.send('Users API');
});

/**
 * Get user by ID
 */
app.get('/user/:userId', async (req, res) => {
    try {
        if (!req.params.userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        usersDB.findOne({ _id: parseInt(req.params.userId) }, (err, user) => {
            if (err) {
                console.error('Error finding user:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        });

    } catch (error) {
        console.error('Error in get user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Logout user
 */
app.get('/logout/:userId', async (req, res) => {
    try {
        if (!req.params.userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        usersDB.update(
            { _id: parseInt(req.params.userId) },
            { $set: { status: 'Logged Out_' + new Date().toISOString() } },
            {},
            (err, numReplaced) => {
                if (err) {
                    console.error('Error logging out user:', err);
                    return res.status(500).json({ error: 'Failed to logout user' });
                }

                if (numReplaced === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                console.log(`✓ User ${req.params.userId} logged out`);
                res.sendStatus(200);
            }
        );

    } catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Login user
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        usersDB.findOne(
            {
                username: username,
                password: btoa(password)
            },
            (err, user) => {
                if (err) {
                    console.error('Error during login:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    console.log(`⚠ Failed login attempt for username: ${username}`);
                    return res.json({});
                }

                // Update login status
                usersDB.update(
                    { _id: user._id },
                    { $set: { status: 'Logged In_' + new Date().toISOString() } },
                    {},
                    (err) => {
                        if (err) {
                            console.error('Error updating login status:', err);
                        }
                    }
                );

                console.log(`✓ User logged in: ${user.fullname}`);
                res.json(user);
            }
        );

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all users
 */
app.get('/all', async (req, res) => {
    try {
        usersDB.find({}, (err, users) => {
            if (err) {
                console.error('Error finding users:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(users);
        });
    } catch (error) {
        console.error('Error in get all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete user
 */
app.delete('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (userId === 1) {
            return res.status(403).json({ error: 'Cannot delete admin user' });
        }

        usersDB.remove({ _id: userId }, (err, numRemoved) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            if (numRemoved === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.sendStatus(200);
        });

    } catch (error) {
        console.error('Error in delete user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create or update user
 */
app.post('/post', async (req, res) => {
    try {
        const userData = req.body;

        if (!userData.username || !userData.password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const User = {
            username: userData.username,
            password: btoa(userData.password),
            fullname: userData.fullname || '',
            perm_products: userData.perm_products === 'on' ? 1 : 0,
            perm_categories: userData.perm_categories === 'on' ? 1 : 0,
            perm_transactions: userData.perm_transactions === 'on' ? 1 : 0,
            perm_users: userData.perm_users === 'on' ? 1 : 0,
            perm_settings: userData.perm_settings === 'on' ? 1 : 0,
            status: ''
        };

        if (!userData.id || userData.id === '') {
            // Create new user
            User._id = Math.floor(Date.now() / 1000);
            
            usersDB.insert(User, (err, user) => {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                console.log('✓ User created:', user.username);
                res.json(user);
            });
        } else {
            // Update existing user
            usersDB.update(
                { _id: parseInt(userData.id) },
                { $set: User },
                {},
                (err, numReplaced) => {
                    if (err) {
                        console.error('Error updating user:', err);
                        return res.status(500).json({ error: 'Failed to update user' });
                    }

                    if (numReplaced === 0) {
                        return res.status(404).json({ error: 'User not found' });
                    }

                    console.log('✓ User updated:', User.username);
                    res.sendStatus(200);
                }
            );
        }

    } catch (error) {
        console.error('Error in save user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Ensure default admin user exists
 */
app.get('/check', async (req, res) => {
    try {
        usersDB.findOne({ _id: 1 }, (err, user) => {
            if (err) {
                console.error('Error checking default admin:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                const Admin = {
                    _id: 1,
                    username: 'admin',
                    password: btoa('admin'),
                    fullname: 'Administrator',
                    perm_products: 1,
                    perm_categories: 1,
                    perm_transactions: 1,
                    perm_users: 1,
                    perm_settings: 1,
                    status: ''
                };

                usersDB.insert(Admin, (err) => {
                    if (err) {
                        console.error('Error creating default admin:', err);
                        return res.status(500).json({ error: 'Failed to create admin user' });
                    }
                    console.log('✓ Default admin user created');
                    res.sendStatus(200);
                });
            } else {
                res.sendStatus(200);
            }
        });

    } catch (error) {
        console.error('Error in check admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
