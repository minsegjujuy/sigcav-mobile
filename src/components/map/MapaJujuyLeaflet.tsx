import React, { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { UbicacionRequest } from '../../features/actas/types';
import { JUJUY_BOUNDARY } from '../../features/geo/jujuyGeoJson';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectPoint: (lat: number, lng: number) => void;
  initialValue?: UbicacionRequest | null;
};

export function MapaJujuyLeaflet({ visible, onClose, onSelectPoint, initialValue }: Props) {
  const webViewRef = useRef<WebView>(null);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);

  const html = useMemo(() => buildLeafletHtml(JUJUY_BOUNDARY), []);
  const initial = initialValue ? { lat: initialValue.lat, lng: initialValue.lng } : null;

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat?: unknown; lng?: unknown };
      const lat = typeof data.lat === 'number' ? data.lat : null;
      const lng = typeof data.lng === 'number' ? data.lng : null;
      if (lat == null || lng == null) return;
      setSelected({ lat, lng });
      onSelectPoint(lat, lng);
    } catch {
      // ignore
    }
  }

  const injected = initial
    ? `window.__setMarker && window.__setMarker(${initial.lat}, ${initial.lng}); true;`
    : 'true;';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar ubicación</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>

        <WebView
          ref={webViewRef}
          source={{ html }}
          onMessage={onMessage}
          injectedJavaScript={injected}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />

        <View style={styles.footer}>
          <Text style={styles.hint}>Tocá en el mapa para elegir un punto dentro de Jujuy.</Text>
          {selected ? (
            <Text style={styles.hint}>
              Seleccionado: {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function buildLeafletHtml(boundaryGeoJson: unknown): string {
  const boundaryStr = JSON.stringify(boundaryGeoJson);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const boundary = ${boundaryStr};
      const map = L.map('map', { zoomControl: true }).setView([-24.2, -65.3], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      try {
        const layer = L.geoJSON(boundary, { style: { color: 'blue', weight: 2, fillOpacity: 0.05 }});
        layer.addTo(map);
        map.fitBounds(layer.getBounds(), { padding: [10, 10] });
      } catch {}

      let marker = null;
      window.__setMarker = function(lat, lng) {
        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(map);
        map.setView([lat, lng], 12);
      }

      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        window.__setMarker(lat, lng);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
        }
      });
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  title: { fontSize: 16, fontWeight: '800' },
  closeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#111' },
  closeText: { color: '#fff', fontWeight: '700' },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  hint: { color: '#444' },
});
