# Cápsula Volver al Futuro

Guarda hoy lo que querés abrir mañana. Crea cápsulas con **texto, fotos, audio o video**, elegí **fecha de apertura** y compartí por **QR/enlace** (incluido en el plan) o programá entrega por **WhatsApp/Email** (USD 1 por envío).

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
- HTML + JavaScript + Tailwind (CDN)
- Animaciones: canvas-confetti
- QR: qrcodejs
- Nube (opcional): Firebase Realtime Database + Storage

---

## ☁️ Activar Firebase (opcional)
1. Crea proyecto → habilita **Realtime Database** + **Storage**.
2. Rellena `firebase-config.js` con tus claves.

---

## 🧩 Integración académica
Usa en Moodle/Canvas/Google Classroom:

```html
<iframe src="embed.html?id=CAPSULA_ID" width="100%" height="520" frameborder="0"></iframe>
