/**
 * UI Translation Helper
 * Translates all UI elements when language changes
 */

function translateUI() {
    if (!window.i18n) {
        console.error('i18n not loaded');
        return;
    }
    
    console.log('🌐 Translating UI to:', window.i18n.getLanguage());
    
    // Translate elements with data-i18n attribute
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        const translation = window.t(key);
        
        if ($(this).is('input[type="text"], input[type="password"], textarea')) {
            $(this).attr('placeholder', translation);
        } else if ($(this).is('input[type="submit"], input[type="button"]')) {
            $(this).val(translation);
        } else if ($(this).is('button')) {
            // For buttons, update text content but preserve icons
            const icon = $(this).find('i, .btn-label').clone();
            $(this).text(translation);
            if (icon.length > 0) {
                $(this).prepend(icon);
            }
        } else {
            $(this).text(translation);
        }
    });
    
    // Translate placeholders with data-i18n-placeholder
    $('[data-i18n-placeholder]').each(function() {
        const key = $(this).data('i18n-placeholder');
        $(this).attr('placeholder', window.t(key));
    });
    
    // Translate titles with data-i18n-title
    $('[data-i18n-title]').each(function() {
        const key = $(this).data('i18n-title');
        $(this).attr('title', window.t(key));
    });
    
    // Update customer dropdown with translated "Walk in customer"
    if ($('#customer option[value="0"]').length > 0) {
        $('#customer option[value="0"]').text(window.t('customer.walkIn'));
    }
    
    // Update customer name header if it's showing walk-in
    if ($('.customer_name b').text() === 'Walk in customer' || $('.customer_name b').text() === 'Client de passage') {
        $('.customer_name b').text(window.t('customer.walkIn'));
    }
    
    console.log('✓ UI translated');
}

// Auto-translate on page load
$(document).ready(function() {
    translateUI();
    
    // Add language selector to top header ONLY (right side, before settings button)
    if ($('#languageSelector').length === 0) {
        const languages = window.i18n.getAvailableLanguages();
        const currentLang = window.i18n.getLanguage();
        
        let html = `
            <div class="btn-group" id="languageSelector">
                <button type="button" class="btn btn-default dropdown-toggle waves-effect waves-light" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fa fa-globe"></i> ${currentLang.toUpperCase()} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
        `;
        
        languages.forEach(lang => {
            html += `<li><a href="#" data-lang="${lang.code}">${lang.name}</a></li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
        
        // Insert ONLY before the settings button in top header
        $('#settings').before(html);
        
        // Handle language change
        $('#languageSelector a').on('click', function(e) {
            e.preventDefault();
            const newLang = $(this).data('lang');
            
            if (window.i18n.setLanguage(newLang)) {
                translateUI();
                
                // Update button text
                $('#languageSelector button').html(`<i class="fa fa-globe"></i> ${newLang.toUpperCase()} <span class="caret"></span>`);
                
                // Reload to apply translations everywhere
                Swal.fire({
                    title: window.t('msg.success'),
                    text: window.t('msg.updated'),
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            }
        });
    }
});

// DataTables language configuration
function getDataTablesLanguage() {
    const lang = window.i18n.getLanguage();
    
    if (lang === 'fr') {
        return {
            "sProcessing": "Traitement en cours...",
            "sSearch": "Rechercher:",
            "sLengthMenu": "Afficher _MENU_ &eacute;l&eacute;ments",
            "sInfo": "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
            "sInfoEmpty": "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
            "sInfoFiltered": "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
            "sInfoPostFix": "",
            "sLoadingRecords": "Chargement en cours...",
            "sZeroRecords": "Aucun &eacute;l&eacute;ment &agrave; afficher",
            "sEmptyTable": "Aucune donn&eacute;e disponible dans le tableau",
            "oPaginate": {
                "sFirst": "Premier",
                "sPrevious": "Pr&eacute;c&eacute;dent",
                "sNext": "Suivant",
                "sLast": "Dernier"
            },
            "oAria": {
                "sSortAscending": ": activer pour trier la colonne par ordre croissant",
                "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
            },
            "select": {
                "rows": {
                    _: "%d lignes séléctionnées",
                    0: "Aucune ligne séléctionnée",
                    1: "1 ligne séléctionnée"
                }
            }
        };
    } else {
        return {
            "sSearch": "Search:",
            "sLengthMenu": "Show _MENU_ entries",
            "sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
            "sInfoEmpty": "Showing 0 to 0 of 0 entries",
            "sInfoFiltered": "(filtered from _MAX_ total entries)",
            "sZeroRecords": "No matching records found",
            "sEmptyTable": "No data available in table",
            "oPaginate": {
                "sFirst": "First",
                "sPrevious": "Previous",
                "sNext": "Next",
                "sLast": "Last"
            }
        };
    }
}

// Export for use in other scripts
window.translateUI = translateUI;
window.getDataTablesLanguage = getDataTablesLanguage;

