// Mobile menu toggle functionality
// This plugin adds client-side JavaScript to toggle the mobile menu

import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    nuxtApp.hook('app:mounted', () => {
      const menuButton = document.getElementById('mobile-menu-button')
      const mobileMenu = document.getElementById('mobile-menu')
      
      if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
          // Toggle the 'hidden' class on the mobile menu
          mobileMenu.classList.toggle('hidden')
        })
      }
    })
  }
})