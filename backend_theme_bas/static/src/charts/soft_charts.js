/**
 * Soft chart style shared by every chart of the web client (graph views and
 * spreadsheet dashboards): scheme palette (--t-chart-1..6), smooth lines with a
 * fading fill, rounded thin bars, dashed light horizontal grid, round legend
 * markers, dark rounded tooltip. Colours are read from the active scheme tokens.
 */

// ---------------------------------------------------------------------------
// Scheme tokens
// ---------------------------------------------------------------------------

let tokenCache = null;
let tokenCacheTime = 0;

export function tokens() {
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

export function toRgb(color) {
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

export function toHex(rgb) {
    return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function luminance(rgb) {
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
}

export function saturation(rgb) {
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    return max === 0 ? 0 : (max - min) / max;
}

export function hue(rgb) {
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

export function mix(color, other, weight) {
    const a = toRgb(color);
    const b = toRgb(other);
    if (!a || !b) {
        return color;
    }
    return toHex(a.map((v, i) => v * (1 - weight) + b[i] * weight));
}

export function withAlpha(color, alpha) {
    const rgb = toRgb(color);
    return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : color;
}

// ---------------------------------------------------------------------------
// Soft style
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

function styleDatasets(config, t, remap) {
    const type = config.type;
    const datasets = config.data?.datasets || [];
    const stacked = Object.values(config.options?.scales || {}).some((scale) => scale?.stacked);
    datasets.forEach((dataset, index) => {
        const kind = dataset.type || type;
        if (kind === "pie" || kind === "doughnut") {
            if (Array.isArray(dataset.backgroundColor)) {
                const n = t.series.length;
                // beyond the palette: lighter tints of it, never the same colour twice
                dataset.backgroundColor = dataset.backgroundColor.map((c, i) => {
                    const base = remap(c, i % n);
                    const level = Math.floor(i / n);
                    return level ? mix(base, t.surface, Math.min(0.3 * level, 0.6)) : base;
                });
                dataset.hoverBackgroundColor = dataset.backgroundColor;
            }
            dataset.borderColor = t.surface;
            dataset.borderWidth = 2;
            dataset.hoverOffset = 6;
            return;
        }
        if (dataset.xAxisID && String(dataset.xAxisID).includes("trend")) {
            return; // trend lines keep their dashed style
        }
        if (kind === "bar" && Array.isArray(dataset.backgroundColor)) {
            // one colour per bar (kanban dashboards: late / today / future / empty)
            const distinct = [];
            const colors = dataset.backgroundColor.map((c) => {
                if (!distinct.includes(c)) {
                    distinct.push(c);
                }
                return remap(c, distinct.indexOf(c));
            });
            Object.assign(dataset, {
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: "start",
                maxBarThickness: 22,
            });
            return;
        }
        const color = remap(solidColor(dataset, kind), index);
        if (kind === "line") {
            // a single line always gets the fading fill; several lines only when not stacked
            const fill =
                dataset.fill ||
                (datasets.length === 1 || (!stacked && datasets.length <= 3) ? "origin" : false);
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

// Legend marker: a round dot in the colour actually drawn (slice for pies, dataset
// otherwise) - the generators of Odoo / o-spreadsheet compute their own colours.
function legendMarker(chart, item) {
    const datasets = chart.data?.datasets || [];
    let color;
    const pieLike = ["pie", "doughnut", "polarArea"].includes(chart.config?.type);
    if (pieLike && item.index !== undefined) {
        const bg = datasets[0]?.backgroundColor;
        color = Array.isArray(bg) ? bg[item.index % bg.length] : bg;
    } else if (item.datasetIndex !== undefined && datasets[item.datasetIndex]) {
        const dataset = datasets[item.datasetIndex];
        color = [dataset.borderColor, dataset.backgroundColor].find((c) => typeof c === "string" && isInk(c));
    }
    if (typeof color !== "string") {
        color = typeof item.fillStyle === "string" ? item.fillStyle : item.strokeStyle;
    }
    const isTrendLine = item.pointStyle === "line" && item.lineWidth === 3;
    return {
        // Odoo picks the legend text colour from its own light / dark cookie, which
        // can be left on "dark" by another theme: always use the scheme's text colour
        fontColor: tokens().ink,
        fillStyle: color,
        strokeStyle: color,
        pointStyle: isTrendLine ? "line" : "circle",
        lineWidth: isTrendLine ? 3 : 0,
    };
}

function styleOptions(config, t) {
    const options = config.options || (config.options = {});
    if (["pie", "doughnut"].includes(config.type) && options.cutout === undefined) {
        options.cutout = "62%"; // rings, like the Soft UI charts (gauges keep theirs)
    }
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
                ? (c) => generate(c).map((item) => ({ ...item, ...legendMarker(c, item) }))
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

/**
 * Apply the soft style to a Chart.js config ({type, data, options}) in place.
 * @param {Object} config
 * @param {(color: string|null, index: number) => string} [remap] series colour for
 *        a dataset / slice; defaults to the scheme palette by position.
 */
const softened = new WeakSet();

export function softenChartConfig(config, remap) {
    softened.add(config);
    const t = tokens();
    const byIndex = (color, index) => t.series[index % t.series.length];
    styleDatasets(config, t, remap || byIndex);
    styleOptions(config, t);
    return config;
}

// ---------------------------------------------------------------------------
// Every other chart of the web client
// ---------------------------------------------------------------------------
// Kanban dashboards (Inventory overview, Accounting journals), gauges, forecast
// widgets... build their Chart.js configs themselves. A global Chart.js plugin gives
// them the same soft style; colours keep their meaning: red = late / negative,
// green = positive, grey = empty, anything else follows the scheme palette.

function semanticRemap(t) {
    const neutral = mix(t.border, t.muted, 0.15);
    // other colours take the palette in order, skipping reddish entries (red = late)
    const downHue = hue(toRgb(t.down) || [200, 60, 60]);
    const palette = t.series.filter((c) => {
        const d = Math.abs(hue(toRgb(c) || [0, 0, 0]) - downHue);
        return Math.min(d, 360 - d) > 25;
    });
    const assigned = new Map();
    return (color, index) => {
        const rgb = toRgb(color);
        if (rgb) {
            const sat = saturation(rgb);
            const h = hue(rgb);
            if (sat < 0.12) {
                return neutral;
            }
            if (sat > 0.35 && (h < 18 || h > 340)) {
                return t.down;
            }
            if (sat > 0.35 && h > 90 && h < 160) {
                return t.up;
            }
            if (!assigned.has(color)) {
                assigned.set(color, palette[assigned.size % palette.length]);
            }
            return assigned.get(color);
        }
        return palette[index % palette.length];
    };
}

const globalSoftPlugin = {
    id: "basSoftAll",
    beforeInit(chart) {
        const config = chart.config?._config;
        if (!config || softened.has(config)) {
            return; // graph views: already styled
        }
        if (chart.canvas?.closest?.(".o-spreadsheet, .o_spreadsheet_dashboard_action")) {
            return; // spreadsheets and dashboards have their own plugin
        }
        softenChartConfig(config, semanticRemap(tokens()));
    },
};

function registerGlobalPlugin(Chart) {
    try {
        Chart?.register?.(globalSoftPlugin);
    } catch {
        // never break a chart because of the theme
    }
}

// Chart.js is a lazily loaded UMD library that sets window.Chart. It is loaded more than
// once per page: web.chartjs_lib for the views, then again inside the spreadsheet bundle
// when a dashboard is opened, which replaces window.Chart with a fresh copy. The
// property stays an accessor so that every copy gets the plugin.
let currentChart = window.Chart;
registerGlobalPlugin(currentChart);
Object.defineProperty(window, "Chart", {
    configurable: true,
    enumerable: true,
    get() {
        return currentChart;
    },
    set(value) {
        currentChart = value;
        registerGlobalPlugin(value);
    },
});
