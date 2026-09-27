{
    'name': 'Ukrainian UI Translations (supplement)',
    'summary': 'Fills the gaps of the official Ukrainian translation: dashboards, '
               'Inventory, Point of Sale, Sales, Accounting, Website and more',
    'description': """
Ukrainian UI Translations (supplement)
======================================

The official Ukrainian translation of Odoo 19 leaves thousands of strings in
English (spreadsheet dashboards are not translated at all). This module ships
the missing translations, one ``i18n_extra/<module>/uk.po`` file per standard
module, and plugs them into Odoo's normal translation loading:

* interface texts of Python / JavaScript code and dashboards are read from these
  files next to the module's own ``uk.po``;
* texts stored in the database (views, menus, fields, dashboard names) are
  loaded on installation, and again whenever a module is updated or the
  language terms are reloaded.

Existing translations are never replaced: only strings the official files
leave empty are filled.

Needs Python: copy the folder into an ``addons_path`` directory of the server,
restart Odoo, then install it from Apps.
""",
    'version': '19.0.1.1.0',
    'category': 'Localization',
    'author': 'Maritime Studio',
    'license': 'LGPL-3',
    'depends': ['base'],
    'post_init_hook': 'post_init_hook',
    'installable': True,
    'application': False,
}
