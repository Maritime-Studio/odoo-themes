import { useService } from "@web/core/utils/hooks";
import { patch } from "@web/core/utils/patch";
import { NavBar } from "@web/webclient/navbar/navbar";
import { WebClient } from "@web/webclient/webclient";
import { BasSidebar } from "../sidebar/sidebar";

WebClient.components = { ...WebClient.components, BasSidebar };

patch(NavBar.prototype, {
    setup() {
        super.setup(...arguments);
        this.basOpenWindows = useService("bas_open_windows");
    },
    onBasToggleSidebar() {
        this.basOpenWindows.toggleCollapsed();
    },
});
