import { useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { patch } from "@web/core/utils/patch";
import { NavBar } from "@web/webclient/navbar/navbar";
import { WebClient } from "@web/webclient/webclient";
import { BasSidebar } from "../sidebar/sidebar";
import { HOME_ACTION } from "../sidebar/sidebar_config";

WebClient.components = { ...WebClient.components, BasSidebar };

patch(WebClient.prototype, {
    // /odoo without an action opens the BAS start page instead of the first app
    _loadDefaultApp() {
        return this.actionService.doAction(HOME_ACTION, { clearBreadcrumbs: true });
    },
});

patch(NavBar.prototype, {
    setup() {
        super.setup(...arguments);
        this.basOpenWindows = useService("bas_open_windows");
        this.basResponsive = useService("bas_responsive");
        this.basLayout = useState(this.basResponsive.state);
    },
    get currentApp() {
        if (this.actionService.currentController?.action?.tag === HOME_ACTION) {
            return undefined;
        }
        return super.currentApp;
    },
    get currentAppSections() {
        if (this.actionService.currentController?.action?.tag === HOME_ACTION) {
            return [];
        }
        return super.currentAppSections;
    },
    onBasToggleChatter() {
        this.basResponsive.toggleChatter();
    },
    onBasToggleSidebar() {
        this.basOpenWindows.toggleCollapsed();
    },
});
