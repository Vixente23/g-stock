import { Workbox } from 'workbox-window'

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js')

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // Nouveau contenu disponible, recharger la page
        if (confirm('Une nouvelle version est disponible. Recharger maintenant ?')) {
          window.location.reload()
        }
      }
    })

    wb.register()
  }
}

export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://')
}

export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window
}