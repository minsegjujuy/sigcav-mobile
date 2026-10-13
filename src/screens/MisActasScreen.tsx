import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { PageResponse } from '../features/common/PageResponse';
import type { ActaResumenDto } from '../features/actas/reportingTypes';
import { descargarPdfActa, getResumenActas, getResumenActasPersonal, obtenerZpl } from '../services/ActaService';
import { useAuth } from '../auth/AuthContext';
import { getRolFromJwt, getRolesFromJwt, getUsernameFromJwt, hasRole } from '../auth/jwt';
import { Colors } from '../theme/colors';
import { AppButton } from '../components/ui/AppButton';
import type { ActaRequest } from '../features/actas/types';
import { actaResumenToActaRequest } from '../utils/actaResumenToActaRequest';
import { HttpError } from '../api/http';
import { getSelectedPrinterAddress, sendPrintZpl } from '../services/BluetoothPrintService';
import { validarPeriodoDiasISO } from '../utils/formatearFecha';
import { SkeletonList } from '../components/ui/skeleton/SkeletonList';
import { CollapsibleContainer } from '../components/ui/CollapsibleContainer';

export function MisActasScreen({ onEditActa }: { onEditActa: (acta: ActaRequest) => void }) {
  const { jwt } = useAuth();
  const username = useMemo(() => getUsernameFromJwt(jwt), [jwt]);
  const rolClaim = useMemo(() => getRolFromJwt(jwt), [jwt]);
  const rolesDebug = useMemo(() => getRolesFromJwt(jwt), [jwt]);
  const roleLabel = useMemo(() => rolClaim ?? rolesDebug[0] ?? null, [rolClaim, rolesDebug]);
  const isPersonal = useMemo(() => {
    // Si el token no trae roles/rol, preferimos el endpoint personal para evitar "Access Denied" en listados globales.
    if (rolClaim === 'PERSONAL' || hasRole(jwt, 'PERSONAL')) return true;
    if (rolesDebug.length === 0) return true;
    return false;
  }, [jwt, rolClaim, rolesDebug]);

  const [infractor, setInfractor] = useState('');
  const [nro, setNro] = useState('');
  const [appliedInfractor, setAppliedInfractor] = useState('');
  const [appliedNro, setAppliedNro] = useState('');

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sort] = useState<string[]>(['fecha,desc']);

  const [data, setData] = useState<PageResponse<ActaResumenDto> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusyNro, setPdfBusyNro] = useState<string | null>(null);

  async function openGoogleMaps(lat: number, lng: number) {
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return;

    const url =
      Platform.OS === 'android'
        ? `geo:${safeLat},${safeLng}?q=${safeLat},${safeLng}`
        : Platform.OS === 'ios'
          ? `http://maps.apple.com/?q=${safeLat},${safeLng}`
          : `https://www.google.com/maps?q=${safeLat},${safeLng}`;

    const can = await Linking.canOpenURL(url);
    if (!can) {
      await Linking.openURL(`https://www.google.com/maps?q=${safeLat},${safeLng}`);
      return;
    }
    await Linking.openURL(url);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Error leyendo PDF'));
      reader.onloadend = () => {
        const result = String(reader.result ?? '');
        const commaIndex = result.indexOf(',');
        if (commaIndex === -1) {
          reject(new Error('PDF base64 invalido'));
          return;
        }
        resolve(result.slice(commaIndex + 1));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function generarPdfActa(nro: string) {
    if (!nro) return;

    try {
      setPdfBusyNro(nro);
      const blob = await descargarPdfActa(nro, jwt);
      const base64 = await blobToBase64(blob);

      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) throw new Error('No hay directorio disponible para guardar el PDF.');

      const fileUri = `${dir.replace(/\/+$/, '')}/acta-${nro}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const sharing = await Sharing.isAvailableAsync();
      if (sharing) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Acta ${nro}`,
        });
      } else {
        Alert.alert('PDF generado', `Se guardo en:\n${fileUri}`);
      }
    } catch (e) {
      console.log('MisActas: PDF error', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Error generando PDF');
    } finally {
      setPdfBusyNro(null);
    }
  }

  async function generarZplActa(nro: string){
    console.log('ingresó a zpl ')
    const selected = await getSelectedPrinterAddress();
     if (!selected) {
      Alert.alert('Atención', 'Primero seleccioná una impresora');
      return;
    }
    const text = await obtenerZpl(nro, jwt);
    console.log('zpl ', text);
    await sendPrintZpl(text, selected);
    //printTest(text);
  }

  useEffect(() => {
    console.log("impresion")
    //printTest();
    let isMounted = true;

    async function load() {
      setError(null);
      setIsLoading(true);
      try {

        const params: Record<string, unknown> = {
          page,
          size,
          sort,
          infractor: appliedInfractor.trim() || undefined,
          nro: appliedNro.trim() || undefined,
        };

        console.log('MisActas: params', params);
        const res = isPersonal
          ? await getResumenActasPersonal(params, jwt)
          : await getResumenActas(params, jwt);

        if (!isMounted) return;
        console.log('MisActas: response meta', {
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          number: res.number,
          page: res.page,
          size: res.size,
          content: res.content?.length ?? 0,
        });
        setData(res);
      } catch (e) {
        if (!isMounted) return;
        console.log('MisActas: error', e);
        if (e instanceof HttpError) {
          const bodyPreview = (e.bodyText ?? '').slice(0, 250);
          setError(bodyPreview ? `${e.message}\n${bodyPreview}` : e.message);
        } else {
          setError(e instanceof Error ? e.message : 'Error cargando actas');
        }
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [appliedInfractor, appliedNro, isPersonal, jwt, page, size, sort]);

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? undefined;
  const currentPage = data?.number ?? data?.page ?? page;
  const canPrev = currentPage > 0 && !isLoading;
  const canNext =
    !isLoading &&
    (typeof totalPages === 'number' ? currentPage + 1 < totalPages : content.length === size);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <MaterialIcons name="receipt-long" size={20} color={Colors.primary} />
        <Text style={styles.title}>Mis actas</Text>
      </View>
      <Text style={styles.welcome}>
        Legajo: {username ?? '-'} - Rol: {roleLabel ?? '-'}
      </Text>
      <CollapsibleContainer title='Filtro de actas' iconTitle="filter-list">
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            <Text style={styles.label}>Infractor</Text>
            <TextInput
              value={infractor}
              onChangeText={setInfractor}
              placeholder="Nombre / apellido"
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.label}>Nro</Text>
            <TextInput
              value={nro}
              onChangeText={setNro}
              placeholder="Número de acta"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.filterActions}>
            <AppButton
              title="Buscar"
              icon="search"
              onPress={() => {
                setAppliedInfractor(infractor);
                setAppliedNro(nro);
                setPage(0);
              }}
              disabled={isLoading}
              size="sm"
            />
            <AppButton
              title="Limpiar"
              icon="close"
              variant="secondary"
              onPress={() => {
                setInfractor('');
                setNro('');
                setAppliedInfractor('');
                setAppliedNro('');
                setPage(0);
              }}
              disabled={isLoading}
              size="sm"
            />
          </View>

          <Text style={styles.helper}>
            Rol: {rolClaim || (isPersonal ? 'PERSONAL' : 'OTRO')} ({rolesDebug.join(', ') || 'sin roles'}) | Orden: fecha desc | Página:{' '}
            {currentPage + 1}
            {typeof totalPages === 'number' ? ` / ${totalPages}` : ''}
          </Text>
        </View>
      </CollapsibleContainer>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <SkeletonList count={5} variant="medium" />
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => String(item.idActa ?? item.nro)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.helper}>No hay actas para mostrar.</Text>
          }
          renderItem={({ item }) => (
            <ActaCard
              item={item}
              onEdit={() => {
                console.log('Editar acta: resumen.ubicacionResponse', item.ubicacionResponse);
                console.log('Editar acta: resumen.vehiculo', item.vehiculo);

                const req = actaResumenToActaRequest(item);

                console.log('Editar acta: ActaRequest', req);

                onEditActa(req);
              }}
              onOpenMaps={() =>
                openGoogleMaps(item.ubicacionResponse?.lat, item.ubicacionResponse?.lng)
              }
              onPdf={() => generarPdfActa(item.nro)}
              onZpl={() => generarZplActa(item.nro)}
              isPdfBusy={pdfBusyNro === item.nro}
            />
          )}
        />
      )}

      <View style={styles.pagination}>
        <AppButton
          title="Anterior"
          icon="chevron-left"
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={!canPrev}
        />
        <Text style={styles.pageText}>
          {currentPage + 1}
          {typeof totalPages === 'number' ? ` / ${totalPages}` : ''}
        </Text>
        <AppButton
          title="Siguiente"
          icon="chevron-right"
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => p + 1)}
          disabled={!canNext}
        />
      </View>
    </View>
  );
}

function ActaCard({
  item,
  onEdit,
  onOpenMaps,
  onPdf,
  isPdfBusy,
  onZpl,
}: {
  item: ActaResumenDto;
  onEdit: () => void;
  onOpenMaps: () => void;
  onPdf: () => void;
  isPdfBusy: boolean;
  onZpl: () => void;
}) {
  const infractorLabel = `${item.infractor?.apellido ?? ''} ${item.infractor?.nombre ?? ''}`.trim();
  const fecha = formatFechaForCard(item.fecha);
  const domicilio = item.infractor?.domicilio ?? '';
  const dominio = item.vehiculo?.dominio ?? '';
  const depto = item.ubicacionResponse?.departamento ?? '';
  const hasUb = !!item.ubicacionResponse && Number.isFinite(item.ubicacionResponse.lat) && Number.isFinite(item.ubicacionResponse.lng);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Acta #{item.nro}</Text>
        <Text style={styles.badge}>{fecha}</Text>
      </View>

      <Text style={styles.row}><Text style={styles.rowLabel}>Infractor: </Text>{infractorLabel || '-'}</Text>
      <Text style={styles.row}><Text style={styles.rowLabel}>DNI: </Text>{item.infractor?.dni ?? '-'}</Text>
      <Text style={styles.row}><Text style={styles.rowLabel}>Domicilio: </Text>{domicilio || '-'}</Text>
      <Text style={styles.row}><Text style={styles.rowLabel}>Motivo: </Text>{item.motivo || '-'}</Text>
      <Text style={styles.row}><Text style={styles.rowLabel}>Vehículo: </Text>{dominio || '-'}</Text>
      <Text style={styles.row}><Text style={styles.rowLabel}>Depto: </Text>{depto || '-'}</Text>
      <Text style={styles.row}>
        <Text style={styles.rowLabel}>Grupo/Tipo/Puesto: </Text>
        {item.idGrupo} / {item.idTipo}
        {item.idPuesto ? ` / ${item.idPuesto}` : ''}
      </Text>

      <Text style={styles.row}>
        <Text style={styles.rowLabel}>Funcionario: </Text>
        {item.legajo ? `${item.legajo} - ` : ''}{item.nombre || '-'}
      </Text>

      <View style={styles.cardFooter}>
        {hasUb ? (
          <AppButton title="Ubicacion" icon="location-on" iconOnly size="sm" variant="secondary" onPress={onOpenMaps} />
        ) : null}
        {item.nro ? (
          <AppButton
            title="PDF"
            icon="share"
            iconOnly
            size="sm"
            variant="secondary"
            onPress={onPdf}
            loading={isPdfBusy}
            disabled={true}
          />
        ) : null}
        <AppButton disabled={!validarPeriodoDiasISO(item.fecha, 1)} title="Editar" icon="edit" iconOnly size="sm" variant="secondary" onPress={onEdit} />
        <AppButton title="Imprimir" icon="print" iconOnly size="sm" variant="secondary" onPress={onZpl} />
      </View>
    </View>
  );
}

function formatFechaForCard(value: string): string {
  const raw = (value ?? '').trim();
  if (!raw) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(raw);
  if (!m) return raw;
  const [, yyyy, mm, dd, hh, min] = m;
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: Colors.background },
  titleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  welcome: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary },
  filters: {
    //borderWidth: 1,
    //borderColor: Colors.divider,
    //borderRadius: 18,
    padding: 12,
    gap: 10,
    backgroundColor: Colors.surface,
  },
  filterRow: { gap: 6 },
  filterActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  helper: { color: Colors.textSecondary, fontWeight: '700' },
  error: { color: Colors.danger, fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  list: { gap: 10, paddingBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 18,
    padding: 12,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.lightPrimary,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  row: { color: Colors.textPrimary, fontWeight: '700' },
  rowLabel: { fontWeight: '900' },
  cardFooter: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pageText: { fontSize: 14, fontWeight: '900' },
});
