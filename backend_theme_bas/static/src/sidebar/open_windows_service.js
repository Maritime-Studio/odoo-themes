import { reactive } from "@odoo/owl";
import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { HOME_ACTION, OPEN_WINDOWS_LIMIT } from "./sidebar_config";

const STORAGE_KEY = "backend_theme_bas.open_windows";
const COLLAPSED_KEY = "backend_theme_bas.sidebar_collapsed";

/**
 * Emulates the BAS "Open windows" panel: every list/record the user displays is kept
 * in a per-tab list (sessionStorage) and rendered in the sections panel. Entries are
 * plain /odoo URLs, so clicking one goes through the web client router (no reload).
 */
export const openWindowsService = {
    dependencies: ["action"],
    start(env, { action }) {
        // Sections panel: docked (pushes the content) on wide screens, where the user
        // can hide it to get the full width; a drawer over the content below
        // OVERLAY_WIDTH, hidden until the hamburger is clicked.
        const OVERLAY_WIDTH = 1440;
        const state = reactive({
            items: load(),
            current: "",
            overlay: browser.innerWidth < OVERLAY_WIDTH,
            hidden: false,
        });
        state.hidden = state.overlay ? true : storedHidden();

        function storedHidden() {
            try {
                return browser.localStorage.getItem(COLLAPSED_KEY) === "1";
            } catch {
                return false;
            }
        }
        let resizeTimeout;
        browser.addEventListener("resize", () => {
            browser.clearTimeout(resizeTimeout);
            resizeTimeout = browser.setTimeout(() => {
                const overlay = browser.innerWidth < OVERLAY_WIDTH;
                if (overlay !== state.overlay) {
                    state.overlay = overlay;
                    state.hidden = overlay ? true : storedHidden();
                }
            }, 150);
        });
        function load() {
            try {
                return JSON.parse(browser.sessionStorage.getItem(STORAGE_KEY)) || [];
            } catch {
                return [];
            }
        }
        function save() {
            try {
                browser.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
            } catch {
                // storage unavailable (private mode): the panel simply is not persisted
            }
        }

        function capture() {
            const controller = action.currentController;
            const url = browser.location.pathname + browser.location.search;
            if (!controller || !url.startsWith("/odoo") || url === "/odoo") {
                return;
            }
            // skip unsaved records and dialogs-only actions
            if (
                /\/new(\?|$)/.test(url) ||
                controller.action?.target === "new" ||
                controller.action?.tag === HOME_ACTION
            ) {
                return;
            }
            const title = (controller.displayName || controller.action?.name || "").toString().trim();
            if (!title) {
                return;
            }
            state.current = url;
            const existing = state.items.find((item) => item.url === url);
            if (existing) {
                existing.title = title;
            } else {
                state.items.push({ url, title });
                if (state.items.length > OPEN_WINDOWS_LIMIT) {
                    state.items.splice(0, state.items.length - OPEN_WINDOWS_LIMIT);
                }
            }
            save();
        }

        let timeout;
        function scheduleCapture() {
            // the URL and the display name are updated slightly after the UI
            browser.clearTimeout(timeout);
            timeout = browser.setTimeout(capture, 400);
        }
        env.bus.addEventListener("ACTION_MANAGER:UI-UPDATED", scheduleCapture);
        const titleEl = document.querySelector("head > title");
        if (titleEl) {
            new MutationObserver(scheduleCapture).observe(titleEl, { childList: true });
        }

        return {
            state,
            close(url) {
                const index = state.items.findIndex((item) => item.url === url);
                if (index !== -1) {
                    state.items.splice(index, 1);
                    save();
                }
            },
            toggleCollapsed() {
                state.hidden = !state.hidden;
                if (state.overlay) {
                    return; // drawer: nothing changes under it, nothing to remember
                }
                try {
                    browser.localStorage.setItem(COLLAPSED_KEY, state.hidden ? "1" : "0");
                } catch {
                    // not persisted
                }
                // the action area changed width: let forms re-decide the chatter position
                browser.setTimeout(() => browser.dispatchEvent(new Event("resize")), 60);
            },
            closeDrawer() {
                if (state.overlay) {
                    state.hidden = true;
                }
            },
            clear() {
                state.items.splice(0);
                save();
            },
        };
    },
};

registry.category("services").add("bas_open_windows", openWindowsService);
