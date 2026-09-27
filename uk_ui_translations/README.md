# Ukrainian UI Translations (supplement) — Odoo 19

The official Ukrainian translation of Odoo 19 leaves many interface texts in
English: spreadsheet dashboards (Monthly Sales, Top Quotations, since last
period...) are not translated at all, and Inventory, Point of Sale, Sales,
Website, Discuss and Settings have hundreds of gaps each.

This module ships the missing translations, one `i18n_extra/<module>/uk.po`
per standard module, and plugs them into Odoo's own translation loading:

* texts of Python / JavaScript code and dashboards: read from these files next
  to the module's official `uk.po`;
* texts stored in the database (views, menus, fields, dashboard names): loaded
  on installation, and again on every module update or *Settings > Languages >
  Update* of the terms.

Existing translations are never replaced — only strings the official files
leave empty are filled.

## Installation

The module contains Python code, so it cannot be uploaded through
*Apps > Import Module*:

1. copy the `uk_ui_translations` folder into a directory of the server's
   `addons_path` (e.g. `/mnt/extra-addons` or the custom addons folder);
2. restart Odoo (`sudo systemctl restart odoo`);
3. *Apps > Update Apps List*, search "Ukrainian UI Translations", *Activate*;
4. restart Odoo once more, so that every worker reads the new code translations,
   and reload the browser page.

## Updating the translations

`tools/build_uk_translations.py` rebuilds the `.po` files from the `.pot` files
of an Odoo source tree and a JSON translation memory (see the script header).
