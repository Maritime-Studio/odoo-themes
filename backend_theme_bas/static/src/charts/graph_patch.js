import { patch } from "@web/core/utils/patch";
import { GraphRenderer } from "@web/views/graph/graph_renderer";
import { softenChartConfig } from "./soft_charts";

// Graph views of every app (Sales analysis, Invoicing reports...) use the same soft
// style and scheme palette as the dashboards.
patch(GraphRenderer.prototype, {
    getChartConfig() {
        return softenChartConfig(super.getChartConfig(...arguments));
    },
});
