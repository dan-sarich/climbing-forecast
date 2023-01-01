<template>
  <main class="grid w-1/2 mx-auto my-4 bg-slate-50 shadow-lg">
    <pre>
      {{ charts }}
    </pre>
  </main>
</template>

<script setup>
const { data: charts } = await useLazyFetch('/api/chart');
// const { data: weatherData } = await useFetch('http://localhost:5000/data', {
//   body: {"lat":40.0149856,"lng":-105.2705456,"imperial":true,"utc_offset":-420},
// });
</script>
