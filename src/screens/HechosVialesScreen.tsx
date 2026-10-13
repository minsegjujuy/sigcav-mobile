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
import { guardarHechoVial as guardarHechoVialApi } from '../services/HechoVialService';
import type { Catalogos, Localidad } from '../features/ubicacion/types';
import { SnackbarUtilities } from '../utils/snackbar/SnackbarUtilities';
import { CONFIGURACION_VIA, ESTADO_AMBIENTAL, ESTADO_CALZADA, ESTADO_FISICO_CALZADA, LUZ_ARTIFICIAL, MATERIAL_CALZADA, OptionNumber, OptionString, POSIBLES_CAUSAS, SEMAFORO, TIPO_VIA, TIPOS_COLISION, TIPOS_INVOLUCRADOS, TIPOS_SINIESTRO } from '../features/hechos-viales/values';
import { SkeletonForm } from '../components/ui/skeleton/SkeletonForm';
import { useCatalogos } from '../api/hooks/catalogos';

export { TIPOS_INVOLUCRADOS };

const ErrorText = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

interface Props {
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

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es-AR');
}

function findDepartamentoByNombre(
  catalogos: Catalogos,
  nombre: string
) {
  const target = normalizeText(nombre);
  for (const ur of catalogos.unidadesRegionales) {
    for (const departamento of ur.departamentos) {
      if (normalizeText(departamento.nombre) === target) {
        return { ur, departamento };
      }
    }
  }
  return null;
}

function findDepartamentoByLocalidad(
  catalogos: Catalogos,
  localidadId: number
) {
  for (const ur of catalogos.unidadesRegionales) {
    for (const departamento of ur.departamentos) {
      if (departamento.localidades.some((loc) => loc.id === localidadId)) {
        return { ur, departamento };
      }
    }
  }
  return null;
}

export const HechoVialFormRN: React.FC<Props> = ({
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
    reset,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
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

  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [unidadesRegionales, setUnidadesRegionales] = useState<Array<{ idUr: number; nombre: string }>>([]);
  const { data: catalogos, isLoading: isLoadingCatalogs, error: catalogosError } = useCatalogos();

  const [ubicLat, setUbicLat] = useState<string | null>(null);
  const [ubicLng, setUbicLng] = useState<string | null>(null);
  const [ubicDepartamento, setUbicDepartamento] = useState<string | null>(null);
  const [ubicUnidadRegional, setUbicUnidadRegional] = useState<number | null>(null);
  const [ubicLocalidad, setUbicLocalidad] = useState<number | null>(null);
  const [ubicDescripcion, setUbicDescripcion] = useState('');
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const isLoadingUr = false;
  const urError = null;

  const watchInvolucrados = useWatch({ control, name: 'involucrados' });
  const tipoSiniestro = watch('tipoSiniestro');
  const tipoVia = watch('tipoVia');
  const estadoFisicoCalzada = watch('estadoFisicoCalzada');
  const estadoCalzada = watch('estadoCalzada');
  const [estadoFisicoCalzadaModo, setEstadoFisicoCalzadaModo] = useState<string | null>(null);

  useEffect(() => {
    const raw = (estadoFisicoCalzada ?? '').trim();
    if (!raw) {
      setEstadoFisicoCalzadaModo(null);
      return;
    }

    const option = ESTADO_FISICO_CALZADA.find((item) => item === raw);
    setEstadoFisicoCalzadaModo(option ?? 'OTRO');
  }, [estadoFisicoCalzada]);

  useEffect(() => {
    if (modo === 'create' && !hechoVial) {
      reset(defaultValues);
      setUbicDepartamento(null);
      setUbicUnidadRegional(null);
      setUbicLocalidad(null);
      setUbicLat(null);
      setUbicLng(null);
      setUbicDescripcion('');
      setUnidadesRegionales([]);
      setLocalidades([]);
      return;
    }

    if (modo !== 'edit' || !hechoVial) return;

    reset(hechoVial);

    const ub = hechoVial.ubicacionReq ?? defaultUbicacion;
    console.log('Hecho vial edit init:', {
      hechoVialId: hechoVial.id,
      ubicacionReq: ub,
      departamento: ub.departamento,
      unidadRegional: ub.unidadRegional,
      localidad: ub.localidad,
      catalogosListos: Boolean(catalogos?.unidadesRegionales?.length),
    });
    setUbicacionError(null);
    setUbicLat(ub.lat ? String(ub.lat) : null);
    setUbicLng(ub.lng ? String(ub.lng) : null);
    setUbicDescripcion(ub.descripcion ?? '');

    const departamentoInicial = (ub.departamento ?? '').trim() || null;
    const unidadRegionalInicial = ub.unidadRegional ?? null;
    const localidadInicial = ub.localidad ?? null;

    if (!catalogos?.unidadesRegionales?.length) {
      setUbicDepartamento(departamentoInicial);
      setUbicUnidadRegional(unidadRegionalInicial);
      setUbicLocalidad(localidadInicial);
      return;
    }

    let departamentoResuelto: string | null = departamentoInicial;
    let unidadRegionalResuelta = unidadRegionalInicial;
    let localidadResuelta = localidadInicial;
    let localidadesResueltas: Localidad[] = [];
    let unidadesResueltas: Array<{ idUr: number; nombre: string }> = [];

    const porUnidadRegional =
      unidadRegionalInicial !== null
        ? (() => {
            const ur = catalogos.unidadesRegionales.find((item) => item.idUr === unidadRegionalInicial);
            if (!ur) return null;

            const departamento =
              (localidadInicial !== null
                ? ur.departamentos.find((d) => d.localidades.some((loc) => loc.id === localidadInicial))
                : null) ??
              (departamentoInicial
                ? ur.departamentos.find((d) => normalizeText(d.nombre) === normalizeText(departamentoInicial))
                : null) ??
              ur.departamentos[0] ??
              null;

            return departamento ? { ur, departamento } : null;
          })()
        : null;

    const porLocalidad =
      localidadInicial !== null ? findDepartamentoByLocalidad(catalogos, localidadInicial) : null;

    const porNombre = departamentoInicial ? findDepartamentoByNombre(catalogos, departamentoInicial) : null;

    const match = porLocalidad ?? porUnidadRegional ?? porNombre;

    if (match) {
      departamentoResuelto = match.departamento.nombre;
      unidadesResueltas = catalogos.unidadesRegionales
        .filter((ur) =>
          ur.departamentos.some(
            (d) => normalizeText(d.nombre) === normalizeText(match.departamento.nombre)
          )
        )
        .map((ur) => ({ idUr: ur.idUr, nombre: ur.nombre }));

      localidadesResueltas = match.departamento.localidades ?? [];

      if (unidadRegionalResuelta === null) {
        unidadRegionalResuelta = match.ur.idUr;
      }

      if (
        localidadResuelta !== null &&
        !localidadesResueltas.some((loc) => loc.id === localidadResuelta)
      ) {
        localidadResuelta = null;
      }
    }

    setUbicDepartamento(departamentoResuelto);
    setUbicUnidadRegional(unidadRegionalResuelta);
    setUbicLocalidad(localidadResuelta);
    setUnidadesRegionales(unidadesResueltas);
    setLocalidades(localidadesResueltas);
  }, [catalogos, hechoVial, modo, reset]);

  useEffect(() => {
    const depto = (ubicDepartamento ?? '').trim();
    if (!depto) {
      setUnidadesRegionales([]);
      setLocalidades([]);
      return;
    }

    if (!catalogos?.unidadesRegionales?.length) {
      return;
    }

    const unidades = catalogos.unidadesRegionales
      .filter((ur) => ur.departamentos.some((d) => normalizeText(d.nombre) === normalizeText(depto)))
      .map((ur) => ({ idUr: ur.idUr, nombre: ur.nombre }));

    setUnidadesRegionales(unidades);

    const deptoData = findDepartamentoByNombre(catalogos, depto)?.departamento;

    const localidadesDisponibles = deptoData?.localidades ?? [];
    setLocalidades(localidadesDisponibles);

    if (ubicUnidadRegional !== null && !unidades.some((u) => u.idUr === ubicUnidadRegional)) {
      setUbicUnidadRegional(null);
    }

    if (ubicLocalidad !== null && !localidadesDisponibles.some((l) => l.id === ubicLocalidad)) {
      setUbicLocalidad(null);
    }
  }, [catalogos, ubicDepartamento, ubicLocalidad, ubicUnidadRegional]);

  const puestosOptions = useMemo<OptionNumber[]>(
    () => (catalogos?.puestos ?? []).map((p) => ({ label: p.nombre, value: p.idPuesto })),
    [catalogos]
  );
  const gruposOptions = useMemo<OptionNumber[]>(
    () => (catalogos?.grupos ?? []).map((g) => ({ label: g.nombre, value: g.idGrupo })),
    [catalogos]
  );

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

  function onDepartamentoChanged(departamento: string | null) {
    const depto = (departamento ?? '').trim();
    setUbicDepartamento(depto || null);
    setUbicUnidadRegional(null);
    setUbicLocalidad(null);
    if (!depto) {
      setUnidadesRegionales([]);
      setLocalidades([]);
    }
  }

  function onUnidadRegionalChanged(id: number | null) {
    setUbicUnidadRegional(id);
    setUbicLocalidad(null);

    if (!id || !ubicDepartamento) {
      setLocalidades([]);
      return;
    }

    const depto = catalogos?.unidadesRegionales
      .find((u) => u.idUr === id)
      ?.departamentos.find((d) => normalizeText(d.nombre) === normalizeText(ubicDepartamento));

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

  const submitHechoVial = async () => {
      const data = getValues();
      const protagonistasNormalizados = data.protagonistas.map((protagonista) => ({
        ...protagonista,
        licenciaRequest: normalizeLicenciaRequest(protagonista.licenciaRequest),
        //graduacionAlcoholica: protagonista.seHizoElTest ? protagonista.graduacionAlcoholica : null,
      }));

      const payload: HechoVialForm = {
        ...data,
        protagonistas: protagonistasNormalizados,
        ubicacionReq,
      };

      console.log('Hecho vial submit body:', payload);
      clearErrors('protagonistas');
      const parsed = hechoVialFormSchema.safeParse(payload);
      if (!parsed.success) {
        console.log(
          'Hecho vial validation issues:',
          parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          }))
        );

        const messages = parsed.error.issues.map((issue) => {
          const path = issue.path.join('.');
          return path ? `${path}: ${issue.message}` : issue.message;
        });

        for (const issue of parsed.error.issues) {
          const fieldPath = issue.path.join('.');
          if (fieldPath) {
            setError(fieldPath as any, { type: 'manual', message: issue.message });
          }
        }

        if (messages.length > 0) {
          Alert.alert('Errores de validación', messages.slice(0, 6).join('\n'));
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
      {catalogosError ? (
        <Text style={styles.errorText}>{catalogosError instanceof Error ? catalogosError.message : 'Error cargando catálogos.'}</Text>
      ) : null}

      <ControlledPicker
        control={control}
        name="destacamento"
        label="Destacamento *"
        options={puestosOptions}
        numeric
        placeholder="Seleccioná un destacamento"
      />

      <ControlledPicker
        control={control}
        name="grupo"
        label="Seleccionar grupo *"
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
              label="Fecha *"
              placeholder="Seleccioná una fecha"
              value={field.value == null ? null : String(field.value)}
              onChangeValue={(v) => field.onChange(v ?? '')}
              allowClear
            />
            <ErrorText message={fieldState.error?.message} />
          </View>
        )}
      />
      <ControlledInput control={control} name="hora" label="Hora *" placeholder="HH:MM:SS" />
      <ControlledInput control={control} name="comisaria" label="Comisaría *" placeholder="Ej. Seccional 3" />

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
          ubicLat && ubicLng && ubicDepartamento && ubicLocalidad !== null && ubicUnidadRegional !== null
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
        label="¿Víctima Fatal? *"
        options={['SI', 'NO']}
      />

      <ControlledSegment
        control={control}
        name="zona"
        label="Zona *"
        options={['URBANA', 'RURAL']}
      />

      <ControlledSegment
        control={control}
        name="danosMateriales"
        label="Daños Materiales *"
        options={['SI', 'NO']}
      />

      <ControlledPicker
        control={control}
        name="tipoVia"
        label="Tipo de Vía *"
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
              label="Cantidad *"
              keyboardType="numeric"
            />

            <ControlledPicker
              control={control}
              name={`involucrados.${index}.tipo`}
              label="Tipo de Vehículo/Persona *"
              options={TIPOS_INVOLUCRADOS.map((x) => ({ label: x, value: x }))}
            />

            {item?.tipo === 'OTRO' && (
              <ControlledInput
                control={control}
                name={`involucrados.${index}.especificarOtro`}
                label="Especificar otro *"
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
        label="Configuración de la Vía *"
        options={CONFIGURACION_VIA.map((x) => ({ label: x, value: x }))}
      />

      <Controller
        control={control}
        name="estadoFisicoCalzada"
        render={({ field, fieldState }) => (
          <View style={styles.fieldContainer}>
            <SelectFieldString
              label="Estado físico de la calzada *"
              placeholder="Seleccioná un estado"
              value={estadoFisicoCalzadaModo}
              options={ESTADO_FISICO_CALZADA.map((x) => ({ label: x, value: x }))}
              onChangeValue={(next) => {
                setEstadoFisicoCalzadaModo(next);
                if (!next) {
                  field.onChange('');
                  return;
                }
                if (next !== 'OTRO') {
                  field.onChange(next);
                } else {
                  field.onChange('');
                }
              }}
              allowClear
            />

            {estadoFisicoCalzadaModo === 'OTRO' ? (
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Especificar estado físico *</Text>
                <TextInput
                  value={estadoFisicoCalzada === 'OTRO' ? '' : estadoFisicoCalzada}
                  onChangeText={(text) => field.onChange(text)}
                  placeholder="Escribí el estado físico"
                  style={styles.input}
                />
              </View>
            ) : null}

            <ErrorText message={fieldState.error?.message} />
          </View>
        )}
      />

      <ControlledPicker
        control={control}
        name="estadoCalzada"
        label="Condición de superficie *"
        options={ESTADO_CALZADA.map((x) => ({ label: x, value: x }))}
      />

      {estadoCalzada === 'OTRO' && (
        <ControlledInput control={control} name="estadoCalzada" label="Especificar condición" />
      )}

      <ControlledPicker
        control={control}
        name="estadoAmbiental"
        label="Estado Ambiental *"
        options={ESTADO_AMBIENTAL.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="semaforo"
        label="Semáforo *"
        options={SEMAFORO.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="luzArtificial"
        label="Luz Artificial *"
        options={LUZ_ARTIFICIAL.map((x) => ({ label: x, value: x }))}
      />

      <ControlledPicker
        control={control}
        name="materialCalzada"
        label="Material de la calzada *"
        options={MATERIAL_CALZADA.map((x) => ({ label: x, value: x }))}
      />

      <SectionTitle title="Tipo de Siniestro" />

      <ControlledPicker
        control={control}
        name="tipoSiniestro"
        label="Tipo de Siniestro *"
        options={TIPOS_SINIESTRO}
      />

      {tipoSiniestro === 'COLISIÓN ENTRE VEHÍCULOS' && (
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
            label="Seleccionar causas *"
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
        label="Síntesis del Hecho *"
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

      <SeccionProtagonistasRN control={control} watch={watch} setValue={setValue} clearErrors={clearErrors} />
      <SeccionPeatonRN control={control} setValue={setValue} />

        <AppButton title="Generar Informe Oficial" icon="send" onPress={() => void submitHechoVial()} />
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
      <ControlledInput control={control} name={`unidades.${index}.unidad`} label="Unidad *" />

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
                label="Apellido y nombre *"
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
                label="Jerarquía/cargo *"
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
