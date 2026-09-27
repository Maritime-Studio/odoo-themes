import { _t } from "@web/core/l10n/translation";
import { localization } from "@web/core/l10n/localization";
import { Domain } from "@web/core/domain";
import { patch } from "@web/core/utils/patch";
import { GraphRenderer } from "@web/views/graph/graph_renderer";
import { mix, softenChartConfig, tokens } from "./soft_charts";

// A pie stays readable with a handful of slices: beyond this, the largest ones are
// kept and the rest are summed up in one "Other" slice (clicking it opens all of them).
const MAX_PIE_SLICES = 8;

/**
 * Largest slices first, the smallest ones grouped into "Other". Returns a copy: the
 * model's data is shared with the other chart modes and must stay untouched.
 */
function groupPieSlices(data) {
    const { labels, datasets } = data;
    const count = labels.length;
    if (count <= MAX_PIE_SLICES || !datasets.length) {
        return null;
    }
    const totals = labels.map((_, i) => datasets.reduce((sum, ds) => sum + (ds.data[i] || 0), 0));
    if (totals.some((value) => value < 0)) {
        return null; // mixed signs: Odoo shows its own warning
    }
    const order = [...labels.keys()].sort((a, b) => totals[b] - totals[a]);
    const kept = order.slice(0, MAX_PIE_SLICES - 1);
    const rest = order.slice(MAX_PIE_SLICES - 1);
    const otherLabel = _t("Other");
    const pick = (array, fallback) => (array ? kept.map((i) => array[i]) : fallback);
    return {
        ...data,
        labels: [...kept.map((i) => labels[i]), otherLabel],
        datasets: datasets.map((ds) => {
            const grouped = {
                ...ds,
                data: [...pick(ds.data), rest.reduce((sum, i) => sum + (ds.data[i] || 0), 0)],
                trueLabels: [...pick(ds.trueLabels, kept.map((i) => labels[i])), otherLabel],
            };
            if (ds.domains) {
                grouped.domains = [
                    ...pick(ds.domains),
                    Domain.or(rest.map((i) => ds.domains[i] || [])).toList(),
                ];
            }
            if (Array.isArray(ds.currencyIds)) {
                const currencies = new Set(rest.map((i) => ds.currencyIds[i]));
                grouped.currencyIds = [
                    ...pick(ds.currencyIds),
                    currencies.size === 1 ? [...currencies][0] : false,
                ];
            }
            return grouped;
        }),
    };
}

// Graph views of every app (Sales analysis, Invoicing reports...) use the same soft
// style and scheme palette as the dashboards.
patch(GraphRenderer.prototype, {
    getPieChartData() {
        const data = super.getPieChartData(...arguments);
        this.basPieData = groupPieSlices(data);
        return this.basPieData || data;
    },
    getTooltipOptions() {
        const options = super.getTooltipOptions(...arguments);
        if (this.model.metaData.mode === "pie" && this.basPieData) {
            // tooltips read the (grouped) data actually drawn
            options.external = this.customTooltip.bind(this, this.basPieData, this.model.metaData);
        }
        return options;
    },
    getChartConfig() {
        this.basPieData = null;
        const config = softenChartConfig(super.getChartConfig(...arguments));
        if (config.type === "pie" && this.basPieData) {
            // the "Other" slice is neutral grey
            const t = tokens();
            for (const dataset of config.data.datasets) {
                if (Array.isArray(dataset.backgroundColor)) {
                    const colors = dataset.backgroundColor.slice(0, config.data.labels.length);
                    colors[colors.length - 1] = mix(t.border, t.muted, 0.35);
                    dataset.backgroundColor = colors;
                    dataset.hoverBackgroundColor = colors;
                }
            }
        }
        if (config.type === "pie") {
            // legend on the side, names always readable
            const legend = config.options.plugins?.legend;
            if (legend?.labels) {
                // share of each slice next to its name
                const generate = legend.labels.generateLabels;
                if (generate) {
                    legend.labels.generateLabels = (chart) => {
                        const values = chart.data.datasets[0]?.data || [];
                        const total = values.reduce((sum, v) => sum + (v || 0), 0);
                        return generate(chart).map((item) => {
                            const value = values[item.index];
                            if (!total || value === undefined) {
                                return item;
                            }
                            const share = `${String(Math.round((value * 1000) / total) / 10).replace(".", localization.decimalPoint)}%`;
                            return { ...item, text: `${item.text} · ${share}`, fullText: `${item.fullText} · ${share}` };
                        });
                    };
                }
                legend.labels.boxWidth = 10;
                legend.labels.boxHeight = 10;
                legend.labels.padding = 12;
            }
        }
        return config;
    },
});
