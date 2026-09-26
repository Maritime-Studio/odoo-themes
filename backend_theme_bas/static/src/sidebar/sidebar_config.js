/**
 * Sections panel configuration. Edit this file to adapt the panel to a database.
 *
 * Apps are matched by the xmlid of their root menu. A key ending with "." matches
 * every root menu of that module (e.g. "sale." matches "sale.sale_menu_root").
 */

// Monochrome Font Awesome 4 icons, like the BAS sections panel.
export const APP_ICONS = {
    "mail.menu_root_discuss": "fa-comments-o",
    "calendar.": "fa-calendar",
    "contacts.": "fa-address-book-o",
    "crm.": "fa-handshake-o",
    "sale.": "fa-line-chart",
    "l10n_ua_hr_salary.": "fa-money",
    "hr_payroll.": "fa-money",
    "spreadsheet_dashboard.": "fa-tachometer",
    "l10n_ua_marketplace_base.": "fa-shopping-bag",
    "point_of_sale.": "fa-calculator",
    "l10n_ua_bank_sync.": "fa-university",
    "l10n_ua_tax.": "fa-percent",
    "account.": "fa-book",
    "website.": "fa-globe",
    "purchase.": "fa-shopping-cart",
    "stock.": "fa-cubes",
    "mrp.": "fa-industry",
    "hr.": "fa-users",
    "fleet.": "fa-car",
    "hr_holidays.": "fa-plane",
    "project.": "fa-tasks",
    "hr_expense.": "fa-credit-card",
    "hr_attendance.": "fa-clock-o",
    "maintenance.": "fa-wrench",
    "utm.": "fa-link",
    "base.menu_management": "fa-th-large",
    "base.menu_administration": "fa-cog",
};
export const DEFAULT_ICON = "fa-folder-o";

// Apps pushed to the end of the panel, in this order.
export const LAST_APPS = ["l10n_ua_marketplace_base."];

// Apps never shown in the panel (still reachable through their URL / the command palette).
export const HIDDEN_APPS = [
    "l10n_ua_bank_sync.",
    "l10n_ua_tax.",
    "utm.",
    "base.menu_tests",
];

// Maximum number of entries kept in the "Open windows" panel.
export const OPEN_WINDOWS_LIMIT = 20;

export function matchXmlid(xmlid, keys) {
    if (!xmlid) {
        return -1;
    }
    return keys.findIndex((key) => (key.endsWith(".") ? xmlid.startsWith(key) : xmlid === key));
}

export function iconFor(xmlid) {
    const keys = Object.keys(APP_ICONS);
    const index = matchXmlid(xmlid, keys);
    return index === -1 ? DEFAULT_ICON : APP_ICONS[keys[index]];
}

/**
 * Apps shown in the sections panel and on the home page: hidden apps removed,
 * LAST_APPS moved to the end, everything else in menu sequence order.
 */
export function visibleApps(menuService) {
    const rank = (app) => matchXmlid(app.xmlid, LAST_APPS);
    return menuService
        .getApps()
        .filter((app) => matchXmlid(app.xmlid, HIDDEN_APPS) === -1)
        .map((app, index) => ({ app, index }))
        .sort((a, b) => rank(a.app) - rank(b.app) || a.index - b.index)
        .map(({ app }) => app);
}

export function menuHref(menu) {
    return `/odoo/${menu.actionPath || "action-" + menu.actionID}`;
}

// Client action tag of the BAS start page (no dot: the router would read it as a model).
export const HOME_ACTION = "bas_home";
