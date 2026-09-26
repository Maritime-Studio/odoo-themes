import { Component, useState } from "@odoo/owl";
import { useBus, useService } from "@web/core/utils/hooks";
import { HIDDEN_APPS, LAST_APPS, iconFor, matchXmlid } from "./sidebar_config";

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
        this.state = useState(this.openWindows.state);
        useBus(this.env.bus, "MENUS:APP-CHANGED", () => this.render());
    }

    get apps() {
        const apps = this.menuService
            .getApps()
            .filter((app) => matchXmlid(app.xmlid, HIDDEN_APPS) === -1);
        const rank = (app) => {
            const index = matchXmlid(app.xmlid, LAST_APPS);
            return index === -1 ? -1 : index;
        };
        // stable sort: regular apps keep the menu sequence, LAST_APPS go to the end
        return apps
            .map((app, index) => ({ app, index }))
            .sort((a, b) => rank(a.app) - rank(b.app) || a.index - b.index)
            .map(({ app }) => app);
    }

    get currentAppId() {
        return this.menuService.getCurrentApp()?.id;
    }

    iconFor(app) {
        return iconFor(app.xmlid);
    }

    appHref(app) {
        return `/odoo/${app.actionPath || "action-" + app.actionID}`;
    }

    onAppClick(app) {
        this.menuService.selectMenu(app);
    }

    closeWindow(item) {
        this.openWindows.close(item.url);
    }
}
