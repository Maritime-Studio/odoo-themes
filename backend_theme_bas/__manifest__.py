{
    'name': 'BAS Backend Theme',
    'summary': '1C BAS-like backend layout with six colour schemes, chosen in Settings > Theme',
    'description': """
BAS Backend Theme
=================

A complete backend theme for Odoo 19 that replaces app launchers such as
home_theme:

* six colour schemes, chosen in *Settings > Theme* (applies to all users):
  BAS Classic (light 1C look), BAS Steel (steel-blue canvas), Maritime.Studio
  (Navy + Maritime Teal, Exo 2), and the pastel Milk & Cocoa, Cloudy Grey and
  Navy & Sand;
* 1C BAS habits kept for accountants: left sections panel, "open windows"
  list, start page with every section's commands, row numbers in lists,
  always-framed inputs, smart buttons as a row of links;
* every view type styled: lists, forms, kanban, calendar, pivot/graph,
  discuss, settings, dialogs and dropdowns.

No Python code, depends only on ``web``: installable on any Odoo 19 database,
also through *Apps > Import Module*.
""",

    'version': '19.0.7.3.0',
    'category': 'Themes/Backend',
    'author': 'Maritime Studio',
    'license': 'LGPL-3',
    'depends': ['web'],
    'data': [
        'data/ir_asset.xml',
        'views/theme_settings.xml',
        'views/res_config_settings_views.xml',
    ],
    'assets': {
        # web's variables use !default: the first definition wins, so load ours before web's file
        'web._assets_primary_variables': [
            ('before', 'web/static/src/scss/primary_variables.scss',
             'backend_theme_bas/static/src/scss/primary_variables.scss'),
        ],
        'web.assets_backend': [
            'backend_theme_bas/static/src/scss/fonts.scss',
            'backend_theme_bas/static/src/scss/tokens_default.scss',
            'backend_theme_bas/static/src/scss/bas_base.scss',
            'backend_theme_bas/static/src/scss/bas_navbar.scss',
            'backend_theme_bas/static/src/scss/bas_buttons.scss',
            'backend_theme_bas/static/src/scss/bas_fields.scss',
            'backend_theme_bas/static/src/scss/bas_form.scss',
            'backend_theme_bas/static/src/scss/bas_list.scss',
            'backend_theme_bas/static/src/scss/bas_misc.scss',
            'backend_theme_bas/static/src/scss/bas_canvas.scss',
            'backend_theme_bas/static/src/scss/calendar.scss',
            'backend_theme_bas/static/src/scss/responsive.scss',
            'backend_theme_bas/static/src/layout/responsive_service.js',
            'backend_theme_bas/static/src/sidebar/sidebar_config.js',
            'backend_theme_bas/static/src/sidebar/open_windows_service.js',
            'backend_theme_bas/static/src/sidebar/sidebar.js',
            'backend_theme_bas/static/src/sidebar/sidebar.xml',
            'backend_theme_bas/static/src/sidebar/sidebar.scss',
            'backend_theme_bas/static/src/home/home.js',
            'backend_theme_bas/static/src/home/home.xml',
            'backend_theme_bas/static/src/home/home.scss',
            'backend_theme_bas/static/src/settings/schemes_data.js',
            'backend_theme_bas/static/src/settings/theme_settings.js',
            'backend_theme_bas/static/src/settings/theme_settings.xml',
            'backend_theme_bas/static/src/settings/theme_settings.scss',
            'backend_theme_bas/static/src/webclient/webclient_patch.js',
            'backend_theme_bas/static/src/webclient/webclient_patch.xml',
            'backend_theme_bas/static/src/spreadsheet/dashboard.scss',
            'backend_theme_bas/static/src/charts/soft_charts.js',
        ],
        # graph / pivot views are loaded lazily in Odoo 19
        'web.assets_backend_lazy': [
            'backend_theme_bas/static/src/charts/graph_patch.js',
        ],
        # lazy bundle of spreadsheets / dashboards: only loaded when one is opened,
        # so the theme does not depend on the spreadsheet modules
        'spreadsheet.o_spreadsheet': [
            'backend_theme_bas/static/src/spreadsheet/spreadsheet_theme.js',
        ],
    },
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': True,
}
