import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { HechoVialForm, Involucrado } from '../features/hechos-viales/types';
import { hechoVialFormSchema } from '../features/hechos-viales/validations';
import type { UbicacionRequest } from '../features/actas/types';
import { SeccionProtagonistasRN } from './SeccionProtagonista.native';
import { SeccionPeatonRN } from './SeccionPeaton.native';
import { styles } from '../components/ui/styles';
import { AppButton } from '../components/ui/AppButton';
import { DateFieldString, SelectField, SelectFieldString } from '../components/ui/SelectedFieldString';
import { UbicacionSection } from '../components/map/UbicacionSection';
import { MapaJujuyLeaflet } from '../components/map/MapaJujuyLeaflet';
import { findDepartamento } from '../features/geo/findDepartamento';
import { DEPARTAMENTOS_JUJUY } from '../features/geo/jujuyGeoJson';
import * as Location from 'expo-location';
import { useAuth } from '../auth/AuthContext';
import { getGrupos } from '../services/GrupoService';
import { getPuestos } from '../services/PuestoService';
import { obtenerUnidadesRegionalesPorDepartamento } from '../services/UnidadRegionalService';
import { guardarHechoVial as guardarHechoVialApi } from '../services/HechoVialService';
import type { Grupo, Puesto } from '../features/catalog/types';
import type { Localidad, UnidadRegional } from '../features/ubicacion/types';
import { SnackbarUtilities } from '../utils/snackbar/SnackbarUtilities';
import { CONFIGURACION_VIA, ESTADO_AMBIENTAL, ESTADO_CALZADA, ESTADO_FISICO_CALZADA, LUZ_ARTIFICIAL, MATERIAL_CALZADA, OptionNumber, OptionString, POSIBLES_CAUSAS, SEMAFORO, TIPO_VIA, TIPOS_COLISION, TIPOS_INVOLUCRADOS, TIPOS_SINIESTRO } from '../features/hechos-viales/values';
import { SkeletonForm } from '../components/ui/skeleton/SkeletonForm';

export { TIPOS_INVOLUCRADOS };

const ErrorText = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

interface Props {
  getPuestos?: () => Promise<Puesto[]>;
  obtenerUnidadesRegionalesPorDepartamento?: (departamento: string) => Promise<UnidadRegional[]>;
  hechoVial?: HechoVialForm | null;
  modo?: 'create' | 'edit';
  limpiarHechoVial?: () => void;
}

const defaultUbicacion: UbicacionRequest = {
  lat: 0,
  lng: 0,
  unidadRegional: 0,
  departamento: '',
  localidad: undefined,
  descripcion: '',
};

const defaultValues: HechoVialForm = {
  destacamento: 0,
  grupo: 0,
  fecha: '',
  hora: '',
  comisaria: '',
  ubicacionReq: defaultUbicacion,
  victimaFatal: 'NO',
  danosMateriales: 'SI',
  zona: 'URBANA',
  tipoVia: '',
  tipoViaOtro: '',
  involucrados: [],
  configuracionVia: '',
  estadoCalzada: '',
  materialCalzada: '',
  estadoFisicoCalzada: '',
  estadoAmbiental: '',
  luzArtificial: '',
  semaforo: '',
  tipoSiniestro: '',
  tipoColision: '',
  posiblesCausas: [],
  sintesis: '',
  protagonistas: [],
  peatones: [],
  deLosHechos: '',
  nota: '',
  unidades: [
    {
      unidad: '',
      personal: [{ nombre: '', jerarquia: '', observacion: '' }],
    },
  ],
};

function normalizeLicenciaRequest(licencia: HechoVialForm['protagonistas'][number]['licenciaRequest']) {
  if (!licencia) return null;

  const numero = String(licencia.numero ?? '').trim();
  const clase = String(licencia.clase ?? '').trim();
  const autoridadExpedicion = String(licencia.autoridadExpedicion ?? '').trim();
  const fechaExpedicion = String(licencia.fechaExpedicion ?? '').trim();
  const fechaVencimiento = String(licencia.fechaVencimiento ?? '').trim();

  if (!numero && !clase && !autoridadExpedicion && !fechaExpedicion && !fechaVencimiento) {
    return null;
  }

  return {
    ...licencia,
    numero,
    clase,
    autoridadExpedicion,
    fechaExpedicion,
    fechaVencimiento,
  };
}

function getCamposPendientesProtagonistas(protagonistas: HechoVialForm['protagonistas']): string[] {
  return protagonistas.flatMap((protagonista, index) => {
    const campos: string[] = [];

    if (String(protagonista.dominio ?? '').trim().length === 0) campos.push('dominio');
    if (String(protagonista.marca ?? '').trim().length === 0) campos.push('marca');
    if (String(protagonista.modelo ?? '').trim().length === 0) campos.push('modelo');
    if (String(protagonista.conductorDni ?? '').trim().length === 0) campos.push('dni');
    if (String(protagonista.conductorNombre ?? '').trim().length === 0) campos.push('nombre');
    if (String(protagonista.conductorFechaNacimiento ?? '').trim().length === 0) campos.push('fecha de nacimiento');
    if (!protagonista.licenciaRequest) campos.push('licencia de conducir');
    if (!Array.isArray(protagonista.actasNoCargadas) || protagonista.actasNoCargadas.length === 0) {
      campos.push('actas');
    }
    if (!Array.isArray(protagonista.acompanantes) || protagonista.acompanantes.length === 0) {
      campos.push('acompañantes del conductor');
    }

    return campos.length > 0 ? [`Protagonista ${index + 1}: ${campos.join(', ')}`] : [];
  });
}

export const HechoVialFormRN: React.FC<Props> = ({
  getPuestos: getPuestosOverride,
  obtenerUnidadesRegionalesPorDepartamento: obtenerUnidadesRegionalesPorDepartamentoOverride,
  hechoVial,
  modo = 'create',
  limpiarHechoVial,
}) => {
  const { jwt } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<HechoVialForm>({
    defaultValues,
  });

  const {
    fields: involucradosFields,
    append: appendInvolucrado,
    remove: removeInvolucrado,
  } = useFieldArray({
    control,
    name: 'involucrados',
  });

  const {
    fields: unidadesFields,
    append: appendUnidad,
    remove: removeUnidad,
  } = useFieldArray({
    control,
    name: 'unidades',
  });

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [unidadesRegionales, setUnidadesRegionales] = useState<UnidadRegional[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  const [ubicLat, setUbicLat] = useState<string | null>(null);
  const [ubicLng, setUbicLng] = useState<string | null>(null);
  const [ubicDepartamento, setUbicDepartamento] = useState<string | null>(null);
  const [ubicUnidadRegional, setUbicUnidadRegional] = useState<number | null>(null);
  const [ubicLocalidad, setUbicLocalidad] = useState<number | null>(null);
  const [ubicDescripcion, setUbicDescripcion] = useState('');
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingUr, setIsLoadingUr] = useState(false);
  const [urError, setUrError] = useState<string | null>(null);

  const watchInvolucrados = useWatch({ control, name: 'involucrados' });
  const tipoSiniestro = watch('tipoSiniestro');
  const tipoVia = watch('tipoVia');
  const estadoFisicoCalzada = watch('estadoFisicoCalzada');
  const estadoCalzada = watch('estadoCalzada');

  useEffect(() => {
    let isMounted = true;

    async function loadCatalogs() {
      setCatalogsError(null);
      setIsLoadingCatalogs(true);
      try {
        const [puestosRes, gruposRes] = await Promise.all([
          getPuestosOverride ? getPuestosOverride() : getPuestos(jwt),
          getGrupos(jwt),
        ]);
        if (!isMounted) return;
        setPuestos(puestosRes);
        setGrupos(gruposRes);
      } catch (e) {
        if (!isMounted) return;
        setCatalogsError(e instanceof Error ? e.message : 'Error cargando catálogos.');
      } finally {
        if (!isMounted) return;
        setIsLoadingCatalogs(false);
      }
    }

    loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, [jwt]);

  useEffect(() => {
    let isMounted = true;

    const initializeEditMode = async () => {
      if (modo !== 'edit' || !hechoVial) return;

      reset(hechoVial);

      const ub = hechoVial.ubicacionReq ?? defaultUbicacion;
      const depto = (ub.departamento ?? '').trim();
      const unidadRegionalTexto = String(ub.unidadRegional ?? '').trim();
      const localidadTexto = String(ub.localidad ?? '').trim();

      setUbicacionError(null);
      setUrError(null);
      setUbicLat(ub.lat ? String(ub.lat) : null);
      setUbicLng(ub.lng ? String(ub.lng) : null);
      setUbicDepartamento(depto || null);
      setUbicUnidadRegional(null);
      setUbicLocalidad(null);
      setUbicDescripcion(ub.descripcion ?? '');
      setUnidadesRegionales([]);
      setLocalidades([]);

      if (!depto) return;

      const ur = await loadUnidadesRegionalesForDepartamento(depto);
      if (!isMounted) return;

      const normalizeMatchText = (value: unknown) => String(value ?? '').trim().toLowerCase();

      const unidadRegionalEncontrada =
        ur.find((u) => normalizeMatchText(u.nombre) === normalizeMatchText(unidadRegionalTexto)) ??
        ur.find((u) => normalizeMatchText(String(u.idUr)) === normalizeMatchText(unidadRegionalTexto));

      if (unidadRegionalEncontrada) {
        setUbicUnidadRegional(unidadRegionalEncontrada.idUr);
      }

      const deptoData = (unidadRegionalEncontrada ?? ur[0])
        ?.departamentos.find((d) => d.nombre === depto);

      const localidadesDisponibles = deptoData?.localidades ?? [];
      setLocalidades(localidadesDisponibles);

      const localidadEncontrada =
        localidadesDisponibles.find(
          (item) => normalizeMatchText(item.nombre) === normalizeMatchText(localidadTexto)
        ) ??
        localidadesDisponibles.find(
          (item) => normalizeMatchText(String(item.id)) === normalizeMatchText(localidadTexto)
        );

      if (localidadEncontrada) {
        setUbicLocalidad(localidadEncontrada.id);
      }
    };

    void initializeEditMode();

    if (modo === 'create' && !hechoVial) {
      reset(defaultValues);
    }

    return () => {
      isMounted = false;
    };
  }, [hechoVial, modo, reset]);

  const puestosOptions = useMemo<OptionNumber[]>(() => puestos.map((p) => ({ label: p.nombre, value: p.idPuesto })), [puestos]);
  const gruposOptions = useMemo<OptionNumber[]>(() => grupos.map((g) => ({ label: g.nombre, value: g.idGrupo })), [grupos]);

  function toNumberOrFallback(value: string | null | undefined, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  const ubicacionReq = useMemo<UbicacionRequest>(() => {
    const departamento = (ubicDepartamento ?? '').trim();
    return {
      lat: ubicLat ? toNumberOrFallback(ubicLat, 0) : 0,
      lng: ubicLng ? toNumberOrFallback(ubicLng, 0) : 0,
      departamento,
      unidadRegional: ubicUnidadRegional ?? undefined,
      localidad: ubicLocalidad ?? undefined,
      descripcion: ubicDescripcion,
    };
  }, [ubicDepartamento, ubicDescripcion, ubicLat, ubicLng, ubicLocalidad, ubicUnidadRegional]);

  useEffect(() => {
    setValue('ubicacionReq', ubicacionReq);
  }, [setValue, ubicacionReq]);

  async function loadUnidadesRegionalesForDepartamento(departamento: string): Promise<UnidadRegional[]> {
    const depto = departamento.trim();
    if (!depto) {
      setUnidadesRegionales([]);
      setLocalidades([]);
      return [];
    }

    setUrError(null);
    setIsLoadingUr(true);
    try {
      const ur = await (obtenerUnidadesRegionalesPorDepartamentoOverride
        ? obtenerUnidadesRegionalesPorDepartamentoOverride(depto)
        : obtenerUnidadesRegionalesPorDepartamento(depto, jwt));
      setUnidadesRegionales(ur);
      return ur;
    } catch (e) {
      setUnidadesRegionales([]);
      setLocalidades([]);
      setUrError(e instanceof Error ? e.message : 'Error cargando unidades regionales.');
      return [];
    } finally {
      setIsLoadingUr(false);
    }
  }

  async function onDepartamentoChanged(departamento: string | null) {
    const depto = (departamento ?? '').trim();
    setUbicDepartamento(depto || null);
    setUbicUnidadRegional(null);
    setUbicLocalidad(null);
    setLocalidades([]);
    if (!depto) {
      setUnidadesRegionales([]);
      return;
    }
    await loadUnidadesRegionalesForDepartamento(depto);
  }

  function onUnidadRegionalChanged(id: number | null) {
    setUbicUnidadRegional(id);
    setUbicLocalidad(null);

    if (!id || !ubicDepartamento) {
      setLocalidades([]);
      return;
    }

    const depto = unidadesRegionales
      .find((u) => u.idUr === id)
      ?.departamentos.find((d) => d.nombre === ubicDepartamento);

    setLocalidades(depto?.localidades ?? []);
  }

  async function obtenerUbicacionActual() {
    setUbicacionError(null);
    setIsLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setUbicacionError('No se otorgó permiso de ubicación.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const departamento = findDepartamento(lat, lng, DEPARTAMENTOS_JUJUY);
      if (!departamento) {
        setUbicacionError('El punto seleccionado está fuera de Jujuy.');
        return;
      }

      setUbicLat(lat.toFixed(6));
      setUbicLng(lng.toFixed(6));
      setUbicacionError(null);
      await onDepartamentoChanged(departamento);
    } catch (e) {
      setUbicacionError(e instanceof Error ? e.message : 'Error obteniendo ubicación.');
    } finally {
      setIsLocating(false);
    }
  }

  const onSubmit = async (data: HechoVialForm) => {
      const protagonistasNormalizados = data.protagonistas.map((protagonista) => ({
        ...protagonista,
        licenciaRequest: normalizeLicenciaRequest(protagonista.licenciaRequest),
      }));

      const payload: HechoVialForm = {
        ...data,
        protagonistas: protagonistasNormalizados,
        ubicacionReq,
      };

      clearErrors();
      const parsed = hechoVialFormSchema.safeParse(payload);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const fieldPath = issue.path.join('.');
          if (fieldPath) {
            setError(fieldPath as any, { type: 'manual', message: issue.message });
          }
        }
        scrollToTop();
        return;
      }

      const camposPendientes = getCamposPendientesProtagonistas(payload.protagonistas);
      const enviarHechoVial = async () => {
        await guardarHechoVialApi(payload, jwt);
        SnackbarUtilities.success('Se guardó correctamente el hecho vial');
        limpiarHechoVial?.();
        reset(defaultValues);
        setUbicLat(null);
        setUbicLng(null);
        setUbicDepartamento(null);
        setUbicUnidadRegional(null);
        setUbicLocalidad(null);
        setUbicDescripcion('');
        setUbicacionError(null);
        setUrError(null);
        setUnidadesRegionales([]);
        setLocalidades([]);
      };

      if (camposPendientes.length > 0) {
        Alert.alert(
          'Confirmación',
          `Usted está dejando los siguientes campos sin completar:\n\n${camposPendientes.join('\n')}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Continuar', onPress: () => void enviarHechoVial() },
          ]
        );
        return;
      }

      await enviarHechoVial();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
      >
        <Text style={styles.title}>Informe de Hecho Vial</Text>

      <SectionTitle title="Datos de Identificación" />

      {isLoadingCatalogs ? (
        <View style={styles.loadingRow}>
          <SkeletonForm sections={3} fieldsPerSection={5} />
        </View>
      ) : null}
      {catalogsError ? <Text style={styles.errorText}>{catalogsError}</Text> : null}

      <ControlledPicker
        control={control}
        name="destacamento"
        label="Destacamento"
        options={puestosOptions}
        numeric
        placeholder="Seleccioná un destacamento"
      />

      <ControlledPicker
        control={control}
        name="grupo"
        label="Seleccionar grupo"
        options={gruposOptions}
        numeric
        placeholder="Seleccioná un grupo"
      />

      <Controller
        control={control}
        name="fecha"
        render={({ field, fieldState }) => (
          <View style={styles.fieldContainer}>
            <DateFieldString
              label="Fecha"
              placeholder="Seleccioná una fecha"
              value={field.value == null ? null : String(field.value)}
              onChangeValue={(v) => field.onChange(v ?? '')}
              allowClear
            />
            <ErrorText message={fieldState.error?.message} />
          </View>
        )}
      />
      <ControlledInput control={control} name="hora" label="Hora" placeholder="HH:MM:SS" />
      <ControlledInput control={control} name="comisaria" label="Comisaría" placeholder="Ej. Seccional 3" />

      <UbicacionSection
        ubicLat={ubicLat}
        ubicLng={ubicLng}
        ubicDepartamento={ubicDepartamento}
        ubicUnidadRegional={ubicUnidadRegional}
        ubicLocalidad={ubicLocalidad}
        ubicDescripcion={ubicDescripcion}
        isLocating={isLocating}
        isLoadingUr={isLoadingUr}
        ubicacionError={ubicacionError}
        urError={urError}
        unidadesRegionales={unidadesRegionales}
        localidades={localidades}
        setIsMapOpen={setIsMapOpen}
        obtenerUbicacionActual={obtenerUbicacionActual}
        setUbicUnidadRegional={onUnidadRegionalChanged}
        setUbicLocalidad={setUbicLocalidad}
        setUbicDescripcion={setUbicDescripcion}
      />

      <MapaJujuyLeaflet
        visible={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialValue={
          ubicLat && ubicLng && ubicDepartamento && ubicLocalidad && ubicUnidadRegional
            ? {
                lat: toNumberOrFallback(ubicLat, 0),
                lng: toNumberOrFallback(ubicLng, 0),
                localidad: ubicLocalidad,
                unidadRegional: ubicUnidadRegional,
                departamento: ubicDepartamento,
                descripcion: ubicDescripcion,
              }
            : null
        }
        onSelectPoint={(lat, lng) => {
          const departamento = findDepartamento(lat, lng, DEPARTAMENTOS_JUJUY);
          if (!departamento) {
            setUbicacionError('El punto seleccionado está fuera de Jujuy.');
            return;
          }
          setUbicacionError(null);
          setUbicLat(lat.toFixed(6));
          setUbicLng(lng.toFixed(6));
          void onDepartamentoChanged(departamento);
        }}
      />

      <SectionTitle title="Clasificación del Hecho" />

      <ControlledSegment
        control={control}
        name="victimaFatal"
        label="¿Víctima Fatal?"
        options={['SI', 'NO']}
      />

      <ControlledSegment
        control={control}
        name="zona"
        label="Zona"
        options={['URBANA', 'RURAL']}
      />

      <ControlledSegment
        control={control}
        name="danosMateriales"
        label="Daños Materiales"
        options={['SI', 'NO']}
      />

      <ControlledPicker
        control={control}
        name="tipoVia"
        label="Tipo de Vía"
        options={TIPO_VIA.map((x) => ({ label: x, value: x }))}
      />

      {tipoVia === 'OTRO' && (
        <ControlledInput control={control} name="tipoViaOtro" label="Especificar tipo de vía" />
      )}

      <SectionTitle title="Involucrados" />

      {involucradosFields.map((field, index) => {
        const item = watchInvolucrados?.[index];
        return (
          <Card key={field.id}>
            <ControlledInput
              control={control}
              name={`involucrados.${index}.cantidad`}
              label="Cantidad"
              keyboardType="numeric"
            />

            <ControlledPicker
              control={control}
              name={`involucrados.${index}.tipo`}
              label="Tipo de Vehículo/Persona"
              options={TIPOS_INVOLUCRADOS.map((x) => ({ label: x, value: x }))}
            />

            {item?.tipo === 'OTRO' && (
              <ControlledInput
                control={control}
                name={`involucrados.${index}.especificarOtro`}
                label="Especificar otro"
              />
            )}

            <AppButton
              title="Eliminar involucrado"
              icon="delete"
              variant="secondary"
              size="sm"
              onPress={() => removeInvolucrado(index)}
            />
          </Card>
        );
      })}

      <AppButton
        title="Agregar involucrado"
        icon="add"
        onPress={() => appendInvolucrado({ tipo: '', cantidad: 1 } as Involucrado)}
      />

      <SectionTitle title="Características de la Escena" />

      <ControlledPicker
        control={control}
        name="configuracionVia"
        label="Configuración de la Vía"
        options={CONFIGURACION_VIA.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="estadoFisicoCalzada"
        label="Estado físico de la calzada"
        options={ESTADO_FISICO_CALZADA.map((x) => ({ label: x, value: x }))}
      />

      {estadoFisicoCalzada === 'OTRO' && (
        <ControlledInput
          control={control}
          name="estadoFisicoCalzada"
          label="Especificar estado físico"
        />
      )}

      <ControlledPicker
        control={control}
        name="estadoCalzada"
        label="Condición de superficie"
        options={ESTADO_CALZADA.map((x) => ({ label: x, value: x }))}
      />

      {estadoCalzada === 'OTRO' && (
        <ControlledInput control={control} name="estadoCalzada" label="Especificar condición" />
      )}

      <ControlledPicker
        control={control}
        name="estadoAmbiental"
        label="Estado Ambiental"
        options={ESTADO_AMBIENTAL.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="semaforo"
        label="Semáforo"
        options={SEMAFORO.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="luzArtificial"
        label="Luz Artificial"
        options={LUZ_ARTIFICIAL.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="materialCalzada"
        label="Material de la calzada"
        options={MATERIAL_CALZADA.map((x) => ({ label: x, value: x }))}
      />

      <SectionTitle title="Tipo de Siniestro" />

      <ControlledPicker
        control={control}
        name="tipoSiniestro"
        label="Tipo de Siniestro"
        options={TIPOS_SINIESTRO}
      />

      {tipoSiniestro === 'COLISION' && (
        <ControlledPicker
          control={control}
          name="tipoColision"
          label="Tipo de Colisión"
          options={TIPOS_COLISION.map((x) => ({ label: x, value: x }))}
        />
      )}

      <SectionTitle title="Posibles causas del siniestro vial" />

      <Controller
        control={control}
        name="posiblesCausas"
        render={({ field }) => (
          <MultiSelectChips
            label="Seleccionar causas"
            value={field.value || []}
            options={POSIBLES_CAUSAS}
            onChange={field.onChange}
          />
        )}
      />

      <SectionTitle title="Personal interviniente por unidades" />

      {unidadesFields.map((field, index) => (
        <UnidadIntervinienteCard
          key={field.id}
          control={control}
          index={index}
          onRemoveUnidad={() => removeUnidad(index)}
        />
      ))}

      <AppButton
        title="Agregar otra unidad"
        icon="add"
        onPress={() =>
          appendUnidad({
            unidad: '',
            personal: [{ nombre: '', jerarquia: '', observacion: '' }],
          })
        }
      />

      <ControlledInput
        control={control}
        name="sintesis"
        label="Síntesis del Hecho"
        multiline
        placeholder="Ej. En fecha 09/12/2025 a hora 00:00 por comunicación SAME/911..."
      />

      <ControlledInput
        control={control}
        name="nota"
        label="Nota"
        multiline
        placeholder="Colocar cuando se quiera aclarar algo"
      />

      <ControlledInput
        control={control}
        name="deLosHechos"
        label="De los hechos"
        multiline
        placeholder="Colocar cuando se quiera describir algo importante acerca del hecho"
      />

      <SeccionProtagonistasRN control={control} watch={watch} setValue={setValue} />
      <SeccionPeatonRN control={control} setValue={setValue} />

        <AppButton title="Generar Informe Oficial" icon="send" onPress={handleSubmit(onSubmit, scrollToTop)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ====== COMPONENTES UI ======

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.section}>{children}</View>
);

const UnidadIntervinienteCard = ({
  control,
  index,
  onRemoveUnidad,
}: {
  control: any;
  index: number;
  onRemoveUnidad: () => void;
}) => {
  const {
    fields: personalFields,
    append: appendPersonal,
    remove: removePersonal,
  } = useFieldArray({
    control,
    name: `unidades.${index}.personal`,
  });

  return (
    <Card>
      <ControlledInput control={control} name={`unidades.${index}.unidad`} label="Unidad" />

      <AppButton title="Eliminar unidad" icon="delete" variant="secondary" size="sm" onPress={onRemoveUnidad} />

      <Text style={styles.subTitle}>Personal</Text>

      {personalFields.map((p, pIndex) => (
        <View key={p.id} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={styles.label}>Personal #{pIndex + 1}</Text>
            {personalFields.length > 1 ? (
              <AppButton
                title="Quitar"
                icon="delete"
                variant="secondary"
                size="sm"
                onPress={() => removePersonal(pIndex)}
              />
            ) : null}
          </View>

          <Controller
            control={control}
            name={`unidades.${index}.personal.${pIndex}.nombre`}
            render={({ field, fieldState }) => (
              <Input
                label="Nombre"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name={`unidades.${index}.personal.${pIndex}.jerarquia`}
            render={({ field, fieldState }) => (
              <Input
                label="Jerarquía"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name={`unidades.${index}.personal.${pIndex}.observacion`}
            render={({ field, fieldState }) => (
              <Input
                label="Observación"
                multiline
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      ))}

      <AppButton
        title="Agregar personal"
        icon="add"
        size="sm"
        onPress={() => appendPersonal({ nombre: '', jerarquia: '', observacion: '' })}
      />
    </Card>
  );
};

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  error?: string | null;
}) => (
  <View style={styles.fieldContainer}>
    <Label>{label}</Label>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    <ErrorText message={error} />
  </View>
);

function formatTimeHhMmSs(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 6); // HHMMSS
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const ss = digits.slice(4, 6);

  let out = hh;
  if (digits.length > 2) out = `${hh}:${mm}`;
  if (digits.length > 4) out = `${hh}:${mm}:${ss}`;
  return out;
}

const ControlledInput = ({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  multiline,
  onChangeText,
}: {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  onChangeText?: (text: string) => void;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <Input
        label={label}
        value={field.value == null ? '' : String(field.value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        error={fieldState.error?.message}
        onChangeText={(text) => {
          const next = name === 'hora' ? formatTimeHhMmSs(text) : text;
          field.onChange(next);
          onChangeText?.(next);
        }}
      />
    )}
  />
);

const ControlledPicker = ({
  control,
  name,
  label,
  options,
  numeric = false,
  placeholder = 'Seleccioná una opción',
  allowClear = true,
}: {
  control: any;
  name: string;
  label: string;
  options: OptionNumber[] | OptionString[];
  numeric?: boolean;
  placeholder?: string;
  allowClear?: boolean;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => {
      if (numeric) {
        const raw = typeof field.value === 'number' ? field.value : Number(field.value);
        const value = Number.isFinite(raw) && raw > 0 ? raw : null;
        return (
          <View style={styles.fieldContainer}>
            <SelectField
              label={label}
              placeholder={placeholder}
              value={value}
              options={options as OptionNumber[]}
              onChangeValue={(v) => field.onChange(v ?? 0)}
              allowClear={allowClear}
            />
            <ErrorText message={fieldState.error?.message} />
          </View>
        );
      }

      const raw = field.value == null ? '' : String(field.value);
      const value = raw.trim() ? raw : null;
      return (
        <View style={styles.fieldContainer}>
          <SelectFieldString
            label={label}
            placeholder={placeholder}
            value={value}
            options={options as OptionString[]}
            onChangeValue={(v) => field.onChange(v ?? '')}
            allowClear={allowClear}
          />
          <ErrorText message={fieldState.error?.message} />
        </View>
      );
    }}
  />
);

const ControlledSegment = ({
  control,
  name,
  label,
  options,
}: {
  control: any;
  name: string;
  label: string;
  options: string[];
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => (
      <View style={styles.fieldContainer}>
        <Label>{label}</Label>
        <View style={styles.segmentRow}>
          {options.map((opt) => {
            const selected = field.value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                onPress={() => field.onChange(opt)}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <ErrorText message={fieldState.error?.message} />
      </View>
    )}
  />
);

const MultiSelectChips = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
}) => {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((x) => x !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Label>{label}</Label>
      <View style={styles.chipsContainer}>
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggle(opt)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
