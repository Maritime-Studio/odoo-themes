import { reactive } from "@odoo/owl";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormRenderer } from "@web/views/form/form_renderer";

const CHATTER_KEY = "backend_theme_bas.chatter_position";

// Width of the action area (window minus the sections panel) needed to keep the
// chatter on the side: a readable sheet (~860px) + the narrowed chatter (~420px).
export const SIDE_CHATTER_MIN_WIDTH = 1280;

const SIDE_TO_BOTTOM = {
    SIDE_CHATTER: "BOTTOM_CHATTER",
    EXTERNAL_COMBO_XXL: "EXTERNAL_COMBO",
};

function actionAreaWidth() {
    const area = document.querySelector(".o_web_client > .o_action_manager");
    return area ? area.clientWidth : browser.innerWidth;
}

/**
 * Responsive layout of the theme:
 * - chatter position: Odoo (mail) puts the chatter on the side from the XXL breakpoint
 *   of the *window*, ignoring the sections panel; here the real width of the action
 *   area decides, and the user can force it below the form (toggle in the top bar);
 * - relayout of the forms when the sections panel is collapsed / expanded.
 *
 * The mail patch of FormRenderer is extended when this service starts, i.e. after
 * every module is loaded, so it always wraps mail's version (the theme does not
 * depend on mail; without mail nothing is patched).
 */
export const responsiveService = {
    start() {
        let stored = null;
        try {
            stored = browser.localStorage.getItem(CHATTER_KEY);
        } catch {
            // storage unavailable
        }
        const state = reactive({ chatterBelow: stored === "below" });

        if (FormRenderer.prototype.mailLayout) {
            patch(FormRenderer.prototype, {
                mailLayout() {
                    const layout = super.mailLayout(...arguments);
                    if (!(layout in SIDE_TO_BOTTOM)) {
                        return layout;
                    }
                    if (state.chatterBelow || actionAreaWidth() < SIDE_CHATTER_MIN_WIDTH) {
                        return SIDE_TO_BOTTOM[layout];
                    }
                    return layout;
                },
            });
        }

        function relayout() {
            // mail re-renders the form on window resize: reuse that path
            browser.setTimeout(() => browser.dispatchEvent(new Event("resize")), 60);
        }

        return {
            state,
            relayout,
            toggleChatter() {
                state.chatterBelow = !state.chatterBelow;
                try {
                    browser.localStorage.setItem(CHATTER_KEY, state.chatterBelow ? "below" : "side");
                } catch {
                    // not persisted
                }
                relayout();
            },
        };
    },
};

registry.category("services").add("bas_responsive", responsiveService);
