# odoo-themes

Custom themes for Odoo 19.

## backend_theme_bas

Complete backend (web client) theme for Odoo 19 with a 1C / BAS-like layout, replacing app
launchers such as `home_theme`:

- left **sections panel**, **open windows** list and a **start page** with every section's commands;
- BAS habits: row numbers in lists, always-framed inputs, smart buttons shown as links;
- every view type styled: lists, forms, kanban, calendar, pivot/graph, discuss, settings, dialogs.

### Dashboards

Spreadsheet dashboards follow the active scheme (loaded in the lazy `spreadsheet.o_spreadsheet`
bundle, so the theme still only depends on `web`): Odoo's stock dashboard colours are mapped to
the scheme, series use the scheme's validated chart palette (`--t-chart-1..6`) and charts are drawn
in a soft style (smooth lines with a fading fill, rounded bars, dashed light grid, round legend
markers, rounded cards with a soft shadow). Stored dashboards are not modified.

### Colour schemes

Chosen by an administrator in **Settings > Theme** (applies to every user):

| Scheme | Look |
|---|---|
| BAS Classic | light 1C look: grey panels, flat white pages, yellow default button, Arial |
| BAS Steel | steel-blue canvas with grain, dark steel top bar, white sheets, yellow default button |
| Maritime.Studio | Navy panels, Maritime Teal accents, rounded cards, Exo 2 / Open Sans (self-hosted) |

A scheme is a pair of `ir.asset` records (Odoo SCSS variables + CSS `--t-*` tokens,
`static/src/schemes/`); the settings page activates one pair. Components only read the tokens,
so adding a scheme means adding two files and two records.

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
