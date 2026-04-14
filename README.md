# SIGCAV (Seguridad Vial Móvil) — Personal de Calle

## 📱 Descripción de la aplicación
Aplicación mobile desarrollada con **React Native + Expo + TypeScript** orientada a personal de calle para:
- Autenticación y sesión (JWT).
- Gestión de **actas** (alta/edición/listado).
- Registro/consulta de **hechos viales**.
- Captura de evidencia (fotos), **OCR** de documentación (licencia/cédula), **firma digital**, geolocalización y selección de punto en mapa (OpenStreetMap).
- Selección de impresora **Bluetooth** y envío de impresión (según configuración del dispositivo).

> Nota: Algunas funcionalidades usan módulos nativos (por ejemplo, Bluetooth). En esos casos puede requerirse **Development Build** (Expo Dev Client) y no funcionar en **Expo Go**.

---

## 🚀 Tecnologías utilizadas
- **Expo SDK** (ver `app.config.js`)
- **React Native**
- **TypeScript**
- UI/UX:
  - `react-native-paper` (Snackbars)
  - Componentes propios (`src/components/ui`)
- Device & Expo modules:
  - `expo-location` (geolocalización)
  - `expo-image-picker` (cámara/galería)
  - `expo-image-manipulator` (pre-procesamiento de imágenes para OCR)
  - `expo-secure-store` (storage seguro)
- WebView / mapas:
  - `react-native-webview` + Leaflet + OpenStreetMap
- Firma digital:
  - `@shopify/react-native-skia`
- Bluetooth (impresión):
  - `react-native-bluetooth-classic`
- Storage:
  - `@react-native-async-storage/async-storage`

---

## 📂 Estructura del proyecto
Estructura principal (resumen):

```text
.
├─ App.tsx
├─ app.config.js
├─ eas.json
├─ index.ts
├─ src/
│  ├─ api/                # cliente HTTP (fetch) y auth
│  ├─ auth/               # AuthContext, biometría, SecureStore
│  ├─ components/         # UI, media, mapa, firma, navbar, etc.
│  ├─ config/             # env / configuración runtime
│  ├─ features/           # tipos y modelos por feature
│  ├─ screens/            # pantallas (Login, Home, Actas, Hechos Viales, etc.)
│  ├─ services/           # servicios de negocio (Actas, OCR, Bluetooth, Juzgados, etc.)
│  ├─ theme/              # colores/estilos
│  ├─ types/              # tipos compartidos
│  └─ utils/              # helpers, mappers, snackbars
└─ assets/
```

Pantallas destacadas:
- `src/screens/LoginScreen.tsx`: login y enrolamiento biométrico.
- `src/screens/HomeScreen.tsx`: navegación principal (navbar) y acceso a módulos.
- `src/screens/NuevaActaScreen.tsx`: formulario completo de acta (mapa, firmas, OCR, etc.).
- `src/screens/MisActasScreen.tsx`: listado/edición de actas.

---

## ⚙️ Configuración

### Variables de entorno
Este proyecto usa variables públicas de Expo (prefijo `EXPO_PUBLIC_`).

Archivo de ejemplo: `.env.example`

Variables:
- `EXPO_PUBLIC_API_URL`: URL base del backend (la app normaliza a `.../api` si hace falta).
- `EXPO_PUBLIC_DEBUG_HTTP`: habilita logs de debug HTTP (si está implementado/activo).

Configuración rápida:
```bash
cp .env.example .env
```

Ejemplo:
```env
EXPO_PUBLIC_API_URL=https://mi-backend.ejemplo.com
EXPO_PUBLIC_DEBUG_HTTP=true
```

> Importante: si cambiás `.env`, reiniciá Expo con limpieza de cache si es necesario.

### Expo config
Configuración en `app.config.js` (nombre, slug, permisos, plugins, etc.).  
Perfiles de build en `eas.json` (preview/production).

---

## ▶️ Instalación y ejecución

### Requisitos
- Node.js (LTS recomendado)
- Android Studio (para emulador) o dispositivo físico
- Xcode (solo macOS, para iOS)
- Para USB en Android: `adb` disponible

### Instalar dependencias
```bash
npm install
```

### Ejecutar en desarrollo (Metro)
```bash
npm run start
```

### Ejecutar en Android
```bash
npm run android
```
Esto usa `expo run:android` (Development Build). Recomendado si vas a usar módulos nativos que no están en Expo Go.

### Ejecutar en iOS (macOS)
```bash
npm run ios
```

### Ejecutar en Expo Go (clave)
1. Instalá **Expo Go** en el dispositivo.
2. Levantá el proyecto:
   ```bash
   npm run start
   ```
3. Escaneá el QR desde Expo Go.

⚠️ Limitaciones de Expo Go:
- Funcionalidades con librerías nativas no incluidas en Expo Go (por ejemplo, Bluetooth con `react-native-bluetooth-classic`) pueden no funcionar.
- Si usás un **Development Build** (Dev Client), iniciá con:
  ```bash
  npx expo start --dev-client
  ```

Si el dispositivo no conecta al servidor (errores de timeout a `192.168.x.x`), probá:
```bash
npx expo start --tunnel
```

---

## 📦 Scripts disponibles
Definidos en `package.json`:
- `npm run start`: inicia Metro/Expo.
- `npm run android`: `expo run:android`.
- `npm run ios`: `expo run:ios`.
- `npm run web`: inicia Expo para web.

---

## 🔐 Autenticación
- Login contra backend con JWT (ver `src/api/auth.ts`).
- Estado de sesión centralizado en `src/auth/AuthContext.tsx`.
- Soporte de biometría y almacenamiento seguro (SecureStore) para “login diario” (ver `src/screens/LoginScreen.tsx` y `src/auth/*`).

---

## 📡 Consumo de API
- Cliente HTTP basado en `fetch` en `src/api/http.ts` (`getJson`, `postJson`, `putJson`, `postFormData`, etc.).
- Base URL se configura con `EXPO_PUBLIC_API_URL` y se normaliza a `.../api` (ver `src/config/env.ts`).
- Manejo centralizado de errores: muestra snackbars según status HTTP.

Servicios (ejemplos):
- `src/services/ActaService.ts`
- `src/services/OcrService.ts`
- `src/services/JuzgadoService.ts`

---

## 🧭 Navegación
La app usa una navegación **custom** basada en un `Navbar` propio y render condicional de pantallas desde `src/screens/HomeScreen.tsx`.  
No se detecta Expo Router en este repo.

---

## 📱 Funcionalidades principales
- **Actas**
  - Alta/edición de acta.
  - Selección de artículos (incluye selección de artículos de distintas leyes).
  - Firma del funcionario e infractor; si el infractor se niega, carga de testigos.
  - Selección de juzgado e indicador de infractor fugado.
- **Ubicación**
  - Selección manual en mapa (Leaflet + OpenStreetMap en WebView).
  - Obtener ubicación actual del dispositivo (requiere permisos).
- **Evidencias**
  - Captura/selección de fotos con recorte (Image Picker).
  - OCR de licencia/cédula contra endpoints del backend.
- **Impresión**
  - Selección de impresora Bluetooth emparejada.
  - Envío de ZPL (según implementación en servicios).

---

## 🧪 Testing
No se detectan scripts de test configurados en `package.json`.  
Si se agregan tests, documentarlos aquí (por ejemplo, Jest/React Native Testing Library).

---

## 🛠 Build de la app
Este repo incluye `eas.json` con perfiles `preview` y `production`.

### Development Build (local)
- Android:
  ```bash
  npm run android
  ```

### EAS Build (CI/Cloud)
Requiere tener EAS configurado y logueado.
```bash
npx eas build --profile preview --platform android
```
```bash
npx eas build --profile production --platform android
```

---

## 📍 Geolocalización (opcional)
Se utiliza `expo-location` para obtener coordenadas actuales, con solicitud de permisos en runtime.

---

## 🖊 Firma digital (Skia)
Se captura la firma con `@shopify/react-native-skia` (ver `src/components/signature/SignaturePadSkia.tsx`) y se serializa a Base64.

---

## 🔍 OCR
`src/services/OcrService.ts` envía imágenes como `multipart/form-data` al backend.  
Se usa `expo-image-manipulator` para normalizar/reenconder a JPEG cuando aplica.

---

## 🖨 Impresión (Bluetooth)
Se usa `react-native-bluetooth-classic`. En Android suelen requerirse permisos (Bluetooth/Location según versión).  
Ver `src/services/BluetoothPrintService.ts` y `src/components/modules/PrinterSelector.tsx`.

---

## 🚧 Estado del proyecto
En espera de aprobación

---

## 👨‍💻 Autor
Emanuel Sosa

