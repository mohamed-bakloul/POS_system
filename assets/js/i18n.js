/**
 * Internationalization (i18n) Module
 * Supports multiple languages with offline capability
 */

const translations = {
    en: {
        // Navigation & Main Buttons
        'nav.products': 'Products',
        'nav.categories': 'Categories',
        'nav.openTabs': 'Open Tabs',
        'nav.customerOrders': 'Customer Orders',
        'nav.transactions': 'Transactions',
        'nav.users': 'Users',
        'nav.settings': 'Settings',
        'nav.pointOfSale': 'Point of Sale',
        'nav.logout': 'Logout',
        'nav.quit': 'Quit',
        'nav.dashboard': 'Dashboard',
        'nav.inventory': 'Inventory',
        
        // Cart
        'cart.item': 'Item',
        'cart.quantity': 'Qty',
        'cart.price': 'Price',
        'cart.total': 'Total',
        'cart.subtotal': 'Subtotal',
        'cart.discount': 'Discount',
        'cart.vat': 'VAT',
        'cart.items': 'items',
        'cart.empty': 'Cart is empty',
        'cart.totalItems': 'Total Item(s)',
        'cart.grossPrice': 'Gross Price (inc',
        'cart.tax': 'Tax)',
        
        // Buttons
        'btn.add': 'Add',
        'btn.edit': 'Edit',
        'btn.delete': 'Delete',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.close': 'Close',
        'btn.pay': 'Pay',
        'btn.hold': 'Hold',
        'btn.print': 'Print',
        'btn.clear': 'Clear',
        'btn.search': 'Search',
        'btn.filter': 'Filter',
        'btn.confirm': 'Confirm',
        
        // Login
        'login.username': 'Username',
        'login.password': 'Password',
        'login.login': 'Login',
        'login.welcome': 'Welcome',
        'login.error': 'Incorrect username or password',
        'login.empty': 'Please enter a username and password',
        
        // Products
        'product.name': 'Product Name',
        'product.price': 'Price',
        'product.category': 'Category',
        'product.quantity': 'Quantity',
        'product.stock': 'Stock',
        'product.sku': 'SKU',
        'product.image': 'Image',
        'product.trackStock': 'Track Stock',
        'product.outOfStock': 'Out of stock!',
        'product.unavailable': 'This item is currently unavailable',
        'product.noMoreStock': 'No more stock!',
        'product.allStockAdded': 'You have already added all the available stock.',
        'product.scanBarcode': 'Scan barcode or type the number then hit enter',
        'product.searchByName': 'Search product by name or sku',
        'product.search': 'Search by name or barcode...',
        
        // Inventory & Purchases
        'inventory.date': 'Date',
        'inventory.supplier': 'Supplier',
        'inventory.supplierName': 'Supplier Name',
        'inventory.items': 'Items',
        'inventory.totalAmount': 'Total Amount',
        'inventory.totalPurchases': 'Total Purchases',
        'inventory.totalProducts': 'Total Products',
        'inventory.notes': 'Notes',
        'inventory.notesPlaceholder': 'Optional notes',
        'inventory.addPurchase': 'Add Purchase',
        'inventory.purchasedItems': 'Purchased Items',
        'inventory.addItem': 'Add Item',
        'inventory.savePurchase': 'Save Purchase',
        'inventory.buyingPrice': 'Buying Price',
        'inventory.stock': 'Stock',
        'inventory.purchaseHistory': 'Purchase History',
        'inventory.purchaseDetails': 'Purchase Details',
        'inventory.editStock': 'Edit Stock',
        'inventory.currentStock': 'Current Stock',
        'inventory.newStock': 'New Stock',
        'inventory.updateStock': 'Update Stock',
        'inventory.reason': 'Reason',
        'inventory.reasonPlaceholder': 'Reason for adjustment (optional)',
        
        // Categories
        'category.name': 'Category Name',
        'category.all': 'All',
        
        // Customers
        'customer.name': 'Customer Name',
        'customer.phone': 'Phone',
        'customer.email': 'Email',
        'customer.address': 'Address',
        'customer.walkIn': 'Walk in customer',
        'customer.select': 'Select Customer',
        
        // Users
        'user.fullname': 'Full Name',
        'user.username': 'Username',
        'user.password': 'Password',
        'user.confirmPassword': 'Confirm Password',
        'user.permissions': 'Permissions',
        'user.loggedIn': 'Logged In',
        'user.loggedOut': 'Logged Out',
        
        // Permissions
        'perm.products': 'Products',
        'perm.categories': 'Categories',
        'perm.transactions': 'Transactions',
        'perm.users': 'Users',
        'perm.settings': 'Settings',
        
        // Transactions
        'trans.date': 'Date',
        'trans.orderNumber': 'Order No',
        'trans.refNumber': 'Ref No',
        'trans.cashier': 'Cashier',
        'trans.customer': 'Customer',
        'trans.total': 'Total',
        'trans.paid': 'Paid',
        'trans.change': 'Change',
        'trans.paymentMethod': 'Payment Method',
        'trans.status': 'Status',
        'trans.till': 'Till',
        'trans.invoice': 'Invoice',
        'trans.method': 'Method',
        'trans.sales': 'SALES',
        'trans.items': 'ITEMS',
        'trans.products': 'PRODUCTS',
        'trans.sold': 'Sold',
        'trans.available': 'Available',
        'trans.unpaid': 'Unpaid',
        'trans.previous': 'Previous',
        'trans.next': 'Next',
        
        // Payment
        'payment.cash': 'Cash',
        'payment.card': 'Card',
        'payment.check': 'Check',
        'payment.amount': 'Amount',
        'payment.received': 'Amount Received',
        'payment.info': 'Payment Info',
        
        // Settings
        'settings.storeName': 'Store Name',
        'settings.address': 'Address',
        'settings.contact': 'Contact',
        'settings.taxNumber': 'Tax Number',
        'settings.currency': 'Currency Symbol',
        'settings.taxRate': 'Tax Rate (%)',
        'settings.chargeTax': 'Charge Tax',
        'settings.footer': 'Receipt Footer',
        'settings.logo': 'Store Logo',
        'settings.language': 'Language',
        'settings.application': 'Application',
        'settings.standalone': 'Standalone Point of Sale',
        'settings.networkTerminal': 'Network Point of Sale Terminal',
        'settings.networkServer': 'Network Point of Sale Server',
        
        // Messages
        'msg.success': 'Success',
        'msg.error': 'Error',
        'msg.warning': 'Warning',
        'msg.confirm': 'Are you sure?',
        'msg.saved': 'Saved successfully',
        'msg.deleted': 'Deleted successfully',
        'msg.updated': 'Updated successfully',
        'msg.loading': 'Loading...',
        'msg.noData': 'No data available',
        'msg.processing': 'Processing...',
        
        // Alerts
        'alert.confirmLogout': 'You are about to log out.',
        'alert.confirmQuit': 'You are about to close the application.',
        'alert.confirmDelete': 'You are about to delete this item.',
        'alert.confirmClear': 'You are about to remove all items from the cart.',
        'alert.cantDelete': 'Cannot delete this item.',
        'alert.nothingToPay': 'There is nothing to pay!',
        'alert.nothingToHold': 'There is nothing to hold!',
        'alert.refRequired': 'You either need to select a customer or enter a reference!',
        
        // Common
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.ok': 'OK',
        'common.all': 'All',
        'common.none': 'None',
        'common.select': 'Select',
        'common.remove': 'Remove',
        'common.view': 'View',
        'common.download': 'Download',
        'common.search': 'Search:',
        'common.action': 'Action',
        'common.name': 'Name',
        'common.submit': 'Submit',
        'common.barcode': 'Barcode',
        'common.picture': 'Picture',
        'common.disableStockCheck': 'Disable stock check',
        'common.availableStock': 'Available stock',
        'common.enterProductName': 'Enter a product name',
        'common.enterCategoryName': 'Enter a category name',
        'common.showingEntries': 'Showing {from} to {to} of {total} entries',
        'common.success': 'Success',
        'common.productSaved': 'Product saved successfully',
        'common.areYouSure': 'Are you sure?',
        'common.deleteWarning': "You won't be able to revert this!",
        'common.deleted': 'Deleted!',
        'common.productDeleted': 'Product has been deleted.',
        
        // View modes
        'view.cards': 'Cards',
        'view.table': 'Table',
        
        // Common actions
        'common.choose': 'Choose Image'
    },
    
    fr: {
        // Navigation & Main Buttons
        'nav.products': 'Produits',
        'nav.categories': 'Catégories',
        'nav.openTabs': 'Onglets Ouverts',
        'nav.customerOrders': 'Commandes Clients',
        'nav.transactions': 'Transactions',
        'nav.users': 'Utilisateurs',
        'nav.settings': 'Paramètres',
        'nav.pointOfSale': 'Point de Vente',
        'nav.logout': 'Déconnexion',
        'nav.quit': 'Quitter',
        'nav.dashboard': 'Tableau de Bord',
        'nav.inventory': 'Inventaire',
        
        // Cart
        'cart.item': 'Article',
        'cart.quantity': 'Qté',
        'cart.price': 'Prix',
        'cart.total': 'Total',
        'cart.subtotal': 'Sous-total',
        'cart.discount': 'Remise',
        'cart.vat': 'TVA',
        'cart.items': 'articles',
        'cart.empty': 'Le panier est vide',
        'cart.totalItems': 'Total Article(s)',
        'cart.grossPrice': 'Prix Total (TVA',
        'cart.tax': 'incl.)',
        
        // Buttons
        'btn.add': 'Ajouter',
        'btn.edit': 'Modifier',
        'btn.delete': 'Supprimer',
        'btn.save': 'Enregistrer',
        'btn.cancel': 'Annuler',
        'btn.close': 'Fermer',
        'btn.pay': 'Payer',
        'btn.hold': 'Mettre en attente',
        'btn.print': 'Imprimer',
        'btn.clear': 'Effacer',
        'btn.search': 'Rechercher',
        'btn.filter': 'Filtrer',
        'btn.confirm': 'Confirmer',
        
        // Login
        'login.username': "Nom d'utilisateur",
        'login.password': 'Mot de passe',
        'login.login': 'Connexion',
        'login.welcome': 'Bienvenue',
        'login.error': "Nom d'utilisateur ou mot de passe incorrect",
        'login.empty': "Veuillez entrer un nom d'utilisateur et un mot de passe",
        
        // Products
        'product.name': 'Nom du produit',
        'product.price': 'Prix',
        'product.category': 'Catégorie',
        'product.quantity': 'Quantité',
        'product.stock': 'Stock',
        'product.sku': 'SKU',
        'product.image': 'Image',
        'product.trackStock': 'Suivre le stock',
        'product.outOfStock': 'En rupture de stock!',
        'product.unavailable': "Cet article n'est actuellement pas disponible",
        'product.noMoreStock': 'Plus de stock!',
        'product.allStockAdded': 'Vous avez déjà ajouté tout le stock disponible.',
        'product.scanBarcode': 'Scanner le code-barres ou taper le numéro puis appuyer sur entrée',
        'product.searchByName': 'Rechercher un produit par nom ou SKU',
        'product.search': 'Rechercher par nom ou code-barres...',
        
        // Inventory & Purchases
        'inventory.date': 'Date',
        'inventory.supplier': 'Fournisseur',
        'inventory.supplierName': 'Nom du fournisseur',
        'inventory.items': 'Articles',
        'inventory.totalAmount': 'Montant total',
        'inventory.totalPurchases': 'Total des achats',
        'inventory.totalProducts': 'Total des produits',
        'inventory.notes': 'Notes',
        'inventory.notesPlaceholder': 'Notes optionnelles',
        'inventory.addPurchase': 'Ajouter un achat',
        'inventory.purchasedItems': 'Articles achetés',
        'inventory.addItem': 'Ajouter un article',
        'inventory.savePurchase': 'Enregistrer l\'achat',
        'inventory.buyingPrice': 'Prix d\'achat',
        'inventory.stock': 'Stock',
        'inventory.purchaseHistory': 'Historique des achats',
        'inventory.purchaseDetails': 'Détails de l\'achat',
        'inventory.editStock': 'Modifier le stock',
        'inventory.currentStock': 'Stock actuel',
        'inventory.newStock': 'Nouveau stock',
        'inventory.updateStock': 'Mettre à jour le stock',
        'inventory.reason': 'Raison',
        'inventory.reasonPlaceholder': 'Raison de l\'ajustement (optionnel)',
        
        // Categories
        'category.name': 'Nom de la catégorie',
        'category.all': 'Tous',
        
        // Customers
        'customer.name': 'Nom du client',
        'customer.phone': 'Téléphone',
        'customer.email': 'Email',
        'customer.address': 'Adresse',
        'customer.walkIn': 'Client de passage',
        'customer.select': 'Sélectionner un client',
        
        // Users
        'user.fullname': 'Nom complet',
        'user.username': "Nom d'utilisateur",
        'user.password': 'Mot de passe',
        'user.confirmPassword': 'Confirmer le mot de passe',
        'user.permissions': 'Permissions',
        'user.loggedIn': 'Connecté',
        'user.loggedOut': 'Déconnecté',
        
        // Permissions
        'perm.products': 'Produits',
        'perm.categories': 'Catégories',
        'perm.transactions': 'Transactions',
        'perm.users': 'Utilisateurs',
        'perm.settings': 'Paramètres',
        
        // Transactions
        'trans.date': 'Date',
        'trans.orderNumber': 'N° de commande',
        'trans.refNumber': 'N° de référence',
        'trans.cashier': 'Caissier',
        'trans.customer': 'Client',
        'trans.total': 'Total',
        'trans.paid': 'Payé',
        'trans.change': 'Monnaie',
        'trans.paymentMethod': 'Moyen de paiement',
        'trans.status': 'Statut',
        'trans.till': 'Caisse',
        'trans.invoice': 'Facture',
        'trans.method': 'Méthode',
        'trans.sales': 'VENTES',
        'trans.items': 'ARTICLES',
        'trans.products': 'PRODUITS',
        'trans.sold': 'Vendus',
        'trans.available': 'Disponible',
        'trans.unpaid': 'Impayé',
        'trans.previous': 'Précédent',
        'trans.next': 'Suivant',
        
        // Payment
        'payment.cash': 'Espèces',
        'payment.card': 'Carte',
        'payment.check': 'Chèque',
        'payment.amount': 'Montant',
        'payment.received': 'Montant reçu',
        'payment.info': 'Info de paiement',
        
        // Settings
        'settings.storeName': 'Nom du magasin',
        'settings.address': 'Adresse',
        'settings.contact': 'Contact',
        'settings.taxNumber': 'Numéro de taxe',
        'settings.currency': 'Symbole monétaire',
        'settings.taxRate': 'Taux de taxe (%)',
        'settings.chargeTax': 'Facturer la taxe',
        'settings.footer': 'Pied de page du reçu',
        'settings.logo': 'Logo du magasin',
        'settings.language': 'Langue',
        'settings.application': 'Application',
        'settings.standalone': 'Point de vente autonome',
        'settings.networkTerminal': 'Terminal de point de vente réseau',
        'settings.networkServer': 'Serveur de point de vente réseau',
        
        // Messages
        'msg.success': 'Succès',
        'msg.error': 'Erreur',
        'msg.warning': 'Avertissement',
        'msg.confirm': 'Êtes-vous sûr?',
        'msg.saved': 'Enregistré avec succès',
        'msg.deleted': 'Supprimé avec succès',
        'msg.updated': 'Mis à jour avec succès',
        'msg.loading': 'Chargement...',
        'msg.noData': 'Aucune donnée disponible',
        'msg.processing': 'Traitement...',
        
        // Alerts
        'alert.confirmLogout': 'Vous êtes sur le point de vous déconnecter.',
        'alert.confirmQuit': "Vous êtes sur le point de fermer l'application.",
        'alert.confirmDelete': 'Vous êtes sur le point de supprimer cet élément.',
        'alert.confirmClear': 'Vous êtes sur le point de supprimer tous les articles du panier.',
        'alert.cantDelete': 'Impossible de supprimer cet élément.',
        'alert.nothingToPay': 'Il n\'y a rien à payer!',
        'alert.nothingToHold': 'Il n\'y a rien à mettre en attente!',
        'alert.refRequired': 'Vous devez soit sélectionner un client soit entrer une référence!',
        'alert.notFound': 'Introuvable!',
        'alert.notValidBarcode': "n'est pas un code-barres valide!",
        'alert.paymentSuccess': 'Paiement réussi!',
        'alert.paymentFailed': 'Le paiement a échoué',
        'alert.paymentError': 'Erreur de paiement',
        'alert.paymentProcessing': 'Traitement du paiement...',
        'alert.printReceipt': 'Voulez-vous imprimer le reçu?',
        
        // Common
        'common.yes': 'Oui',
        'common.no': 'Non',
        'common.ok': 'OK',
        'common.all': 'Tous',
        'common.none': 'Aucun',
        'common.select': 'Sélectionner',
        'common.remove': 'Supprimer',
        'common.view': 'Voir',
        'common.download': 'Télécharger',
        'common.search': 'Rechercher:',
        'common.action': 'Action',
        'common.name': 'Nom',
        'common.submit': 'Soumettre',
        'common.barcode': 'Code-barres',
        'common.picture': 'Image',
        'common.disableStockCheck': 'Désactiver la vérification du stock',
        'common.availableStock': 'Stock disponible',
        'common.enterProductName': 'Entrer un nom de produit',
        'common.enterCategoryName': 'Entrer un nom de catégorie',
        'common.showingEntries': 'Affichage de {from} à {to} sur {total} entrées',
        'common.success': 'Succès',
        'common.productSaved': 'Produit enregistré avec succès',
        'common.areYouSure': 'Êtes-vous sûr?',
        'common.deleteWarning': 'Vous ne pourrez pas revenir en arrière!',
        'common.deleted': 'Supprimé!',
        'common.productDeleted': 'Le produit a été supprimé.',
        
        // View modes
        'view.cards': 'Cartes',
        'view.table': 'Tableau',
        
        // Common actions
        'common.choose': 'Choisir une image'
    }
};

class I18n {
    constructor() {
        this.currentLanguage = this.loadLanguage();
        this.translations = translations;
    }
    
    loadLanguage() {
        // Load from localStorage or default to French
        const saved = localStorage.getItem('pos_language');
        return saved || 'fr';
    }
    
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('pos_language', lang);
            console.log('✓ Language changed to:', lang);
            return true;
        }
        return false;
    }
    
    getLanguage() {
        return this.currentLanguage;
    }
    
    translate(key) {
        const lang = this.translations[this.currentLanguage];
        return lang && lang[key] ? lang[key] : key;
    }
    
    // Short alias
    t(key) {
        return this.translate(key);
    }
    
    // Get all available languages
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' }
        ];
    }
}

// Create global instance
window.i18n = new I18n();

// Global translation function
window.t = function(key) {
    return window.i18n.translate(key);
};

console.log('✓ i18n loaded, current language:', window.i18n.getLanguage());


