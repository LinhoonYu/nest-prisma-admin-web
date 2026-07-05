<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, MapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GeoComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useResizeObserver } from "@vueuse/core";

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  MapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GeoComponent,
  VisualMapComponent,
]);

const props = defineProps<{
  options: echarts.EChartsCoreOption;
  width?: string;
  height?: string;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  if (props.options) {
    chartInstance.setOption(props.options);
  }
};

// 自适应
useResizeObserver(chartRef, () => {
  chartInstance?.resize();
});

// 更新配置
watch(
  () => props.options,
  (newOptions) => {
    if (chartInstance && newOptions) {
      chartInstance.setOption(newOptions, true);
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => initChart());
});

onBeforeUnmount(() => {
  chartInstance?.dispose();
  chartInstance = null;
});
</script>