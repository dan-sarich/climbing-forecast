<template>
  <div class="container mx-auto px-4">
    <div class="welcome-container">
      <h1 class="welcome-title">Welcome to Climbing Forecast</h1>
      <p class="welcome-subtitle">
        Predict climbing conditions based on weather forecasts to plan your perfect climbing day.
      </p>
      <div class="flex justify-center">
        <div class="w-full md:w-2/3 lg:w-1/2">
          <div class="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            <div class="p-6">
              <p class="mb-4">
                This application helps climbers determine the best time to climb based on weather conditions.
                It analyzes temperature, wind, precipitation, and other factors to calculate a "climbing fun" percentage.
              </p>
              <p class="mb-4">
                The backend is powered by Nest.js, which processes weather data from OpenWeatherMap and applies
                climbing-specific algorithms to predict conditions.
              </p>
              <a class="inline-block bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded" href="/api/weather" target="_blank">
                <i class="fas fa-cloud-sun"></i> Check API
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center mt-4">
        <div class="w-full md:w-2/3 lg:w-1/2">
          <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
            <i class="fas fa-info-circle"></i> Full weather dashboard coming soon!
          </div>
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
</script>
