<template>
  <div class="min-h-screen flex flex-col bg-dark">
    <nav class="bg-dark-lighter border-b border-dark-border">
      <div class="container mx-auto px-4 py-2 flex justify-between items-center">
        <a class="text-dark-primary font-bold text-xl" href="/">
          <i class="fas fa-mountain text-accent"></i> Climbing Forecast
        </a>
        <div class="hidden md:block">
          <ul class="flex space-x-4">
            <li>
              <a class="text-dark-primary hover:text-accent" href="https://github.com/dsarich/climbing-forecast" target="_blank">
                <i class="fab fa-github"></i> GitHub
              </a>
            </li>
          </ul>
        </div>
        <button class="md:hidden text-dark-primary" id="mobile-menu-button">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      <!-- Mobile menu, show/hide based on menu state -->
      <div class="md:hidden hidden" id="mobile-menu">
        <ul class="px-4 pt-2 pb-3 space-y-1">
          <li>
            <a class="block text-dark-primary hover:text-accent py-2" href="https://github.com/dsarich/climbing-forecast" target="_blank">
              <i class="fab fa-github"></i> GitHub
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <div class="flex-1">
      <NuxtPage />
    </div>

    <footer class="bg-dark-lighter border-t border-dark-border py-4 mt-8">
      <div class="container mx-auto text-center">
        <p class="text-dark-secondary">&copy; {{ new Date().getFullYear() }} Climbing Forecast. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Using script setup for Composition API
</script>
