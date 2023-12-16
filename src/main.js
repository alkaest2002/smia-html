import Alpine from 'alpinejs'
import cards from './cards.js'
window.Alpine = Alpine
Alpine.data('cards', cards)
Alpine.start()