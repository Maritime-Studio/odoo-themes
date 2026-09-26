import { Component, onWillStart, useState } from "@odoo/owl";
import { browser } from "@web/core/browser/browser";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { DEFAULT_SCHEME, SCHEMES } from "./schemes_data";

// Scheme assets are recognised by their folder; paths start with "/" (see data/ir_asset.xml).
const SCHEME_FOLDER = "backend_theme_bas/static/src/schemes/";

/**
 * "Theme" settings page: pick one of the colour schemes. A scheme is a pair of
 * ir.asset records (Odoo variables + CSS tokens); applying one activates its pair,
 * deactivates the others and reloads so the regenerated bundles are used.
 */
export class BasThemeSettings extends Component {
    static template = "backend_theme_bas.ThemeSettings";
    static props = { ...standardActionServiceProps };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.schemes = SCHEMES;
        this.state = useState({ current: null, selected: null, saving: false });
        onWillStart(() => this.load());
    }

    async load() {
        this.assets = await this.orm.searchRead(
            "ir.asset",
            [["path", "like", SCHEME_FOLDER]],
            ["path", "active"],
            { context: { active_test: false } }
        );
        const active = this.assets.find((asset) => asset.active && !asset.path.endsWith("_variables.scss"));
        const key = active ? this.schemeOf(active) : null;
        this.state.current = key;
        this.state.selected = key || DEFAULT_SCHEME;
    }

    schemeOf(asset) {
        return asset.path.split("/").pop().replace("_variables.scss", "").replace(".scss", "");
    }

    previewStyle(scheme, part) {
        const p = scheme.preview;
        switch (part) {
            case "frame":
                return `background:${p.canvas};`;
            case "navbar":
                return `background:${p.navbar};color:${p.navbarText};`;
            case "sidebar":
                return `background:${p.sidebar};border-right:1px solid ${p.sidebarBorder};color:${p.sidebarText};`;
            case "marker":
                return `box-shadow:inset 3px 0 0 ${p.marker};`;
            case "card":
                return `background:${p.card};border:1px solid ${p.cardBorder};border-radius:${p.radius};`;
            case "line":
                return `background:${p.line};`;
            case "title":
                return `background:${p.title};`;
            case "button":
                return `background:${p.primary};color:${p.primaryText};border:1px solid ${p.primaryBorder};border-radius:${p.radius};`;
        }
        return "";
    }

    select(key) {
        this.state.selected = key;
    }

    async apply() {
        if (!this.state.selected || this.state.selected === this.state.current) {
            return;
        }
        this.state.saving = true;
        const on = this.assets.filter((a) => this.schemeOf(a) === this.state.selected).map((a) => a.id);
        const off = this.assets.filter((a) => this.schemeOf(a) !== this.state.selected).map((a) => a.id);
        try {
            if (off.length) {
                await this.orm.write("ir.asset", off, { active: false });
            }
            await this.orm.write("ir.asset", on, { active: true });
        } catch (error) {
            this.state.saving = false;
            throw error;
        }
        this.notification.add(_t("Colour scheme applied, reloading…"), { type: "success" });
        browser.location.reload();
    }
}

registry.category("actions").add("bas_theme_settings", BasThemeSettings);
