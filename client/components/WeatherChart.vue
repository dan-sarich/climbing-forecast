<template>
  <div class="mb-6">
    <h3 class="text-lg font-semibold mb-2 text-center text-dark-primary">{{ chartData.title }}</h3>
    <div 
      :id="chartId" 
      class="w-full overflow-hidden bg-dark-card border border-dark-border rounded-lg shadow-sm"
      style="height: 400px"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineProps } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  chartId: {
    type: String,
    required: true
  },
  chartData: {
    type: Object,
    required: true
  }
});

// Function to create D3 chart
const createD3Chart = () => {
  // Clear any existing chart
  d3.select(`#${props.chartId}`).html('');

  // Set dimensions and margins
  const margin = { top: 20, right: 30, bottom: 80, left: 60 };
  const container = document.getElementById(props.chartId);
  const width = (container?.clientWidth || 0) - margin.left - margin.right;
  const height = (container?.clientHeight || 0) - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(`#${props.chartId}`)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Parse dates for x-axis using native Date to handle any ISO string
  const dates = props.chartData.labels.map(d => new Date(d));

  // Set x scale
  const x = d3.scaleTime()
    .domain(d3.extent(dates))
    .range([0, width]);

  // Set y scale using extent with padding so all values are visible
  const allValues = props.chartData.rows.flat();
  const [minValue, maxValue] = d3.extent(allValues);
  const padding = (maxValue - minValue) * 0.1;
  const y = d3.scaleLinear()
    .domain([minValue - padding, maxValue + padding])
    .range([height, 0]);

  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .attr('class', 'text-dark-secondary')
    .call(d3.axisBottom(x)
      .ticks(Math.min(dates.length, 8))
      .tickFormat(d3.timeFormat('%m/%d %H:%M')))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')
    .style('fill', '#9E9E9E'); // Dark mode text color

  // Add Y axis
  svg.append('g')
    .attr('class', 'text-dark-secondary')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('fill', '#9E9E9E'); // Dark mode text color

  // Style axis lines
  svg.selectAll('.domain')
    .style('stroke', '#444444'); // Dark mode border color
  svg.selectAll('.tick line')
    .style('stroke', '#444444'); // Dark mode border color

  // Add X axis label
  svg.append('text')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 5})`)
    .attr('class', 'text-sm text-dark-secondary')
    .style('text-anchor', 'middle')
    .style('fill', '#9E9E9E') // Dark mode text color
    .text(props.chartData.axis_labels.xAxis || 'Time');

  // Add Y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .attr('class', 'text-sm text-dark-secondary')
    .style('text-anchor', 'middle')
    .style('fill', '#9E9E9E') // Dark mode text color
    .text(props.chartData.axis_labels.yAxis);

  // Define color scale with modern blue accent
  const colorPalette = ['#3B82F6', '#60A5FA', '#2563EB', '#1D4ED8', '#1E40AF'];
  const color = d3.scaleOrdinal(colorPalette);

  // Create line generator
  const line = d3.line()
    .x((d, i) => x(dates[i]))
    .y(d => y(d));

  // Add lines and points for each data series
  props.chartData.rows.forEach((dataPoints, i) => {
    svg.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', color(i))
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll(`circle.series-${i}`)
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('class', `series-${i}`)
      .attr('cx', (d, idx) => x(dates[idx]))
      .attr('cy', d => y(d))
      .attr('r', 2)
      .attr('fill', color(i));
  });

  // Add legend if needed
  if (props.chartData.show_legend !== 'none' && props.chartData.dataSet_labels.length > 1) {
    const legend = svg.append('g')
      .attr('class', 'text-xs text-dark-secondary')
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(props.chartData.dataSet_labels)
      .enter().append('g')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => color(i))
      .attr('stroke', '#444444')
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .style('fill', '#9E9E9E') // Dark mode text color
      .text(d => d);
  }
};

// Render chart on mount and when props change
onMounted(() => {
  createD3Chart();

  // Add window resize listener for responsiveness
  window.addEventListener('resize', createD3Chart);
});

// Clean up event listener on unmount
onUnmounted(() => {
  window.removeEventListener('resize', createD3Chart);
});

// Watch for changes in chart data
watch(() => props.chartData, createD3Chart, { deep: true });
</script>
