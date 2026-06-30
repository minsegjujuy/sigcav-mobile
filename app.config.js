const config  = {
  "expo": {
    "jsEngine": "hermes",
    "name": "PERSONAL DE CALLE",
    "slug": "seguridadvial_movil",
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Se utiliza la cámara para capturar fotos de documentación (licencia y cédula).",
        "NSPhotoLibraryUsageDescription": "Se utiliza la galería para seleccionar fotos de documentación (licencia y cédula).",
        "NSPhotoLibraryAddUsageDescription": "Se utiliza para guardar fotos capturadas cuando sea necesario."
      }
    },
    "android": {
      "permissions": [
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "ACCESS_FINE_LOCATION"
      ],
      "jsEngine": "hermes",
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "package": "com.anonymous.seguridadvial_movil",
      "permissions": [
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store"
    ],
    "extra": {
      "eas": {
        "projectId": "83149d58-c3f3-4b11-aa32-5a8270cfb2ef"
      },
      EXPO_PUBLIC_API_URL: "https://aaa3-181-87-209-196.ngrok-free.app"
    }
  }
}

export default config;