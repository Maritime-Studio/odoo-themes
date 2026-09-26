import { Component, onMounted, onWillUnmount, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { HOME_ACTION, iconFor, menuHref, visibleApps } from "../sidebar/sidebar_config";

/**
 * BAS start page ("Початкова сторінка"): every section with its commands as
 * hyperlinks (the BAS "functions panel"), plus the recently opened windows.
 * Replaces the default "open the first app" behaviour of the web client.
 */
export class BasHome extends Component {
    static template = "backend_theme_bas.Home";
    static props = { ...standardActionServiceProps };

    setup() {
        this.menuService = useService("menu");
        this.openWindows = useService("bas_open_windows");
        this.windows = useState(this.openWindows.state);
        // the top bar shows no app while the start page is displayed
        onMounted(() => this.env.bus.trigger("MENUS:APP-CHANGED"));
        onWillUnmount(() => this.env.bus.trigger("MENUS:APP-CHANGED"));
    }

    get sections() {
        return visibleApps(this.menuService).map((app) => {
            const tree = this.menuService.getMenuAsTree(app.id);
            const groups = [];
            const loose = [];
            for (const child of tree.childrenTree) {
                const links = this.collectLinks(child);
                if (child.childrenTree.length) {
                    if (links.length) {
                        groups.push({ id: child.id, name: child.name, links });
                    }
                } else if (child.actionID) {
                    loose.push(child);
                }
            }
            if (loose.length) {
                groups.unshift({ id: `${app.id}_main`, name: "", links: loose });
            }
            return { app, icon: iconFor(app.xmlid), groups };
        });
    }

    collectLinks(menu) {
        const links = [];
        for (const child of menu.childrenTree) {
            if (child.actionID) {
                links.push(child);
            }
            if (child.childrenTree.length) {
                links.push(...this.collectLinks(child));
            }
        }
        return links;
    }

    get recentWindows() {
        return [...this.windows.items].reverse();
    }

    href(menu) {
        return menuHref(menu);
    }

    openMenu(menu) {
        this.menuService.selectMenu(menu);
    }
}

registry.category("actions").add(HOME_ACTION, BasHome);

