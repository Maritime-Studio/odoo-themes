import { Component, useState } from "@odoo/owl";
import { useBus, useService } from "@web/core/utils/hooks";
import { HOME_ACTION, iconFor, menuHref, visibleApps } from "./sidebar_config";

/**
 * BAS sections panel: the apps as a vertical list with monochrome icons, followed by
 * the "Open windows" list fed by the bas_open_windows service.
 */
export class BasSidebar extends Component {
    static template = "backend_theme_bas.Sidebar";
    static props = {};

    setup() {
        this.menuService = useService("menu");
        this.openWindows = useService("bas_open_windows");
        this.actionService = useService("action");
        this.state = useState(this.openWindows.state);
        useBus(this.env.bus, "MENUS:APP-CHANGED", () => this.render());
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => this.render());
    }

    get apps() {
        return visibleApps(this.menuService);
    }

    get isHome() {
        return this.actionService.currentController?.action?.tag === HOME_ACTION;
    }

    get currentAppId() {
        return this.isHome ? undefined : this.menuService.getCurrentApp()?.id;
    }

    iconFor(app) {
        return iconFor(app.xmlid);
    }

    appHref(app) {
        return menuHref(app);
    }

    openHome() {
        this.actionService.doAction(HOME_ACTION, { clearBreadcrumbs: true });
        this.openWindows.closeDrawer();
    }

    onAppClick(app) {
        this.menuService.selectMenu(app);
        this.openWindows.closeDrawer();
    }

    get panelClass() {
        const { hidden, overlay } = this.state;
        return {
            o_bas_sidebar_hidden: hidden,
            o_bas_sidebar_overlay: overlay && !hidden,
            o_bas_sidebar_docked: !overlay && !hidden,
        };
    }

    closeWindow(item) {
        this.openWindows.close(item.url);
    }
}
