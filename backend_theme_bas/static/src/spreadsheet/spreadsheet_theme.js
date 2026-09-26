import { registries } from "@odoo/o-spreadsheet";
import { patch } from "@web/core/utils/patch";

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

// ---------------------------------------------------------------------------
// Scheme tokens
// ---------------------------------------------------------------------------

let tokenCache = null;
let tokenCacheTime = 0;

function tokens() {
    // re-read at most once a second (the scheme only changes with a page reload)
    const now = Date.now();
    if (tokenCache && now - tokenCacheTime < 1000) {
        return tokenCache;
    }
    const css = getComputedStyle(document.documentElement);
    const get = (name, fallback) => css.getPropertyValue(`--t-${name}`).trim() || fallback;
    tokenCache = {
        series: [1, 2, 3, 4, 5, 6].map((i) => get(`chart-${i}`, "#3860ac")),
        up: get("chart-up", "#2f9e5b"),
        down: get("chart-down", "#d0474b"),
        ink: get("ink", "#1e2b4a"),
        muted: get("muted", "#5b6b8c"),
        heading: get("heading", "#254284"),
        surface: get("surface", "#ffffff"),
        surfaceAlt: get("surface-alt", "#f3f6fb"),
        border: get("border-light", "#e2e8f1"),
        font: get("font-body", "Arial, sans-serif"),
    };
    tokenCacheTime = now;
    return tokenCache;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function toRgb(color) {
    if (typeof color !== "string") {
        return null;
    }
    const hex = color.trim().replace("#", "");
    if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
        return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    }
    if (/^[0-9a-f]{3}$/i.test(hex)) {
        return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
    }
    const m = color.match(/rgba?\(([^)]+)\)/i);
    return m ? m[1].split(",").slice(0, 3).map((v) => parseFloat(v)) : null;
}

function toHex(rgb) {
    return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function luminance(rgb) {
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
}

function saturation(rgb) {
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    return max === 0 ? 0 : (max - min) / max;
}

function hue(rgb) {
    const [r, g, b] = rgb.map((v) => v / 255);
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    if (!d) {
        return 0;
    }
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
}

function mix(color, other, weight) {
    const a = toRgb(color);
    const b = toRgb(other);
    if (!a || !b) {
        return color;
    }
    return toHex(a.map((v, i) => v * (1 - weight) + b[i] * weight));
}

function withAlpha(color, alpha) {
    const rgb = toRgb(color);
    return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

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

function fadingFill(color) {
    return (context) => {
        const { chart } = context;
        const area = chart.chartArea;
        if (!area) {
            return withAlpha(color, 0.2);
        }
        const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        gradient.addColorStop(0, withAlpha(color, 0.34));
        gradient.addColorStop(1, withAlpha(color, 0));
        return gradient;
    };
}

function isInk(value) {
    // a usable series colour: a string that is neither white nor fully transparent
    const rgb = toRgb(value);
    return rgb && luminance(rgb) < 0.97 && !/,\s*0(\.0+)?\s*\)$/.test(value);
}

function solidColor(dataset, kind) {
    // lines carry their colour in borderColor, bars in backgroundColor (their border is white)
    const order = kind === "line"
        ? [dataset.borderColor, dataset.backgroundColor]
        : [dataset.backgroundColor, dataset.borderColor];
    return order.find((value) => typeof value === "string" && isInk(value)) || null;
}

function styleDatasets(chart, t) {
    const type = chart.config.type;
    const datasets = chart.config.data?.datasets || [];
    const stacked = Object.values(chart.config.options?.scales || {}).some((scale) => scale?.stacked);
    datasets.forEach((dataset, index) => {
        const kind = dataset.type || type;
        if (kind === "pie" || kind === "doughnut") {
            if (Array.isArray(dataset.backgroundColor)) {
                dataset.backgroundColor = dataset.backgroundColor.map((c, i) => seriesColor(c, i));
            }
            dataset.borderColor = t.surface;
            dataset.borderWidth = 2;
            dataset.hoverOffset = 6;
            return;
        }
        if (dataset.xAxisID && String(dataset.xAxisID).includes("trend")) {
            return; // trend lines keep their dashed style
        }
        const color = seriesColor(solidColor(dataset, kind), index);
        if (kind === "line") {
            const fill = dataset.fill || (!stacked && datasets.length <= 3 ? "origin" : false);
            Object.assign(dataset, {
                borderColor: color,
                pointBackgroundColor: color,
                pointBorderColor: t.surface,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                borderWidth: 3,
                tension: 0.4,
                fill,
                backgroundColor: fill ? fadingFill(color) : color,
            });
        } else if (kind === "bar") {
            Object.assign(dataset, {
                backgroundColor: color,
                borderColor: color,
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: "start",
                maxBarThickness: 22,
            });
        }
    });
}

function styleOptions(chart, t) {
    const options = chart.config.options || (chart.config.options = {});
    const font = { family: t.font, size: 11 };
    for (const [id, scale] of Object.entries(options.scales || {})) {
        if (!scale || scale.display === false) {
            continue;
        }
        const isX = id.startsWith("x") || scale.axis === "x";
        scale.grid = {
            ...scale.grid,
            display: !isX,
            color: t.border,
            drawTicks: false,
        };
        scale.border = { ...scale.border, display: false, dash: [5, 5] };
        scale.ticks = { ...scale.ticks, color: t.muted, padding: 8, font: { ...scale.ticks?.font, ...font } };
        if (scale.title) {
            scale.title = { ...scale.title, color: t.muted, font: { ...scale.title.font, ...font } };
        }
    }
    const plugins = options.plugins || (options.plugins = {});
    if (plugins.title) {
        plugins.title = { ...plugins.title, color: t.heading, font: { ...plugins.title.font, family: t.font, weight: "600" } };
    }
    if (plugins.legend) {
        const labels = plugins.legend.labels || {};
        const generate = labels.generateLabels;
        plugins.legend.labels = {
            ...labels,
            color: t.muted,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 14,
            font: { ...labels.font, ...font, size: 12 },
            generateLabels: generate
                ? (c) =>
                      generate(c).map((item) => ({
                          ...item,
                          fillStyle: typeof item.fillStyle === "string" ? item.fillStyle : item.strokeStyle,
                          strokeStyle: typeof item.strokeStyle === "string" ? item.strokeStyle : undefined,
                          pointStyle: item.pointStyle === "line" && item.lineWidth === 3 ? "line" : "circle",
                      }))
                : labels.generateLabels,
        };
    }
    plugins.tooltip = {
        ...plugins.tooltip,
        backgroundColor: t.ink,
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        cornerRadius: 8,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
    };
}

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
    // only charts of spreadsheets / dashboards, not the graph views of the web client
    if (!chart.canvas?.closest?.(".o-spreadsheet")) {
        return;
    }
    const t = tokens();
    styleDatasets(chart, t);
    styleOptions(chart, t);
}

registries.chartJsExtensionRegistry.add("basSoftCharts", {
    register: (Chart) => Chart.register(softChartsPlugin),
    unregister: (Chart) => Chart.unregister(softChartsPlugin),
});
