# Cápsula Volver al Futuro

Guarda hoy lo que querés abrir mañana.  
Crea cápsulas con **texto, fotos, audio o video**, elegí **fecha de apertura** y compartí por **QR/enlace** (incluido en el plan) o programá entrega por **WhatsApp/Email** (USD 1 por envío).

---

## 🚀 Funciones clave

- Crear cápsulas: título, mensaje, fecha/hora, pública o privada con PIN.  
- Adjuntos:
  - BYO storage por enlaces (Drive/S3/Dropbox/YouTube).  
  - Subida real (foto/audio/video) si configuras Firebase Storage.  
- Apertura: cofre animado, countdown, confeti al abrir.  
- Compartir:
  - Enlace + QR (incluido con el plan mensual).  
  - WhatsApp/Email (USD 1 por envío → mock).  
- Embebible en universidades/cursos: `embed.html?id=CAPSULA_ID`  
- Agenda: exporta `.ics` para Google/Apple Calendar.  

---

## ⚙️ Stack

- **Frontend**: HTML + JavaScript + Tailwind (CDN)  
- **Animaciones**: canvas-confetti  
- **QR**: qrcodejs  
- **Nube (opcional)**: Firebase Realtime Database + Storage  

---

## ☁️ Activar Firebase (opcional)

1. Crea un proyecto en Firebase → habilita **Realtime Database** + **Storage**.  
2. Abre el archivo `firebase-config.js` y completa tus claves:  

```js
window.FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  databaseURL: "https://TU_PROJECT.firebaseio.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "ID",
  appId: "APP_ID"
};
