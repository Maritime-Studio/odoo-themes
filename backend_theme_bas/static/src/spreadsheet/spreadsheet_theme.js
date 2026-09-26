import { registries } from "@odoo/o-spreadsheet";
import { patch } from "@web/core/utils/patch";
import {
    hue,
    luminance,
    mix,
    saturation,
    softenChartConfig,
    toHex,
    toRgb,
    tokens,
} from "@backend_theme_bas/charts/soft_charts";

/**
 * Spreadsheet dashboards follow the active colour scheme of the theme.
 *
 * Loaded in the lazy "spreadsheet.o_spreadsheet" bundle (only when a dashboard or a
 * spreadsheet is opened) and only imports @odoo/o-spreadsheet, so the theme does not
 * depend on spreadsheet_dashboard. Nothing is written back: the stored dashboards
 * keep their colours, they are only displayed with the scheme's colours.
 *
 * - cell text / fills and data bars of dashboards: Odoo's stock dashboard colours
 *   (#434343 text, #01666B titles, pastel fills) are mapped to the scheme tokens;
 * - scorecards and chart backgrounds: mapped to the scheme surfaces and up/down colours;
 * - Chart.js charts: series from o-spreadsheet's stock palette are mapped to the
 *   scheme's chart palette (--t-chart-1..6) and drawn in a soft style (smooth lines
 *   with a fading fill, rounded bars, dashed light grid, round legend markers).
 */

// o-spreadsheet stock chart palette, in the order its ColorGenerator hands colours out
// (small palette first, then the larger ones). A series using one of these colours
// gets the scheme colour with the same rank; custom colours are kept.
const STOCK_SERIES = [
    "#4EA7F2", "#EA6175", "#43C5B1", "#F4A261", "#8481DD", "#FFD86D",
    "#3188E6", "#00A78D", "#CE4257", "#F48935", "#5752D1", "#FFBC2C",
    "#056BD9", "#A76DBC", "#7F4295", "#6D2387", "#982738", "#0E8270",
    "#BE5D10", "#3A3580", "#A4A8B6", "#7E8290", "#545B70", "#C08A16",
    "#155193", "#4F1565", "#791B29", "#105F53", "#7D380D", "#26235F", "#3F4250", "#936A12",
];

function seriesColor(color, index) {
    const t = tokens();
    const rgb = toRgb(color);
    if (!rgb) {
        return t.series[index % t.series.length];
    }
    const stock = STOCK_SERIES.indexOf(toHex(rgb).toUpperCase());
    return stock === -1 ? color : t.series[stock % t.series.length];
}

// ---------------------------------------------------------------------------
// Dashboard cells, data bars, scorecards
// ---------------------------------------------------------------------------

function themedTextColor(color) {
    const rgb = toRgb(color);
    if (!rgb || luminance(rgb) > 0.45) {
        return color;
    }
    const t = tokens();
    // neutral dark greys (#434343, black) -> ink; dark saturated colours (#01666B titles) -> heading
    return saturation(rgb) < 0.2 ? t.ink : t.heading;
}

function themedFillColor(color) {
    const rgb = toRgb(color);
    if (!rgb || luminance(rgb) < 0.85) {
        return color;
    }
    return luminance(rgb) > 0.99 ? tokens().surface : tokens().surfaceAlt;
}

function themedStatusColor(color) {
    const rgb = toRgb(color);
    if (!rgb || saturation(rgb) < 0.25) {
        return color;
    }
    const h = hue(rgb);
    if (h >= 70 && h <= 175) {
        return tokens().up;
    }
    if (h <= 20 || h >= 330) {
        return tokens().down;
    }
    return color;
}

const styleCache = new WeakMap();

function themedStyle(style) {
    if (!style || (!style.textColor && !style.fillColor)) {
        return style;
    }
    let themed = styleCache.get(style);
    if (!themed) {
        themed = { ...style };
        if (style.textColor) {
            themed.textColor = themedTextColor(style.textColor);
        }
        if (style.fillColor) {
            themed.fillColor = themedFillColor(style.fillColor);
        }
        styleCache.set(style, themed);
    }
    return themed;
}

const dataBarColors = new Map();

function themedDataBar(dataBar) {
    if (!dataBar?.color) {
        return dataBar;
    }
    // each distinct data bar colour gets the next scheme series colour, very light
    if (!dataBarColors.has(dataBar.color)) {
        dataBarColors.set(dataBar.color, dataBarColors.size);
    }
    const t = tokens();
    const base = t.series[dataBarColors.get(dataBar.color) % t.series.length];
    return { ...dataBar, color: mix(base, t.surface, 0.8) };
}

const runtimeCache = new WeakMap();

function themedRuntime(runtime) {
    if (!runtime || typeof runtime !== "object") {
        return runtime;
    }
    let themed = runtimeCache.get(runtime);
    if (themed) {
        return themed;
    }
    const t = tokens();
    themed = { ...runtime };
    if (runtime.background) {
        themed.background = themedFillColor(runtime.background);
    }
    if ("keyValue" in runtime) {
        // scorecard
        themed.fontColor = t.ink;
        themed.baselineColor = runtime.baselineColor && themedStatusColor(runtime.baselineColor);
        themed.title = { ...runtime.title, color: t.muted };
        if (runtime.baselineStyle) {
            themed.baselineStyle = themedStyle(runtime.baselineStyle);
        }
        if (runtime.baselineDescrStyle?.textColor) {
            themed.baselineDescrStyle = {
                ...runtime.baselineDescrStyle,
                textColor: themedTextColor(runtime.baselineDescrStyle.textColor),
            };
        }
    }
    runtimeCache.set(runtime, themed);
    return themed;
}

function patchPlugin(registry, key, methods) {
    const Plugin = registry.contains(key) && registry.get(key);
    if (Plugin) {
        patch(Plugin.prototype, methods);
    }
}

patchPlugin(registries.statefulUIPluginRegistry, "cell_computed_style", {
    getCellComputedStyle(position) {
        const style = super.getCellComputedStyle(position);
        return this.getters.isDashboard() ? themedStyle(style) : style;
    },
});

patchPlugin(registries.coreViewsPluginRegistry, "evaluation_cf", {
    getConditionalDataBar(position) {
        const dataBar = super.getConditionalDataBar(position);
        return this.getters.isDashboard() ? themedDataBar(dataBar) : dataBar;
    },
});

patchPlugin(registries.coreViewsPluginRegistry, "evaluation_chart", {
    getChartRuntime(chartId) {
        const runtime = super.getChartRuntime(chartId);
        return this.getters.isDashboard() ? themedRuntime(runtime) : runtime;
    },
});

// ---------------------------------------------------------------------------
// Chart.js: soft style
// ---------------------------------------------------------------------------

const softChartsPlugin = {
    id: "basSoftCharts",
    beforeInit(chart) {
        applySoftStyle(chart);
    },
    beforeUpdate(chart) {
        applySoftStyle(chart);
    },
};

function applySoftStyle(chart) {
    // charts of spreadsheets / dashboards (graph views are styled by graph_patch.js)
    if (!chart.canvas?.closest?.(".o-spreadsheet")) {
        return;
    }
    softenChartConfig(chart.config, seriesColor);
}

registries.chartJsExtensionRegistry.add("basSoftCharts", {
    register: (Chart) => Chart.register(softChartsPlugin),
    unregister: (Chart) => Chart.unregister(softChartsPlugin),
});
