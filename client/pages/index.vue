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
        <div v-if="data" class="bg-dark-card border border-dark-border rounded-lg shadow-md mb-4 overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-bold mb-4 text-dark-primary">Boulder, Colorado Weather Data</h2>

            <!-- Day Tabs -->
            <div class="flex space-x-2 mb-6">
              <button
                v-for="(day, index) in days"
                :key="day.label"
                class="px-3 py-1 rounded focus:outline-none"
                :class="index === activeDay ? 'bg-accent text-white' : 'bg-dark-lighter text-dark-primary'"
                @click="activeDay = index"
              >
                {{ day.label }}
              </button>
            </div>

            <!-- Climbing Fun Chart -->
            <WeatherChart
              v-if="funChart"
              :chart-id="`fun_chart_${activeDay}`"
              :chart-data="funChart"
            />

            <!-- Other Charts -->
            <div class="grid gap-6 md:grid-cols-2">
              <WeatherChart
                v-for="chart in otherCharts"
                :key="`${chart.id}_${activeDay}`"
                :chart-id="`${chart.id}_${activeDay}`"
                :chart-data="chart"
              />
            </div>
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
import { ref, computed } from 'vue'
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

const activeDay = ref(0)

const days = computed(() => {
  if (!data.value) return []
  const uniqueDays: { label: string; indices: number[] }[] = []
  const dayValues = data.value.time.day
  const months = data.value.time.month
  const locals = data.value.time.local

  const dayMap: Record<string, number[]> = {}
  dayValues.forEach((d, i) => {
    const key = `${months[i]}-${d}`
    if (!dayMap[key]) dayMap[key] = []
    dayMap[key].push(i)
  })

  return Object.keys(dayMap).map(key => {
    const idxs = dayMap[key]
    const label = new Date(locals[idxs[0]]).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    })
    return { label, indices: idxs }
  })
})

const dayCharts = computed(() => {
  if (!data.value) return []
  const day = days.value[activeDay.value]
  if (!day) return []
  return data.value.charts.map(c => ({
    ...c,
    labels: day.indices.map(i => c.labels[i]),
    rows: c.rows.map(row => day.indices.map(i => row[i]))
  }))
})

const funChart = computed(() => dayCharts.value.find(c => c.id === 'fun_chart'))
const otherCharts = computed(() => dayCharts.value.filter(c => c.id !== 'fun_chart'))
</script>
