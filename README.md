## Store Point of Sale

Electron-based desktop Point of Sale (POS) system for small retail stores. It runs entirely on Node/Electron with an embedded NeDB database and can work as a **standalone till** or in a **networked multi-till** setup.

---

## Tech Stack & Architecture

- **Runtime**: `electron` (desktop shell), `node` for backend logic.
- **Backend server**: `express` (`server.js`) listening on `http://localhost:8001`.
- **Persistence**: `nedb` file databases stored under `APPDATA/POS/server/databases`.
- **Frontend**: Single-page HTML (`index.html`) with jQuery-based UI logic in `assets/js/pos.js` and `assets/js/product-filter.js`.
- **IPC / Desktop integration**: `electron` `ipcMain`/`ipcRenderer`, `electron-store` for local settings and auth.
- **Printing & reports**: `print-js`, `html2canvas`, `jspdf`, `JsBarcode`, `moment`, `DataTables`.

High-level flow:

- `start.js` boots the Electron app, imports `server.js` (which mounts all `/api/*` routes), and loads `index.html` in a frameless `BrowserWindow`.
- The UI in `index.html` uses jQuery + Bootstrap to render POS views (cart, products grid, transactions, users, settings).
- `assets/js/pos.js` talks to the backend via REST (`/api/...`) and manages cart, orders, transactions, users, and settings.

---

## Features

- **Products & Categories**
  - Manage products with price, stock quantity, category, and image.
  - Associate products with categories; filter by category and search by name/SKU.
  - Barcode rendering for products via `JsBarcode`, printable product list PDF.

- **Inventory / Stock**
  - Stock quantity tracking per product (optional stock checks can be disabled).
  - Automatic stock decrement when a fully-paid order is created.

- **Sales / POS**
  - Cart-based checkout, discounts, VAT/tax calculations, multiple payment methods (cash/card).
  - Hold orders as **Open Tabs** with reference numbers.
  - Customer selection per sale (or "Walk in customer").
  - Receipt generation and printing using `print-js`.

- **Customers**
  - Create and manage basic customer records (name, phone, email, address).
  - Attach customers to orders and list **Customer Orders**.

- **Transactions & Reporting**
  - Persist all transactions to `transactions.db`.
  - Transaction list view with date-range filter, till filter, cashier filter, and status (paid/unpaid).
  - Per-product sales breakdown for the selected period (total items sold, revenue).
  - Export transactions to CSV / Excel / PDF via DataTables buttons.

- **Users & Permissions**
  - User accounts with username/password (stored as base64 via `btoa`).
  - Permissions per user: manage products, categories, transactions, users, and settings.
  - Track login/logout status and timestamps.

- **Settings**
  - Store details (name, addresses, contact, VAT number).
  - Currency symbol and VAT percentage; optional "charge VAT" toggle.
  - Store logo upload and receipt footer text.
  - POS mode: Standalone vs Network Terminal vs Network Server.
  - For network mode, per-terminal config (server IP, till number, MAC-based hardware id) stored via `electron-store`.

---

## Backend API Overview

All APIs are mounted in `server.js` under `/api`:

- **Inventory (`api/inventory.js`)**
  - `GET /api/inventory/` – Health check ("Inventory API").
  - `GET /api/inventory/product/:productId` – Fetch one product.
  - `GET /api/inventory/products` – Fetch all products.
  - `POST /api/inventory/product` – Create/update product (multipart form with image upload).
  - `DELETE /api/inventory/product/:productId` – Delete product.
  - `POST /api/inventory/product/sku` – Lookup by SKU code.
  - `Inventory.decrementInventory(products)` – Utility used by transactions to reduce stock after a sale.

- **Customers (`api/customers.js`)**
  - `GET /api/customers/` – Health check ("Customer API").
  - `GET /api/customers/customer/:customerId` – Fetch one customer.
  - `GET /api/customers/all` – Fetch all customers.
  - `POST /api/customers/customer` – Create new customer.
  - `DELETE /api/customers/customer/:customerId` – Delete customer.
  - `PUT /api/customers/customer` – Update customer.

- **Categories (`api/categories.js`)**
  - `GET /api/categories/` – Health check ("Category API").
  - `GET /api/categories/all` – Fetch all categories.
  - `POST /api/categories/category` – Create category.
  - `PUT /api/categories/category` – Update category.
  - `DELETE /api/categories/category/:categoryId` – Delete category.

- **Users (`api/users.js`)**
  - `GET /api/users/` – Health check ("Users API").
  - `GET /api/users/user/:userId` – Get one user.
  - `GET /api/users/all` – List all users.
  - `POST /api/users/login` – Login (sets status to "Logged In_\<date\>").
  - `GET /api/users/logout/:userId` – Logout (status "Logged Out_\<date\>").
  - `POST /api/users/post` – Create or update user with permissions.
  - `DELETE /api/users/user/:userId` – Delete user.
  - `GET /api/users/check` – Ensure default admin user exists (`admin` / `admin`).

- **Settings (`api/settings.js`)**
  - `GET /api/settings/` – Health check ("Settings API").
  - `GET /api/settings/get` – Fetch settings record (`_id: 1`).
  - `POST /api/settings/post` – Create/update settings, including store logo upload and removal.

- **Transactions (`api/transactions.js`)**
  - `GET /api/` – Health check ("Transactions API").
  - `GET /api/all` – Fetch all transactions.
  - `GET /api/on-hold` – Fetch held/open tab orders.
  - `GET /api/customer-orders` – Fetch customer orders (unpaid customer-specific).
  - `GET /api/by-date?start=...&end=...&user=...&status=...&till=...` – Filtered transaction query powering the reports.
  - `POST /api/new` – Create a new transaction. If `paid >= total`, calls `Inventory.decrementInventory(items)`.
  - `PUT /api/new` – Update existing transaction (e.g., updating a held order).
  - `POST /api/delete` – Delete a transaction by `_id`.
  - `GET /api/:transactionId` – Fetch a single transaction.

---

## Frontend / UI Overview

- **Entry**: `index.html` is loaded in the Electron `BrowserWindow` (frameless, maximized, custom controls).
- **Main scripts**:
  - `renderer.js` – requires `assets/js/pos.js` and `assets/js/product-filter.js`, plus `print-js`.
  - `assets/js/pos.js` – core POS logic (auth, settings, products, customers, cart, checkout, reporting).
  - `assets/js/product-filter.js` – UI filtering: product search, open orders search, payment keypad behaviors.
- **Layout**:
  - **Top bar**: buttons for Products, Categories, Open Tabs, Customer Orders, Transactions, Users, Settings, Cashier profile, Logout, Quit.
  - **POS view (`#pos_view`)**: left side cart and customer selection; right side product grid and category filter.
  - **Transactions view (`#transactions_view`)**: summary cards (sales, transactions, items, products) + transaction table.
  - Multiple **Bootstrap modals** for products, categories, users, customer creation, hold orders, customer orders, payment, settings, and transaction receipt preview.

Authentication and session:

- On startup, `assets/js/pos.js` checks `electron-store` for stored `auth` and `user`.
- If not present, it calls `GET /api/users/check` to ensure default admin, shows a small login form (username/password).
- Successful login persists `auth` and `user` in `electron-store` and reloads the app via `ipcRenderer`.

---

## Running the Project From Source

**Prerequisites**

- Node.js (LTS recommended).
- Yarn or npm.
- Windows is the primary supported platform (paths rely on `process.env.APPDATA`).

**Install dependencies**

- `npm install`

**Run in development**

- `npm run electron`
  - Uses `cross-env` and `nodemon` to start Electron pointing at `start.js`.
  - `start.js` in turn starts the Express server and opens the POS window.

**Packaging for Windows**

- `npm run electron-build` – build via `electron-builder`.
- `npm run package-win` – package into a Windows executable/installer via `electron-packager`.

The bundled app will serve the same `index.html` and use NeDB databases under the current user's `APPDATA` directory.

---

## Default Login

- **Username**: `admin`
- **Password**: `admin`

These are created automatically on first run by `GET /api/users/check` if no users exist with `_id: 1`.

---

## Network vs Standalone Modes

The app supports three modes configured in the **Settings** modal (`Application` dropdown):

- **Standalone Point of Sale**
  - Local POS and server run on the same machine.
  - Uses NeDB databases under the local `APPDATA` path.

- **Network Point of Sale Terminal**
  - This machine acts as a client terminal.
  - You configure the **server IP** and **till number**.
  - `assets/js/pos.js` points all API calls to `http://<server-ip>:8001/api/`.

- **Network Point of Sale Server**
  - This machine acts as the central server (other terminals point to it).

Network-related settings (IP, till, MAC, app mode) are persisted using `electron-store` so they survive restarts.

---

## Code Quality Notes / Considerations

- **Pros**
  - Clear separation between API modules (`api/*`) and UI logic (`assets/js/*`).
  - Simple embedded DB (`nedb`) makes it easy to deploy without external DB.
  - Electron + Express pattern is straightforward and portable to other environments.
  - Extensible endpoints for inventory, users, settings, and transactions.

- **Limitations / possible improvements**
  - Passwords are stored using base64 (`btoa`) rather than a secure hash (e.g., bcrypt).
  - CORS is fully open in `server.js` (`Access-Control-Allow-Origin: *`).
  - Many jQuery plugin calls and inline event handlers could be modernized (e.g., to a component-based framework).
  - There is minimal validation/sanitization on many API inputs.

These do not prevent the app from working but are important if you plan to extend this into a production-grade system.

---

## Original Project & Screenshots

- Original project: `https://github.com/tngoman/Store-POS`
- Windows MSI download (original author): `http://www.storepointofsale.com/download/v1/StorePOS.msi`

Screenshots (from the original repo):

- POS view: `https://github.com/tngoman/Store-POS/blob/master/screenshots/pos.jpg`
- Transactions: `https://github.com/tngoman/Store-POS/blob/master/screenshots/transactions.jpg`
- Receipt: `https://github.com/tngoman/Store-POS/blob/master/screenshots/receipt.jpg`
- Permissions: `https://github.com/tngoman/Store-POS/blob/master/screenshots/permissions.jpg`
- Users: `https://github.com/tngoman/Store-POS/blob/master/screenshots/users.jpg`
