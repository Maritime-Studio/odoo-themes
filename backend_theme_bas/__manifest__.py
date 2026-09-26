{
    'name': 'BAS Backend Theme',
    'summary': 'Backend look & feel close to 1C BAS ("Taxi" interface) for an easy switch',
    'description': """
BAS Backend Theme
=================

Makes the Odoo 19 web client look and behave like the 1C / BAS "Taxi" interface:

* light top bar, left sections panel with monochrome icons and an "Open windows" panel;
* Arial 13px, dense layout, boxed inputs with an orange focus ring;
* yellow primary button, grey bordered secondary buttons, blue section titles;
* smart buttons rendered as a row of blue hyperlinks;
* boxed notebook tabs, grey list headers, light-orange selected row, row numbers;
* yellow hint boxes, blue dialog titles.

The module has no Python code and no dependency besides ``web``, so it can be
installed on any Odoo 19 database, including through *Apps > Import Module*.
""",
    'version': '19.0.1.0.0',
    'category': 'Hidden/Tools',
    'author': 'Maritime Studio',
    'license': 'LGPL-3',
    'depends': ['web'],
    'assets': {
        # web's variables use !default: the first definition wins, so load ours before web's file
        'web._assets_primary_variables': [
            ('before', 'web/static/src/scss/primary_variables.scss',
             'backend_theme_bas/static/src/scss/primary_variables.scss'),
        ],
        'web.assets_backend': [
            'backend_theme_bas/static/src/scss/bas_base.scss',
            'backend_theme_bas/static/src/scss/bas_navbar.scss',
            'backend_theme_bas/static/src/scss/bas_buttons.scss',
            'backend_theme_bas/static/src/scss/bas_fields.scss',
            'backend_theme_bas/static/src/scss/bas_form.scss',
            'backend_theme_bas/static/src/scss/bas_list.scss',
            'backend_theme_bas/static/src/scss/bas_misc.scss',
            'backend_theme_bas/static/src/scss/bas_canvas.scss',
            'backend_theme_bas/static/src/sidebar/sidebar_config.js',
            'backend_theme_bas/static/src/sidebar/open_windows_service.js',
            'backend_theme_bas/static/src/sidebar/sidebar.js',
            'backend_theme_bas/static/src/sidebar/sidebar.xml',
            'backend_theme_bas/static/src/sidebar/sidebar.scss',
            'backend_theme_bas/static/src/home/home.js',
            'backend_theme_bas/static/src/home/home.xml',
            'backend_theme_bas/static/src/home/home.scss',
            'backend_theme_bas/static/src/webclient/webclient_patch.js',
            'backend_theme_bas/static/src/webclient/webclient_patch.xml',
        ],
    },
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': False,
}
