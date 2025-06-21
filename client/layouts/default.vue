<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-dark text-white">
      <div class="container mx-auto px-4 py-2 flex justify-between items-center">
        <a class="text-white font-bold text-xl" href="/">
          <i class="fas fa-mountain"></i> Climbing Forecast
        </a>
        <div class="hidden md:block">
          <ul class="flex space-x-4">
            <li>
              <a class="text-white hover:text-gray-300" href="https://github.com/dsarich/climbing-forecast" target="_blank">
                <i class="fab fa-github"></i> GitHub
              </a>
            </li>
          </ul>
        </div>
        <button class="md:hidden text-white" id="mobile-menu-button">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      <!-- Mobile menu, show/hide based on menu state -->
      <div class="md:hidden hidden" id="mobile-menu">
        <ul class="px-4 pt-2 pb-3 space-y-1">
          <li>
            <a class="block text-white hover:text-gray-300 py-2" href="https://github.com/dsarich/climbing-forecast" target="_blank">
              <i class="fab fa-github"></i> GitHub
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <div class="flex-1">
      <NuxtPage />
    </div>

    <footer class="bg-dark text-white py-4 mt-8">
      <div class="container mx-auto text-center">
        <p>&copy; {{ new Date().getFullYear() }} Climbing Forecast. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Using script setup for Composition API
</script>
