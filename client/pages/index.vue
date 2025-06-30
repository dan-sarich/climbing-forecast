<template>
  <div class="container mx-auto px-4">
    <div class="welcome-container">
      <h1 class="welcome-title">Welcome to Climbing Forecast</h1>
      <p class="welcome-subtitle">
        Predict climbing conditions based on weather forecasts to plan your perfect climbing day.
      </p>
    </div>
    <div class="flex justify-center mt-4">
      <div class="w-full">
        <div class="alert-info mb-4">
          <i class="fas fa-info-circle text-accent"></i> Full weather dashboard coming soon!
        </div>

        <div v-if="data" class="bg-dark-card border border-dark-border rounded-lg shadow-md mb-4 overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-bold mb-2 text-dark-primary">Boulder, Colorado Weather Data</h2>
            <!-- D3 Charts for each chart_pairing -->
            <WeatherChart
              v-for="(chart, chartName) in data?.chart_pairing || []"
              :key="chartName"
              :chart-id="chartName"
              :chart-data="chart"
            />
          </div>
        </div>

        <div v-if="error" class="alert-error">
          <i class="fas fa-exclamation-circle text-red-500"></i> {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Using script setup for Composition API
useHead({
  title: 'Climbing Forecast - Welcome'
})

const { data, error } = useFetch('/api/weather/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lat: 40.0150,
    lng: -105.2705,
    imperial: true,
    utc_offset: -7
  })
})
</script>
