# odoo-themes

Custom themes for Odoo 19.

## backend_theme_bas

Backend (web client) theme that makes Odoo 19 look like the 1C / BAS "Taxi" interface,
so that users coming from BAS feel at home:

- light top bar with a hamburger, left **sections panel** with monochrome icons;
- **open windows** panel (recently opened lists and records, per browser tab);
- Arial 13px, boxed inputs with an orange focus frame, dropdown buttons;
- yellow primary button, grey bordered buttons, blue section titles;
- smart buttons shown as a row of blue hyperlinks;
- boxed tabs, lists with grey header, grid lines, row numbers and light-orange selection;
- yellow hint boxes, blue dialog titles, orange highlighted dropdown items.

No Python code, only depends on `web`: works on any Odoo 19 (Community or Enterprise)
and can be installed from a zip through *Apps > Import Module* (developer mode).

### Install

- From source: copy `backend_theme_bas` into an addons path, update the apps list, install.
- From zip: `zip -r backend_theme_bas.zip backend_theme_bas`, then *Apps > Import Module*.

### Configure the sections panel

Edit `backend_theme_bas/static/src/sidebar/sidebar_config.js`:

- `APP_ICONS` - Font Awesome icon per app (matched by root menu xmlid or module prefix);
- `LAST_APPS` - apps moved to the end of the panel;
- `HIDDEN_APPS` - apps not shown in the panel.
