import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ActaRequest, TestigoRequest } from '../features/actas/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { getGrupos } from '../services/GrupoService';
import { getPuestos } from '../services/PuestoService';
import { getAllTipoActas } from '../services/TipoActaService';
import { getLeyes } from '../services/LeyService';
import { getArticulosByLey } from '../services/ArticuloService';
import type { Articulo, Grupo, Ley, Puesto, Tipo } from '../features/catalog/types';
import { MapaJujuyLeaflet } from '../components/map/MapaJujuyLeaflet';
import { findDepartamento } from '../features/geo/findDepartamento';
import { DEPARTAMENTOS_JUJUY } from '../features/geo/jujuyGeoJson';
import { obtenerUnidadesRegionalesPorDepartamento } from '../services/UnidadRegionalService';
import type { Localidad, UnidadRegional } from '../features/ubicacion/types';
import { MultiSelectPicker } from '../components/forms/MultiSelectPicker';
import { findInfractorByDni } from '../services/InfractorService';
import { HttpError } from '../api/http';
import type { Vehiculo as VehiculoBackend } from '../features/infractores/types';
// import { SignaturePadSkia } from '../components/signature/SignaturePadSkia';
import { PhotoPicker, type PhotoValue } from '../components/media/PhotoPicker';
import { OcrService } from '../services/OcrService';
import { actualizarActa, crearActa } from '../services/ActaService';
import { AppButton } from '../components/ui/AppButton';
import * as Location from 'expo-location';
import { obtenerJuzgadosParaActas, type Juzgado } from '../services/JuzgadoService';
import { styles } from '../components/ui/styles';
import { SelectField } from '../components/ui/SelectedFieldString';
import { Field } from '../components/ui/Field';
import { UbicacionSection } from '../components/map/UbicacionSection';
import { Section } from '../components/ui/Section';
import { SnackbarUtilities } from '../utils/snackbar/SnackbarUtilities';
import { TIPOS_INVOLUCRADOS } from './HechosVialesScreen';

type ActaFormTabKey = 'acta' | 'infractor' | 'vehiculo' | 'firma';
type DatePickerTarget = 'acta_fecha' | 'infractor_nacimiento' | 'licencia_expedicion' | 'licencia_vencimiento';

export function NuevaActaScreen({
  editActa,
  onEditActaConsumed,
}: {
  editActa?: ActaRequest | null;
  onEditActaConsumed?: () => void;
}) {
  const OTRO_VEHICULO_ID = -1;
  const [tab, setTab] = useState<ActaFormTabKey>('acta');
  const insets = useSafeAreaInsets();

  const { jwt } = useAuth();
  const [deviceId] = useState(
    () => `${Platform.OS}-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`
  );

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [leyes, setLeyes] = useState<Ley[]>([]);
  const [juzgados, setJuzgados] = useState<Juzgado[]>([]);
  const [articulosByLey, setArticulosByLey] = useState<Articulo[]>([]);
  const [articulosById, setArticulosById] = useState<Record<number, Articulo>>({});
  const [articuloLeyById, setArticuloLeyById] = useState<Record<number, number>>({});
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [isLoadingArticulos, setIsLoadingArticulos] = useState(false);
  const [articulosError, setArticulosError] = useState<string | null>(null);

  const [idGrupo, setIdGrupo] = useState<number | null>(null);
  const [idTipo, setIdTipo] = useState<number | null>(null);
  const [idPuesto, setIdPuesto] = useState<number | null>(null);
  const [idActa, setIdActa] = useState<number | null>(null);
  const [idLey, setIdLey] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [nro, setNro] = useState('');
  const [articulosSeleccionados, setArticulosSeleccionados] = useState<number[]>([]);

  const [infractorNombre, setInfractorNombre] = useState('');
  const [infractorApellido, setInfractorApellido] = useState('');
  const [infractorDni, setInfractorDni] = useState('');
  const [infractorNacionalidad, setInfractorNacionalidad] = useState('');
  const [infractorDomicilio, setInfractorDomicilio] = useState('');
  const [infractorLocalidad, setInfractorLocalidad] = useState('');
  const [infractorProvincia, setInfractorProvincia] = useState('');
  const [infractorPropietario, setInfractorPropietario] = useState(false);
  const [infractorFechaNacimiento, setInfractorFechaNacimiento] = useState('');
  const [infractorIdInfrac, setInfractorIdInfrac] = useState<number | null>(null);
  const [licenciaId, setLicenciaId] = useState<number | null>(null);
  const [isSearchingInfractor, setIsSearchingInfractor] = useState(false);
  const [infractorSearchMessage, setInfractorSearchMessage] = useState<string | null>(null);
  const [licenciaClase, setLicenciaClase] = useState('');
  const [licenciaNumero, setLicenciaNumero] = useState('');
  const [licenciaAutoridadExpedicion, setLicenciaAutoridadExpedicion] = useState('');
  const [licenciaFechaExpedicion, setLicenciaFechaExpedicion] = useState('');
  const [licenciaFechaVencimiento, setLicenciaFechaVencimiento] = useState('');

  const [vehiculoDominio, setVehiculoDominio] = useState('');
  const [vehiculoMarca, setVehiculoMarca] = useState('');
  const [vehiculoModelo, setVehiculoModelo] = useState('');
  const [vehiculoTipoRodado, setVehiculoTipoRodado] = useState<string>('');
  const [vehiculoIdVeh, setVehiculoIdVeh] = useState<number | null>(null);
  const [vehiculosEncontrados, setVehiculosEncontrados] = useState<VehiculoBackend[]>([]);
  const [vehiculoSeleccionadoId, setVehiculoSeleccionadoId] = useState<number | null>(null);
  const [propietarioNombre, setPropietarioNombre] = useState('');
  const [propietarioApellido, setPropietarioApellido] = useState('');
  const [propietarioDni, setPropietarioDni] = useState('');
  const [propietarioDireccion, setPropietarioDireccion] = useState('');

  const [ubicLat, setUbicLat] = useState('');
  const [ubicLng, setUbicLng] = useState('');
  const [ubicDepartamento, setUbicDepartamento] = useState('');
  const [ubicDescripcion, setUbicDescripcion] = useState('');
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [unidadesRegionales, setUnidadesRegionales] = useState<UnidadRegional[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [ubicUnidadRegional, setUbicUnidadRegional] = useState<number | null>(null);
  const [ubicLocalidad, setUbicLocalidad] = useState<number | null>(null);
  const [isLoadingUr, setIsLoadingUr] = useState(false);
  const [urError, setUrError] = useState<string | null>(null);

  const [adjuntaSeleccionadas, setAdjuntaSeleccionadas] = useState<string[]>([]);
  const [retencion, setRetencion] = useState('');
  const [retencionVehiculo, setRetencionVehiculo] = useState(false);
  const [graduacionAlcoholica, setGraduacionAlcoholica] = useState('');
  const [infractorFugado, setInfractorFugado] = useState(false);
  const [juzgadoId, setJuzgadoId] = useState<number | null>(null);

  const skipClearArticulosOnLeyChangeRef = useRef(false);
  const pendingInferLeyArticulosRef = useRef<number[] | null>(null);

  /*
  const [firmaSeNegoAFirmar, setFirmaSeNegoAFirmar] = useState(false);
  const [firmaInfractorBase64, setFirmaInfractorBase64] = useState<string | null>(null);
  const [firmaOficialBase64, setFirmaOficialBase64] = useState('');
  */
  const [firmaTestigos, setFirmaTestigos] = useState<[TestigoRequest, TestigoRequest]>(() => [
    { nombre: '', apellido: '', dni: '', domicilio: '' },
    { nombre: '', apellido: '', dni: '', domicilio: '' },
  ]);

  function updateFirmaTestigo(index: 0 | 1, patch: Partial<TestigoRequest>) {
    setFirmaTestigos((prev) => {
      const next: [TestigoRequest, TestigoRequest] = [{ ...prev[0] }, { ...prev[1] }];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function openDatePicker(target: DatePickerTarget, mode: 'date' | 'datetime', currentText: string) {
    const now = new Date();
    const fallback = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };

    const parsed = mode === 'datetime' ? parseDdMmYyyyHhMm(currentText) : parseDdMmYyyy(currentText);

    setDatePicker({
      target,
      mode,
      year: parsed?.year ?? fallback.year,
      month: parsed?.month ?? fallback.month,
      day: parsed?.day ?? fallback.day,
      hour: mode === 'datetime' ? (parsed as any)?.hour ?? fallback.hour : fallback.hour,
      minute: mode === 'datetime' ? (parsed as any)?.minute ?? fallback.minute : fallback.minute,
      initialValueText: currentText,
    });
  }

  function applyDatePickerValue(state: NonNullable<typeof datePicker>) {
    const dd = String(state.day).padStart(2, '0');
    const mm = String(state.month).padStart(2, '0');
    const yyyy = String(state.year);
    const dateText = `${dd}-${mm}-${yyyy}`;

    if (state.mode === 'datetime') {
      const hh = String(state.hour).padStart(2, '0');
      const min = String(state.minute).padStart(2, '0');
      setFecha(`${dateText} ${hh}:${min}`);
      return;
    }

    switch (state.target) {
      case 'infractor_nacimiento':
        setInfractorFechaNacimiento(dateText);
        return;
      case 'licencia_expedicion':
        setLicenciaFechaExpedicion(dateText);
        return;
      case 'licencia_vencimiento':
        setLicenciaFechaVencimiento(dateText);
        return;
      case 'acta_fecha':
        setFecha(dateText);
        return;
    }
  }

  const [licenciaNacFoto, setLicenciaNacFoto] = useState<PhotoValue | null>(null);
  const [cedulaFrenteFoto, setCedulaFrenteFoto] = useState<PhotoValue | null>(null);
  const [cedulaDorsoFoto, setCedulaDorsoFoto] = useState<PhotoValue | null>(null);
  const [isOcrLicBusy, setIsOcrLicBusy] = useState(false);
  const [ocrLicMessage, setOcrLicMessage] = useState<string | null>(null);
  const [isOcrCedulaFrenteBusy, setIsOcrCedulaFrenteBusy] = useState(false);
  const [ocrCedulaFrenteMessage, setOcrCedulaFrenteMessage] = useState<string | null>(null);
  const [isOcrCedulaDorsoBusy, setIsOcrCedulaDorsoBusy] = useState(false);
  const [ocrCedulaDorsoMessage, setOcrCedulaDorsoMessage] = useState<string | null>(null);

  const [isSavingActa, setIsSavingActa] = useState(false);
  const [saveActaMessage, setSaveActaMessage] = useState<string | null>(null);

  const [datePicker, setDatePicker] = useState<{
    target: DatePickerTarget;
    mode: 'date' | 'datetime';
    year: number;
    month: number; // 1-12
    day: number; // 1-31
    hour: number; // 0-23
    minute: number; // 0-59
    initialValueText: string;
  } | null>(null);

  useEffect(() => {
    if (!datePicker) return;
    const maxDay = daysInMonth(datePicker.year, datePicker.month);
    if (datePicker.day <= maxDay) return;
    setDatePicker((prev) => (prev ? { ...prev, day: maxDay } : prev));
  }, [datePicker?.year, datePicker?.month]);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalogs() {
      setCatalogsError(null);
      setIsLoadingCatalogs(true);
      try {
        const [gruposRes, tiposRes, puestosRes, leyesRes, juzgadosRes] = await Promise.all([
          getGrupos(jwt),
          getAllTipoActas(jwt),
          getPuestos(jwt),
          getLeyes(jwt),
          obtenerJuzgadosParaActas(jwt),
        ]);
        if (!isMounted) return;
        setGrupos(gruposRes);
        setTipos(tiposRes);
        setPuestos(puestosRes);
        setLeyes(leyesRes);
        setJuzgados(juzgadosRes);
      } catch (e) {
        if (!isMounted) return;
        setCatalogsError(e instanceof Error ? e.message : 'Error cargando catálogos');
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

    async function loadArticulosForLey() {
      setArticulosError(null);
      setArticulosByLey([]);

      if (!idLey) {
        return;
      }

      setIsLoadingArticulos(true);
      try {
        const data = await getArticulosByLey(idLey, jwt);
        if (!isMounted) return;
        setArticulosByLey(data);
        setArticulosById((prev) => {
          const next = { ...prev };
          for (const a of data) next[a.idArt] = a;
          return next;
        });
        setArticuloLeyById((prev) => {
          const next = { ...prev };
          for (const a of data) next[a.idArt] = idLey;
          return next;
        });
      } catch (e) {
        if (!isMounted) return;
        setArticulosError(e instanceof Error ? e.message : 'Error cargando artÃ­culos');
      } finally {
        if (!isMounted) return;
        setIsLoadingArticulos(false);
      }
    }

    loadArticulosForLey();
    return () => {
      isMounted = false;
    };
  }, [idLey, jwt]);

  useEffect(() => {
    if (!fecha) setFecha(formatNowAsDdMmYyyyHhMm());
  }, [fecha]);

  useEffect(() => {
    const pending = pendingInferLeyArticulosRef.current;
    if (!pending || !pending.length) return;
    if (!leyes.length) return;
    pendingInferLeyArticulosRef.current = null;
    void inferLeyForArticulos(pending);
  }, [leyes, jwt]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnidadesRegionales() {
      setUrError(null);
      setUnidadesRegionales([]);
      setLocalidades([]);
      if (!ubicDepartamento) {
        setUbicUnidadRegional(null);
        setUbicLocalidad(null);
        return;
      }

      setIsLoadingUr(true);
      try {
        const data = await obtenerUnidadesRegionalesPorDepartamento(ubicDepartamento, jwt);
        if (!isMounted) return;
        setUnidadesRegionales(data);
      } catch (e) {
        if (!isMounted) return;
        setUrError(e instanceof Error ? e.message : 'Error cargando unidades regionales');
      } finally {
        if (!isMounted) return;
        setIsLoadingUr(false);
      }
    }

    loadUnidadesRegionales();
    return () => {
      isMounted = false;
    };
  }, [jwt, ubicDepartamento]);

  useEffect(() => {
    if (!ubicUnidadRegional || !ubicDepartamento || !unidadesRegionales.length) {
      setLocalidades([]);
      return;
    }

    const depto = unidadesRegionales
      .find((u) => u.idUr === ubicUnidadRegional)
      ?.departamentos.find((d) => d.nombre === ubicDepartamento);

    setLocalidades(depto?.localidades ?? []);
  }, [ubicDepartamento, ubicUnidadRegional, unidadesRegionales]);

  const selectedTipo = useMemo(() => {
    if (idTipo == null) return null;
    return tipos.find((t) => t.idTipo === idTipo) ?? null;
  }, [idTipo, tipos]);

  const isAutomaticTipo = useMemo(() => {
    const label = `${selectedTipo?.detalle ?? ''} ${selectedTipo?.descripcion ?? ''}`.trim();
    return /automatico/i.test(label);
  }, [selectedTipo]);

  useEffect(() => {
    if (isAutomaticTipo) setNro('');
  }, [isAutomaticTipo]);

  useEffect(() => {
    if (infractorPropietario) {
      setPropietarioNombre('');
      setPropietarioApellido('');
      setPropietarioDni('');
      setPropietarioDireccion('');
    }
  }, [infractorPropietario]);

  useEffect(() => {
    if (!vehiculoSeleccionadoId || vehiculoSeleccionadoId === OTRO_VEHICULO_ID) {
      setVehiculoIdVeh(null);
      return;
    }

    const selected = vehiculosEncontrados.find((v) => v.idVeh === vehiculoSeleccionadoId) ?? null;
    if (!selected) return;

    setVehiculoIdVeh(selected.idVeh ?? null);
    setVehiculoDominio(selected.dominio ?? '');
    setVehiculoMarca(selected.marca ?? '');
    setVehiculoModelo(selected.modelo ?? '');

    if (!infractorPropietario) {
      const prop = selected.propietario ?? null;
      setPropietarioNombre(prop?.nombre ?? '');
      setPropietarioApellido(prop?.apellido ?? '');
      setPropietarioDni(prop?.dni ?? '');
      setPropietarioDireccion(prop?.direccion ?? '');
    }
  }, [infractorPropietario, vehiculoSeleccionadoId, vehiculosEncontrados]);

  async function fetchInfractorByDni() {
    const dni = infractorDni.trim();

    if (dni.length !== 8) {
      clearInfractorAutofill();
      return;
    }

    setInfractorSearchMessage(null);
    setIsSearchingInfractor(true);
    try {
      const data = await findInfractorByDni(dni, jwt);

      const isInfractorOwner = data.propietario ?? true;
      const vehiculosFromBackend = data.vehiculos ?? [];
      const licencia = (data.licencias ?? [])[0] ?? null;

      const normalized = normalizeInfractorNombreApellido({
        nombre: data.nombre ?? '',
        apellido: data.apellido ?? '',
      });

      setInfractorIdInfrac(data.idInfrac ?? null);
      setInfractorNombre(normalized.nombre);
      setInfractorApellido(normalized.apellido);
      setInfractorDni(data.dni ?? dni);
      setInfractorDomicilio(data.domicilio ?? '');
      setInfractorNacionalidad((data.nacionalidad ?? '') || '');
      setInfractorLocalidad((data.localidad ?? '') || '');
      setInfractorProvincia((data.provincia ?? '') || '');
      setInfractorFechaNacimiento(isoToDdMmYyyy(data.fechaNacimiento) ?? '');
      setInfractorPropietario(isInfractorOwner);

      setLicenciaId(licencia?.id ?? null);
      setLicenciaClase(licencia?.clase ?? '');
      setLicenciaNumero(licencia?.numero ?? '');
      setLicenciaAutoridadExpedicion(licencia?.autoridadExpedicion ?? '');
      setLicenciaFechaExpedicion(isoToDdMmYyyy(licencia?.fechaExpedicion) ?? '');
      setLicenciaFechaVencimiento(isoToDdMmYyyy(licencia?.fechaVencimiento) ?? '');

      setVehiculosEncontrados(vehiculosFromBackend);
      setVehiculoSeleccionadoId(vehiculosFromBackend.length === 1 ? vehiculosFromBackend[0]?.idVeh ?? null : null);
      // Se completa el formulario de vehiculo recien cuando se selecciona uno
      setVehiculoIdVeh(null);
      setVehiculoDominio('');
      setVehiculoMarca('');
      setVehiculoModelo('');
      setVehiculoTipoRodado('')

      setInfractorSearchMessage('Infractor encontrado.');
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) {
        setInfractorSearchMessage('Infractor no encontrado, continue completando los datos.');
      } else {
        setInfractorSearchMessage(e instanceof Error ? e.message : 'Error buscando infractor.');
      }
      clearInfractorAutofill();
    } finally {
      setIsSearchingInfractor(false);
    }
  }

  async function inferLeyForArticulos(articuloIds: number[]) {
    const ids = (articuloIds ?? []).filter((n) => Number.isFinite(n));
    if (!ids.length) {
      setIdLey(null);
      return;
    }
    if (!leyes.length) {
      pendingInferLeyArticulosRef.current = ids;
      return;
    }

    console.log('Inferir ley para artículos', ids);
    for (const ley of leyes) {
      try {
        const arts = await getArticulosByLey(ley.idLey, jwt);
        const allowed = new Set(arts.map((a) => a.idArt));
        const matches = ids.every((id) => allowed.has(id));
        if (matches) {
          skipClearArticulosOnLeyChangeRef.current = true;
          setIdLey(ley.idLey);
          console.log('Ley inferida', { idLey: ley.idLey, nro: ley.nro });
          return;
        }
      } catch {
        // ignora y sigue probando
      }
    }

    setArticulosError('No se pudo determinar la ley para los artículos del acta. Seleccionala manualmente.');
  }

  async function obtenerUbicacionActual() {
    setUbicacionError(null);
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUbicacionError('Permiso de ubicacion denegado. Habilitalo para obtener coordenadas.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const departamento = findDepartamento(lat, lng, DEPARTAMENTOS_JUJUY);
      if (!departamento) {
        setUbicacionError('La ubicacion detectada esta fuera de Jujuy. Ajustala manualmente en el mapa.');
        setUbicLat(lat.toFixed(6));
        setUbicLng(lng.toFixed(6));
        setIsMapOpen(true);
        return;
      }

      setUbicLat(lat.toFixed(6));
      setUbicLng(lng.toFixed(6));
      setUbicDepartamento(departamento);
      setIsMapOpen(true);
    } catch (e) {
      setUbicacionError(e instanceof Error ? e.message : 'No se pudo obtener la ubicacion.');
    } finally {
      setIsLocating(false);
    }
  }

  function formatOcrError(context: string, err: unknown, photo: PhotoValue): string {
    const meta = `Documento: ${context}\nuri: ${photo.uri}\nfileName: ${photo.fileName ?? ''}\nmimeType: ${photo.mimeType ?? ''}`;

    if (err instanceof HttpError) {
      const body = (err.bodyText ?? '').slice(0, 2000);
      return `${meta}\n\n${err.message}\n\nBody:\n${body || '(vacío)'}`;
    }

    if (err instanceof Error) {
      return `${meta}\n\n${err.message}`;
    }

    return `${meta}\n\nError procesando OCR.`;
  }

  async function guardarActa() {
    setSaveActaMessage(null);

    if (!idGrupo) {
      setSaveActaMessage('Falta seleccionar Grupo.');
      return;
    }
    if (!idTipo) {
      setSaveActaMessage('Falta seleccionar Tipo.');
      return;
    }
    if (!fecha.trim()) {
      setSaveActaMessage('Falta completar fecha.');
      return;
    }
    if (infractorFugado) {
      const normalized = firmaTestigos.map((t) => ({
        nombre: (t.nombre ?? '').trim(),
        apellido: (t.apellido ?? '').trim(),
        dni: (t.dni ?? '').trim(),
        domicilio: (t.domicilio ?? '').trim() || undefined,
      }));

      const isValid = normalized.length === 2 && normalized.every((t) => t.nombre && t.apellido && t.dni);
      if (!isValid) {
        setTab('firma');
        setSaveActaMessage(
          'Si el infractor está fugado, debe cargar exactamente 2 testigos (nombre, apellido y DNI).'
        );
        return;
      }
    }

    setIsSavingActa(true);
    try {
      console.log('ActaRequest (draft):', actaDraft);
      const saved = isEditing
        ? await actualizarActa(actaDraft as ActaRequest, jwt)
        : await crearActa(actaDraft as ActaRequest, jwt);
      console.log(isEditing ? 'Acta actualizada:' : 'Acta creada:', saved);
      SnackbarUtilities.success('Acta guardada exitosamente');
      setSaveActaMessage(
        `${isEditing ? 'Acta actualizada' : 'Acta enviada'}. idActa: ${(saved as any)?.idActa ?? '(sin id)'}`
      );
      resetActaForm();
    } catch (e) {
      if (e instanceof HttpError) {
        //const body = (e.bodyText ?? '').slice(0, 2000);
        //setSaveActaMessage(`${e.message}\n\nBody:\n${body || '(vacío)'}`);
        setSaveActaMessage('No se pudo guardar el acta');
      } else {
        setSaveActaMessage(e instanceof Error ? e.message : 'Error guardando acta.');
      }
    } finally {
      setIsSavingActa(false);
    }
  }

  useEffect(() => {
    if (!editActa) return;

    console.log('Editar acta: cargando en formulario', editActa);
    setTab('acta');
    setSaveActaMessage(null);

    setIdActa(editActa.idActa ?? null);
    setIdGrupo(editActa.idGrupo ?? null);
    setIdTipo(editActa.idTipo ?? null);
    setIdPuesto(editActa.idPuesto ?? null);
    setFecha(isoLocalDateTimeToDdMmYyyyHhMm(editActa.fecha ?? ''));
    setMotivo(editActa.motivo ?? null);
    setNro(editActa.nro ?? '');
    setJuzgadoId(editActa.juzgado ?? 1)
    setInfractorFugado(editActa.infractorFugado ?? false)
    setRetencionVehiculo(editActa.retencionVehiculo ?? false)
    pendingInferLeyArticulosRef.current = (editActa.articulos ?? []).length ? (editActa.articulos ?? []) : null;
    setIdLey(null);
    setArticulosSeleccionados(editActa.articulos ?? []);
    if ((editActa.articulos ?? []).length) {
      void inferLeyForArticulos(editActa.articulos ?? []);
    }

    setAdjuntaSeleccionadas(
      (editActa.adjunta ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    setRetencion(editActa.retencion ?? '');
    setRetencionVehiculo(!!editActa.retencionVehiculo);
    setGraduacionAlcoholica(editActa.graduacionAlcoholica ? String(editActa.graduacionAlcoholica) : '');
    setInfractorFugado(!!editActa.infractorFugado);
    const juzgadoRaw = (editActa as any)?.juzgado;
    setJuzgadoId(typeof juzgadoRaw === 'number' && juzgadoRaw > 0 ? juzgadoRaw : null);

    const inf = editActa.infractor;
    setInfractorIdInfrac(inf?.idInfrac ?? null);
    setInfractorNombre(inf?.nombre ?? '');
    setInfractorApellido(inf?.apellido ?? '');
    setInfractorDni(inf?.dni ?? '');
    setInfractorNacionalidad(inf?.nacionalidad ?? '');
    setInfractorDomicilio(inf?.domicilio ?? '');
    setInfractorLocalidad(inf?.localidad ?? '');
    setInfractorProvincia(inf?.provincia ?? '');
    setInfractorFechaNacimiento(isoToDdMmYyyy(inf?.fechaNacimiento) ?? (inf?.fechaNacimiento ?? ''));
    setInfractorPropietario(!!inf?.propietario);
    setInfractorPropietario(inf.propietario);
    setLicenciaId((inf as any)?.idLic ?? null);
    setLicenciaClase((inf as any)?.clase ?? '');
    setLicenciaNumero((inf as any)?.numero ?? '');
    setLicenciaAutoridadExpedicion((inf as any)?.autoridadExpedicion ?? '');
    setLicenciaFechaExpedicion(isoToDdMmYyyy((inf as any)?.fechaExpedicion) ?? ((inf as any)?.fechaExpedicion ?? ''));
    setLicenciaFechaVencimiento(isoToDdMmYyyy((inf as any)?.fechaVencimiento) ?? ((inf as any)?.fechaVencimiento ?? ''));

    const veh = editActa.vehiculo;
    setVehiculosEncontrados([]);
    setVehiculoSeleccionadoId(null);
    setVehiculoIdVeh(veh?.idVeh ?? null);
    setVehiculoDominio(veh?.dominio ?? '');
    setVehiculoMarca((veh?.marca ?? '') as any);
    setVehiculoModelo((veh?.modelo ?? '') as any);
    setVehiculoTipoRodado(veh?.tipoRodado ?? '');

    const prop = veh?.propietario ?? null;
    setPropietarioNombre(prop?.nombre ?? '');
    setPropietarioApellido(prop?.apellido ?? '');
    setPropietarioDni(prop?.dni ?? '');
    setPropietarioDireccion(prop?.direccion ?? '');

    const ub = editActa.ubicacionRequest;
    setUbicLat(ub?.lat != null ? String(ub.lat) : '');
    setUbicLng(ub?.lng != null ? String(ub.lng) : '');
    setUbicDepartamento(ub?.departamento ?? '');
    setUbicUnidadRegional(ub?.unidadRegional ?? null);
    setUbicLocalidad(ub?.localidad ?? null);
    setUbicDescripcion(ub?.descripcion ?? '');

    onEditActaConsumed?.();
  }, [OTRO_VEHICULO_ID, editActa, onEditActaConsumed]);

  async function procesarLicenciaNacional() {
    if (!licenciaNacFoto) return;

    setOcrLicMessage(null);
    setIsOcrLicBusy(true);
    try {
      console.log('OCR licNacFrente: request', {
        uri: licenciaNacFoto.uri,
        fileName: licenciaNacFoto.fileName,
        mimeType: licenciaNacFoto.mimeType,
      });
      const data = await OcrService.procesarLicNacFrente(licenciaNacFoto, jwt);
      console.log('OCR licNacFrente: response', data);

      const normalized = normalizeInfractorNombreApellido({
        nombre: data.nombre ?? '',
        apellido: data.apellido ?? '',
      });

      setInfractorIdInfrac(data.idInfrac ?? null);
      setInfractorNombre(normalized.nombre);
      setInfractorApellido(normalized.apellido);
      setInfractorDni(data.dni ?? infractorDni);
      setInfractorNacionalidad(data.nacionalidad ?? '');
      setInfractorDomicilio(data.domicilio ?? '');
      setInfractorLocalidad(data.localidad ?? '');
      setInfractorProvincia(data.provincia ?? '');
      setInfractorFechaNacimiento(isoToDdMmYyyy(data.fechaNacimiento) ?? (data.fechaNacimiento ?? ''));

      setLicenciaId(data.idLic ?? null);
      setLicenciaClase(data.clase ?? '');
      setLicenciaNumero(data.numero ?? '');
      setLicenciaAutoridadExpedicion(data.autoridadExpedicion ?? '');
      setLicenciaFechaExpedicion(isoToDdMmYyyy(data.fechaExpedicion) ?? (data.fechaExpedicion ?? ''));
      setLicenciaFechaVencimiento(isoToDdMmYyyy(data.fechaVencimiento) ?? (data.fechaVencimiento ?? ''));

      if (typeof (data as any).propietario === 'boolean') {
        setInfractorPropietario((data as any).propietario);
      }

      setOcrLicMessage('Licencia procesada.');
    } catch (e) {
      console.log('OCR licNacFrente: error', e);
      setOcrLicMessage(formatOcrError('licencia nacional', e, licenciaNacFoto));
    } finally {
      setIsOcrLicBusy(false);
    }
  }

  async function procesarCedulaFrente() { 
    if (!cedulaFrenteFoto) return; setOcrCedulaFrenteMessage(null); 
    setIsOcrCedulaFrenteBusy(true); 
    try { 
      console.log('OCR cedulaFrente: request', 
      { uri: cedulaFrenteFoto.uri, fileName: cedulaFrenteFoto.fileName, mimeType: cedulaFrenteFoto.mimeType, });
       const data = await OcrService.procesarCedulaFrente(cedulaFrenteFoto, jwt); 
       console.log('OCR cedulaFrente: response', data); 
       setVehiculoSeleccionadoId(OTRO_VEHICULO_ID); setVehiculoIdVeh(null);
        setVehiculoDominio((data.dominio ?? '').toString()); 
        setVehiculoMarca((data.marca ?? '') as any); setVehiculoModelo((data.modelo ?? '') as any); 
        setVehiculoTipoRodado(data.tipoRodado ?? ''); const prop = (data as any).propietario ?? null; 
        if (!infractorPropietario && prop) { setPropietarioNombre(prop.nombre ?? ''); 
          setPropietarioApellido(prop.apellido ?? ''); setPropietarioDni(prop.dni ?? ''); 
          setPropietarioDireccion(prop.direccion ?? ''); } setOcrCedulaFrenteMessage('Cédula (frente) procesada.'); } catch (e) { console.log('OCR cedulaFrente: error', e); setOcrCedulaFrenteMessage(formatOcrError('cédula (frente)', e, cedulaFrenteFoto)); } finally { setIsOcrCedulaFrenteBusy(false); } }

  async function procesarCedulaDorso() {
    if (!cedulaDorsoFoto) return;

    setOcrCedulaDorsoMessage(null);
    setIsOcrCedulaDorsoBusy(true);
    try {
      console.log('OCR cedulaDorso: request', {
        uri: cedulaDorsoFoto.uri,
        fileName: cedulaDorsoFoto.fileName,
        mimeType: cedulaDorsoFoto.mimeType,
      });
      const data = await OcrService.procesarCedulaDorso(cedulaDorsoFoto, jwt);
      console.log('OCR cedulaDorso: response', data);

      setPropietarioNombre(data.nombre ?? '');
      setPropietarioApellido(data.apellido ?? '');
      setPropietarioDni(data.dni ?? '');
      setPropietarioDireccion(data.direccion ?? '');

      setOcrCedulaDorsoMessage('Cédula (dorso) procesada.');
    } catch (e) {
      console.log('OCR cedulaDorso: error', e);
      setOcrCedulaDorsoMessage(formatOcrError('cédula (dorso)', e, cedulaDorsoFoto));
    } finally {
      setIsOcrCedulaDorsoBusy(false);
    }
  }

  function clearInfractorAutofill() {
    setInfractorIdInfrac(null);
    setInfractorNombre('');
    setInfractorApellido('');
    setInfractorDomicilio('');
    setInfractorLocalidad('');
    setInfractorProvincia('');
    setInfractorNacionalidad('');
    setInfractorFechaNacimiento('');
    setLicenciaId(null);
    setLicenciaClase('');
    setLicenciaNumero('');
    setLicenciaAutoridadExpedicion('');
    setLicenciaFechaExpedicion('');
    setLicenciaFechaVencimiento('');
    setVehiculosEncontrados([]);
    setVehiculoSeleccionadoId(null);
    setVehiculoIdVeh(null);
    setVehiculoDominio('');
    setVehiculoMarca('');
    setVehiculoModelo('');
  }

  const testigosActa = useMemo(
    () =>
      (infractorFugado
        ? firmaTestigos.map((t) => ({
            nombre: (t.nombre ?? '').trim(),
            apellido: (t.apellido ?? '').trim(),
            dni: (t.dni ?? '').trim(),
            domicilio: (t.domicilio ?? '').trim() || undefined,
          }))
        : []) as ActaRequest['testigos'],
    [firmaTestigos, infractorFugado]
  );

  /*
  const firmaDto = useMemo<ActaRequest['firma']>(() => {
    const oficial = firmaOficialBase64.trim();
    if (!oficial) return undefined;

    const infractor = firmaSeNegoAFirmar
      ? null
      : firmaInfractorBase64?.trim()
        ? firmaInfractorBase64.trim()
        : null;

    const testigos = firmaSeNegoAFirmar
      ? firmaTestigos.map((t) => ({
          nombre: (t.nombre ?? '').trim(),
          apellido: (t.apellido ?? '').trim(),
          dni: (t.dni ?? '').trim(),
          domicilio: (t.domicilio ?? '').trim() || undefined,
        }))
      : [];

    return {
      actaId: 0,
      latitud: ubicLat || '',
      longitud: ubicLng || '',
      deviceId,
      seNegoAFirmar: firmaSeNegoAFirmar,
      firmaInfractorBase64: infractor,
      testigos,
      firmaOficialBase64: oficial,
    };
  }, [
    deviceId,
    firmaInfractorBase64,
    firmaOficialBase64,
    firmaSeNegoAFirmar,
    firmaTestigos,
    ubicLat,
    ubicLng,
  ]);
  */

  const requiresGraduacionAlcoholica = useMemo(() => {
    for (const id of articulosSeleccionados) {
      const a = articulosById[id];
      if (!a) continue;
      if ((a.nro ?? '').trim() === 'ART 2 Y 6') return true;
    }
    return false;
  }, [articulosById, articulosSeleccionados]);

  const graduacionAlcoholicaValue = useMemo(() => {
    if (!requiresGraduacionAlcoholica) return 0;
    return toNumberOrFallback(graduacionAlcoholica, 0);
  }, [graduacionAlcoholica, requiresGraduacionAlcoholica]);

  const resetActaForm = () => {
  // Datos Generales
  setIdActa(0);
  setIdGrupo(0);
  setIdTipo(0);
  setIdPuesto(0);
  setFecha(''); // O la fecha por defecto que uses
  setMotivo("");
  setNro("");
  setArticulosSeleccionados([]);

  // Infractor
  setInfractorNombre("");
  setInfractorApellido("");
  setInfractorDni("");
  setInfractorIdInfrac(0);
  setInfractorNacionalidad("");
  setInfractorDomicilio("");
  setInfractorLocalidad("");
  setInfractorProvincia("");
  setInfractorPropietario(false);
  setInfractorFechaNacimiento('');

  // Licencia
  setLicenciaId(0);
  setLicenciaClase("");
  setLicenciaNumero("");
  setLicenciaAutoridadExpedicion("");
  setLicenciaFechaExpedicion('');
  setLicenciaFechaVencimiento('');

  // Vehículo
  setVehiculoIdVeh(0);
  setVehiculoDominio("");
  setVehiculoMarca("");
  setVehiculoModelo("");
  setVehiculoTipoRodado("");

  // Propietario
  setPropietarioNombre("");
  setPropietarioApellido("");
  setPropietarioDni("");
  setPropietarioDireccion("");

  // Ubicación
  setUbicLat('');
  setUbicLng("");
  setUbicDepartamento('');
  setUbicUnidadRegional(0);
  setUbicLocalidad(0);
  setUbicDescripcion('');

  // Otros y Firma
  setAdjuntaSeleccionadas([]);
  setRetencion('');
  setRetencionVehiculo(false);
  setGraduacionAlcoholica('');
  setInfractorFugado(false);
  setFirmaTestigos([
    { nombre: '', apellido: '', dni: '', domicilio: '' },
    { nombre: '', apellido: '', dni: '', domicilio: '' },
  ]);
  /*
  setFirmaSeNegoAFirmar(false);
  setFirmaInfractorBase64(null);
  setFirmaOficialBase64('');
  */
  setJuzgadoId(0);
  //setFirmaDto('');
};

  const actaDraft = useMemo(() => {
    return buildActaRequestSafe({
      idActa,
      idGrupo,
      idTipo,
      idPuesto,
      fecha,
      motivo,
      nro,
      articulos: articulosSeleccionados,
      infractorNombre,
      infractorApellido,
      infractorDni,
      infractorIdInfrac,
      infractorNacionalidad,
      infractorDomicilio,
      infractorLocalidad,
      infractorProvincia,
      infractorPropietario,
      infractorFechaNacimiento,
      licenciaId,
      licenciaClase,
      licenciaNumero,
      licenciaAutoridadExpedicion,
      licenciaFechaExpedicion,
      licenciaFechaVencimiento,
      vehiculoIdVeh,
      vehiculoDominio,
      vehiculoMarca,
      vehiculoModelo,
      vehiculoTipoRodado,
      propietarioNombre,
      propietarioApellido,
      propietarioDni,
      propietarioDireccion,
      ubicLat,
      ubicLng,
      ubicDepartamento,
      ubicUnidadRegional,
      ubicLocalidad,
      ubicDescripcion,
      adjunta: adjuntaSeleccionadas,
      retencion,
      retencionVehiculo,
      graduacionAlcoholica: graduacionAlcoholicaValue,
      infractorFugado,
      juzgado: juzgadoId ?? 0,
      testigos: testigosActa,
    });
  }, [
    idActa,
    idGrupo,
    idTipo,
    idPuesto,
    fecha,
    motivo,
    nro,
    articulosSeleccionados,
    infractorNombre,
    infractorApellido,
    infractorDni,
    infractorIdInfrac,
    infractorNacionalidad,
    infractorDomicilio,
    infractorLocalidad,
    infractorProvincia,
    infractorPropietario,
    infractorFechaNacimiento,
    licenciaId,
    licenciaClase,
    licenciaNumero,
    licenciaAutoridadExpedicion,
    licenciaFechaExpedicion,
    licenciaFechaVencimiento,
    vehiculoIdVeh,
    vehiculoDominio,
    vehiculoMarca,
    vehiculoModelo,
    vehiculoTipoRodado,
    propietarioNombre,
    propietarioApellido,
    propietarioDni,
    propietarioDireccion,
    ubicLat,
    ubicLng,
    ubicDepartamento,
    ubicUnidadRegional,
    ubicLocalidad,
    ubicDescripcion,
    adjuntaSeleccionadas,
    retencion,
    retencionVehiculo,
    graduacionAlcoholicaValue,
    infractorFugado,
    juzgadoId,
    testigosActa,
  ]);

  const isEditing = useMemo(() => !!(actaDraft as any)?.idActa, [actaDraft]);

  useEffect(() => {
    if (isEditing && tab === 'firma') setTab('acta');
  }, [isEditing, tab]);

  const grupoOptions = useMemo(
    () => grupos.map((g) => ({ value: g.idGrupo, label: g.nombre })),
    [grupos]
  );
  const tipoOptions = useMemo(
    () => tipos.map((t) => ({ value: t.idTipo, label: t.detalle || t.descripcion || `Tipo ${t.idTipo}` })),
    [tipos]
  );
  const puestoOptions = useMemo(
    () => puestos.map((p) => ({ value: p.idPuesto, label: p.nombre })),
    [puestos]
  );
  const leyOptions = useMemo(() => leyes.map((l) => ({ value: l.idLey, label: l.nro })), [leyes]);
  const juzgadoOptions = useMemo(
    () =>
      juzgados
        .filter((j) => j.id != null)
        .map((j) => ({ value: j.id as number, label: j.nombre })),
    [juzgados]
  );
  const articulosOptions = useMemo(() => {
    if (!idLey) return [];
    const base = articulosByLey;
    const selectedExtra = articulosSeleccionados
      .map((id) => articulosById[id])
      .filter((a): a is Articulo => Boolean(a));

    const byId = new Map<number, Articulo>();
    for (const a of base) byId.set(a.idArt, a);
    for (const a of selectedExtra) {
      const leyForArticulo = articuloLeyById[a.idArt];
      if (leyForArticulo === idLey) byId.set(a.idArt, a);
    }

    const list = Array.from(byId.values());
    list.sort((a, b) => {
      const an = (a.nro ?? '').localeCompare(b.nro ?? '');
      if (an !== 0) return an;
      return (a.detalle ?? '').localeCompare(b.detalle ?? '');
    });
    return list;
  }, [articuloLeyById, articulosById, articulosByLey, articulosSeleccionados, idLey]);

  const articulosSeleccionadosForLey = useMemo(() => {
    if (!idLey) return [];
    return articulosSeleccionados.filter((id) => articuloLeyById[id] === idLey);
  }, [articuloLeyById, articulosSeleccionados, idLey]);

  const handleArticulosChangeForLey = (nextForLey: number[]) => {
    if (!idLey) return;
    const prevForLeySet = new Set(articulosSeleccionadosForLey);
    const nextForLeySet = new Set(nextForLey);

    setArticulosSeleccionados((prev) => {
      const keepOther = prev.filter((id) => articuloLeyById[id] !== idLey);
      return [...keepOther, ...Array.from(nextForLeySet)];
    });

    setArticuloLeyById((prev) => {
      const next = { ...prev };
      for (const id of nextForLeySet) next[id] = idLey;
      for (const id of prevForLeySet) {
        if (!nextForLeySet.has(id) && next[id] === idLey) delete next[id];
      }
      return next;
    });
  };
  const motivoOptions = useMemo(
    () =>
      [
        'POR HECHO VIAL',
        'CONTROL RUTINARIO',
        'CAMION VARADO',
        'CONTROL DE VELOCIDAD',
        'ALCOHOTEST',
      ].map((m) => ({ value: m, label: m })),
    []
  );
  const adjuntaOptions = useMemo(
    () => [
      'LICENCIA EXTRANJERA',
      'LICENCIA NACIONAL DE CONDUCIR',
      'LICENCIA MUNICIPAL DE CONDUCIR',
      'CEDULA DEL VEHICULO',
      'SEGURO DEL VEHICULO',
      'RTV DEL VEHICULO',
      'DOCUMENTO NACIONAL DE IDENTIDAD',
      'INFORME TESTIMONIAL',
      'INFORME DE DOMINIO',
      'FOTOCOPIA DE DOCUMENTO',
      'FOTOMULTA',
      'TICKET DE ALCOHOLEMIA',
      'ACTA DE AUTORIZACION MEDICA',
      'Otro',
    ],
    []
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 180 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <Text style={styles.title}>NUEVA ACTA</Text>

      <ActaTabs tab={tab} onChangeTab={setTab} disableFirma={isEditing || !infractorFugado} />

      <View style={{ gap: 8 }}>
        <AppButton
          title={isEditing ? 'Actualizar acta' : 'Enviar acta'}
          icon={isEditing ? 'save' : 'send'}
          onPress={guardarActa}
          loading={isSavingActa}
          disabled={isSavingActa}
        />
        {saveActaMessage ? (
          <Text style={saveActaMessage.includes('HTTP') ? styles.errorText : styles.helperText}>
            {saveActaMessage}
          </Text>
        ) : null}
      </View>

      {infractorFugado ? (
        <Text style={styles.helperText}>
          Infractor fugado activo: en la pestaña de firma solo se cargarán los dos testigos.
        </Text>
      ) : null}

      {tab === 'acta' ? (
        <Section title="Datos del acta">
          {isLoadingCatalogs ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Cargando catálogos...</Text>
            </View>
          ) : null}

          {catalogsError ? <Text style={styles.errorText}>{catalogsError}</Text> : null}

          <SelectField
            label="Grupo"
            placeholder="Seleccioná un grupo"
            value={idGrupo}
            options={grupoOptions}
            onChangeValue={setIdGrupo}
            disabled={isLoadingCatalogs}
          />
          <SelectField
            label="Tipo"
            placeholder="Seleccioná un tipo"
            value={idTipo}
            options={tipoOptions}
            onChangeValue={setIdTipo}
            disabled={isLoadingCatalogs}
          />
          <SelectField
            label="Puesto"
            placeholder="Seleccioná un puesto"
            value={idPuesto}
            options={puestoOptions}
            onChangeValue={setIdPuesto}
            disabled={isLoadingCatalogs}
            allowClear
          />
          <SelectField
            label="Juzgado"
            placeholder="Seleccioná un juzgado"
            value={juzgadoId}
            options={juzgadoOptions}
            onChangeValue={setJuzgadoId}
            disabled={isLoadingCatalogs}
            allowClear
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>infractor fugado</Text>
            <Switch value={infractorFugado} onValueChange={setInfractorFugado} />
          </View>
          <PickerField
            label="fecha"
            valueText={fecha}
            placeholder="Selecciona fecha y hora"
            onPress={() => openDatePicker('acta_fecha', 'datetime', fecha)}
          />
          <SelectFieldString
            label="Motivo"
            placeholder="Seleccioná un motivo"
            value={motivo}
            options={motivoOptions}
            onChangeValue={setMotivo}
          />

          <View style={{ gap: 6 }}>
            <Text style={styles.label}>nro</Text>
            <TextInput
              value={nro}
              onChangeText={setNro}
              placeholder={isAutomaticTipo ? 'se genera automaticamente' : 'número de acta'}
              style={[styles.input, isAutomaticTipo ? styles.inputDisabled : null]}
              editable={!isAutomaticTipo}
              autoCapitalize="none"
            />
            {isAutomaticTipo ? <Text style={styles.helperText}>Se genera automáticamente</Text> : null}
          </View>
          <SelectField
            label="Ley"
            placeholder="Selecciona una ley"
            value={idLey}
            options={leyOptions}
            onChangeValue={setIdLey}
            disabled={isLoadingCatalogs}
            allowClear
          />

          {isLoadingArticulos ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Cargando arti­culos...</Text>
            </View>
          ) : null}

          {articulosError ? <Text style={styles.errorText}>{articulosError}</Text> : null}

          {articulosOptions.length > 0 ? (
            <MultiSelectPicker
              label="Articulos"
              placeholder="Seleccionar arti­culos"
              values={articulosSeleccionadosForLey}
              options={articulosOptions.map((a) => ({ value: a.idArt, label: `${a.nro}: ${a.detalle}` }))}
              onChangeValues={handleArticulosChangeForLey}
            />
          ) : null}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Retencion de vehi­culo</Text>
            <Switch value={retencionVehiculo} onValueChange={setRetencionVehiculo} />
          </View>

          {requiresGraduacionAlcoholica ? (
            <Field
              label="graduacion alcoholica"
              value={graduacionAlcoholica}
              onChangeText={setGraduacionAlcoholica}
              placeholder="0.00"
              keyboardType="numeric"
            />
          ) : null}
        </Section>
      ) : null}

      {tab === 'acta' ? (
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
          setUbicUnidadRegional={setUbicUnidadRegional}
          setUbicLocalidad={setUbicLocalidad}
          setUbicDescripcion={setUbicDescripcion}
        />
      ) : null}

      <MapaJujuyLeaflet
        visible={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialValue={
          ubicLat && ubicLng && ubicDepartamento
            ? {
                lat: Number(ubicLat),
                lng: Number(ubicLng),
                departamento: ubicDepartamento,
                descripcion: ubicDescripcion,
              }
            : null
        }
        onSelectPoint={(lat, lng) => {
          const departamento = findDepartamento(lat, lng, DEPARTAMENTOS_JUJUY);
          if (!departamento) {
            setUbicacionError('El punto seleccionado esta fuera de Jujuy.');
            return;
          }
          setUbicacionError(null);
          setUbicLat(lat.toFixed(6));
          setUbicLng(lng.toFixed(6));
          setUbicDepartamento(departamento);
        }}
      />

      {tab === 'acta' ? (
        <Section title="Otros">
          <Field
            label="retencion"
            value={retencion}
            onChangeText={setRetencion}
            placeholder="(por ahora texto simple)"
          />
        </Section>
      ) : null}

      {tab === 'infractor' ? (
        <Section title="Infractor">
          <MultiSelectPicker
            label="Adjunta"
            placeholder="Seleccionar adjuntos"
            values={adjuntaSeleccionadas}
            options={adjuntaOptions.map((a) => ({ value: a, label: a }))}
            onChangeValues={setAdjuntaSeleccionadas}
          />

          <View style={{ gap: 10 }}>
            <View style={{ gap: 6 }}>
            <Text style={styles.label}>dni</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                value={infractorDni}
                onChangeText={setInfractorDni}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="none"
              />
              <AppButton
                title="Buscar"
                icon="search"
                size="sm"
                onPress={fetchInfractorByDni}
                loading={isSearchingInfractor}
                disabled={isSearchingInfractor || infractorDni.trim().length !== 8}
              />
            </View>
            {infractorSearchMessage ? <Text style={styles.helperText}>{infractorSearchMessage}</Text> : null}
          </View>

            <PhotoPicker label="Licencia nacional (foto)" value={licenciaNacFoto} onChange={setLicenciaNacFoto} />
            <AppButton
              title="Procesar"
              icon="document-scanner"
              size="sm"
              onPress={procesarLicenciaNacional}
              loading={isOcrLicBusy}
              disabled={!licenciaNacFoto || isOcrLicBusy}
            />
            {ocrLicMessage ? (
              <Text style={ocrLicMessage.includes('HTTP') ? styles.errorText : styles.helperText}>
                {ocrLicMessage}
              </Text>
            ) : null}

            <Field label="clase (opcional)" value={licenciaClase} onChangeText={setLicenciaClase} />
            <Field label="numero (opcional)" value={licenciaNumero} onChangeText={setLicenciaNumero} />
            <Field
              label="autoridadExpedicion (opcional)"
              value={licenciaAutoridadExpedicion}
              onChangeText={setLicenciaAutoridadExpedicion}
            />
            <PickerField
              label="fechaExpedicion"
              valueText={licenciaFechaExpedicion}
              placeholder="Selecciona una fecha"
              onPress={() => openDatePicker('licencia_expedicion', 'date', licenciaFechaExpedicion)}
            />
            <PickerField
              label="fechaVencimiento"
              valueText={licenciaFechaVencimiento}
              placeholder="Selecciona una fecha"
              onPress={() => openDatePicker('licencia_vencimiento', 'date', licenciaFechaVencimiento)}
            />
          </View>

          
          <Field label="nombre" value={infractorNombre} onChangeText={setInfractorNombre} />
          <Field label="apellido" value={infractorApellido} onChangeText={setInfractorApellido} />
          <Field
            label="nacionalidad"
            value={infractorNacionalidad}
            onChangeText={setInfractorNacionalidad}
          />
          <Field label="domicilio" value={infractorDomicilio} onChangeText={setInfractorDomicilio} />
          <Field label="localidad" value={infractorLocalidad} onChangeText={setInfractorLocalidad} />
          <Field label="provincia" value={infractorProvincia} onChangeText={setInfractorProvincia} />
          <PickerField
            label="fechaNacimiento"
            valueText={infractorFechaNacimiento}
            placeholder="Selecciona una fecha"
            onPress={() => openDatePicker('infractor_nacimiento', 'date', infractorFechaNacimiento)}
          />
        </Section>
      ) : null}

      {tab === 'vehiculo' ? (
        <Section title="Vehículo">
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Cédula</Text>
            <PhotoPicker label="Cédula (frente)" value={cedulaFrenteFoto} onChange={setCedulaFrenteFoto} />
            <AppButton
              title="Procesar"
              icon="document-scanner"
              size="sm"
              onPress={procesarCedulaFrente}
              loading={isOcrCedulaFrenteBusy}
              disabled={!cedulaFrenteFoto || isOcrCedulaFrenteBusy}
            />
            {ocrCedulaFrenteMessage ? (
              <Text style={ocrCedulaFrenteMessage.includes('HTTP') ? styles.errorText : styles.helperText}>
                {ocrCedulaFrenteMessage}
              </Text>
            ) : null}

            {false ? (
              <>
                <PhotoPicker label="Cédula (dorso)" value={cedulaDorsoFoto} onChange={setCedulaDorsoFoto} />
                <AppButton
                  title="Procesar"
                  icon="document-scanner"
                  size="sm"
                  onPress={procesarCedulaDorso}
                  loading={isOcrCedulaDorsoBusy}
                  disabled={!cedulaDorsoFoto || isOcrCedulaDorsoBusy}
                />
                {ocrCedulaDorsoMessage ? (
                  <Text
                    style={(ocrCedulaDorsoMessage ?? '').includes('HTTP') ? styles.errorText : styles.helperText}
                  >
                    {ocrCedulaDorsoMessage}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>

          {vehiculosEncontrados.length ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Vehículos encontrados</Text>
              {vehiculosEncontrados.map((v) => {
                const isSelected = v.idVeh === vehiculoSeleccionadoId;
                const dominio = (v.dominio ?? '').trim();
                const marca = (v.marca ?? '').trim();
                const modelo = (v.modelo ?? '').trim();
                const label = dominio
                  ? `${dominio}${marca || modelo ? ` - ${[marca, modelo].filter(Boolean).join(' ')}` : ''}`
                  : `Vehiculo #${v.idVeh}`;

                return (
                  <Pressable
                    key={v.idVeh}
                    onPress={() => setVehiculoSeleccionadoId(v.idVeh)}
                    style={[styles.optionRow, isSelected ? styles.optionRowActive : null]}
                  >
                    <Text style={styles.optionText}>{isSelected ? `(x) ${label}` : `( ) ${label}`}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setVehiculoSeleccionadoId(OTRO_VEHICULO_ID);
                  setVehiculoDominio('');
                  setVehiculoMarca('');
                  setVehiculoModelo('');
                  setVehiculoIdVeh(null);
                  if (!infractorPropietario) {
                    setPropietarioNombre('');
                    setPropietarioApellido('');
                    setPropietarioDni('');
                    setPropietarioDireccion('');
                  }
                }}
                style={[styles.optionRow, vehiculoSeleccionadoId === OTRO_VEHICULO_ID ? styles.optionRowActive : null]}
              >
                <Text style={styles.optionText}>
                  {vehiculoSeleccionadoId === OTRO_VEHICULO_ID
                    ? '(x) Otro (vehículo nuevo)'
                    : '( ) Otro (vehículo nuevo)'}
                </Text>
              </Pressable>
              {!vehiculoSeleccionadoId || vehiculoSeleccionadoId === OTRO_VEHICULO_ID ? (
                <Text style={styles.helperText}>
                  Seleccioná un vehículo para autocompletar o completá los datos manualmente.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.helperText}>No hay vehículos cargados para este infractor.</Text>
          )}

          <Field label="dominio" value={vehiculoDominio} onChangeText={setVehiculoDominio} />
          <Field label="marca (opcional)" value={vehiculoMarca} onChangeText={setVehiculoMarca} />
          <Field label="modelo (opcional)" value={vehiculoModelo} onChangeText={setVehiculoModelo} />
          <SelectFieldString
              label="Tipo de rodado (opcional)"
              placeholder="Seleccionar tipo"
              value={vehiculoTipoRodado}
              options={TIPOS_INVOLUCRADOS.map((tipo) => ({
                value: tipo,
                label: tipo,
              }))}
              // Si llega null, guardamos un string vacío para mantener la compatibilidad
              onChangeValue={(val) => setVehiculoTipoRodado(val ?? '')}
            />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>infractor es propietario</Text>
            <Switch value={infractorPropietario} onValueChange={setInfractorPropietario} />
          </View>
          {!infractorPropietario ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>Propietario</Text>
              <PhotoPicker label="Cedula (dorso)" value={cedulaDorsoFoto} onChange={setCedulaDorsoFoto} />
              <AppButton
                title="Procesar"
                icon="document-scanner"
                size="sm"
                onPress={procesarCedulaDorso}
                loading={isOcrCedulaDorsoBusy}
                disabled={!cedulaDorsoFoto || isOcrCedulaDorsoBusy}
              />
              {ocrCedulaDorsoMessage ? (
                <Text style={(ocrCedulaDorsoMessage ?? '').includes('HTTP') ? styles.errorText : styles.helperText}>
                  {ocrCedulaDorsoMessage}
                </Text>
              ) : null}
              <Field label="apellido y nombre" value={propietarioNombre} onChangeText={setPropietarioNombre} />
              <Field label="dni" value={propietarioDni} onChangeText={setPropietarioDni} keyboardType="numeric" />
              <Field label="direccion" value={propietarioDireccion} onChangeText={setPropietarioDireccion} />
            </View>
          ) : null}
        </Section>
      ) : null}

      {tab === 'firma' ? (
        <Section title="Firma">
          {infractorFugado ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>Testigo 1</Text>
              <Field
                label="nombre"
                value={firmaTestigos[0].nombre ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { nombre: v })}
              />
              <Field
                label="apellido"
                value={firmaTestigos[0].apellido ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { apellido: v })}
              />
              <Field
                label="dni"
                value={firmaTestigos[0].dni ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { dni: v })}
                keyboardType="numeric"
              />
              <Field
                label="domicilio"
                value={firmaTestigos[0].domicilio ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { domicilio: v })}
              />

              <Text style={styles.sectionTitle}>Testigo 2</Text>
              <Field
                label="nombre"
                value={firmaTestigos[1].nombre ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { nombre: v })}
              />
              <Field
                label="apellido"
                value={firmaTestigos[1].apellido ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { apellido: v })}
              />
              <Field
                label="dni"
                value={firmaTestigos[1].dni ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { dni: v })}
                keyboardType="numeric"
              />
              <Field
                label="domicilio (opcional)"
                value={firmaTestigos[1].domicilio ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { domicilio: v })}
              />
            </View>
          ) : (
            <Text style={styles.helperText}>
              Para habilitar este tab, marcá el infractor como fugado en el formulario del acta.
            </Text>
          )}

          {/*
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>El infractor se negó a firmar</Text>
            <Switch
              value={firmaSeNegoAFirmar}
              onValueChange={(v) => {
                setFirmaSeNegoAFirmar(v);
                if (v) setFirmaInfractorBase64(null);
              }}
            />
          </View>

          {firmaSeNegoAFirmar ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>Testigo 1</Text>
              <Field
                label="nombre"
                value={firmaTestigos[0].nombre ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { nombre: v })}
              />
              <Field
                label="apellido"
                value={firmaTestigos[0].apellido ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { apellido: v })}
              />
              <Field
                label="dni"
                value={firmaTestigos[0].dni ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { dni: v })}
                keyboardType="numeric"
              />
              <Field
                label="domicilio"
                value={firmaTestigos[0].domicilio ?? ''}
                onChangeText={(v) => updateFirmaTestigo(0, { domicilio: v })}
              />

              <Text style={styles.sectionTitle}>Testigo 2</Text>
              <Field
                label="nombre"
                value={firmaTestigos[1].nombre ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { nombre: v })}
              />
              <Field
                label="apellido"
                value={firmaTestigos[1].apellido ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { apellido: v })}
              />
              <Field
                label="dni"
                value={firmaTestigos[1].dni ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { dni: v })}
                keyboardType="numeric"
              />
              <Field
                label="domicilio (opcional)"
                value={firmaTestigos[1].domicilio ?? ''}
                onChangeText={(v) => updateFirmaTestigo(1, { domicilio: v })}
              />
            </View>
          ) : null}

          {!firmaSeNegoAFirmar ? (
            <SignaturePadSkia
              label="Firma infractor"
              onChangeBase64={(b64) => setFirmaInfractorBase64(b64 ? b64 : null)}
            />
          ) : (
            <Text style={styles.helperText}>Se negó a firmar.</Text>
          )}

          <SignaturePadSkia label="Firma funcionario" onChangeBase64={setFirmaOficialBase64} />

          <Text style={styles.helperText}>
            Firma funcionario: {firmaOficialBase64.trim() ? 'OK' : 'Pendiente'} | Firma infractor:{' '}
            {firmaSeNegoAFirmar ? 'Negada' : firmaInfractorBase64?.trim() ? 'OK' : 'Pendiente'}
          </Text>
          */}
        </Section>
      ) : null}

      <Modal
        visible={!!datePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setDatePicker(null)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {datePicker?.target === 'acta_fecha'
                  ? 'Fecha del acta'
                  : datePicker?.target === 'infractor_nacimiento'
                    ? 'Fecha de nacimiento'
                    : datePicker?.target === 'licencia_expedicion'
                      ? 'Fecha de expedicion'
                      : 'Fecha de vencimiento'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton title="Cerrar" icon="close" variant="ghost" size="sm" onPress={() => setDatePicker(null)} />
              </View>
            </View>

            {datePicker ? (
              <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
                <View style={{ gap: 12 }}>
                  <StepperRow
                    label="Di­a"
                    value={datePicker.day}
                    min={1}
                    max={daysInMonth(datePicker.year, datePicker.month)}
                    onChange={(day) => setDatePicker((p) => (p ? { ...p, day } : p))}
                  />
                  <StepperRow
                    label="Mes"
                    value={datePicker.month}
                    min={1}
                    max={12}
                    onChange={(month) => setDatePicker((p) => (p ? { ...p, month } : p))}
                  />
                  <StepperRow
                    label="Año"
                    value={datePicker.year}
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    onChange={(year) => setDatePicker((p) => (p ? { ...p, year } : p))}
                  />

                  {datePicker.mode === 'datetime' ? (
                    <>
                      <StepperRow
                        label="Hora"
                        value={datePicker.hour}
                        min={0}
                        max={23}
                        onChange={(hour) => setDatePicker((p) => (p ? { ...p, hour } : p))}
                      />
                      <StepperRow
                        label="Minutos"
                        value={datePicker.minute}
                        min={0}
                        max={59}
                        step={5}
                        onChange={(minute) => setDatePicker((p) => (p ? { ...p, minute } : p))}
                      />
                    </>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                    <AppButton
                      title="Cancelar"
                      icon="close"
                      variant="secondary"
                      onPress={() => setDatePicker(null)}
                    />
                    <AppButton
                      title="Aceptar"
                      icon="check"
                      onPress={() => {
                        if (!datePicker) return;
                        applyDatePickerValue(datePicker);
                        setDatePicker(null);
                      }}
                    />
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


function ActaTabs({
  tab,
  onChangeTab,
  disableFirma,
}: {
  tab: ActaFormTabKey;
  onChangeTab: (tab: ActaFormTabKey) => void;
  disableFirma?: boolean;
}) {
  return (
    <View style={styles.tabs}>
      <TabButton label="ACTA" isActive={tab === 'acta'} onPress={() => onChangeTab('acta')} />
      <TabButton
        label="INFRACTOR"
        isActive={tab === 'infractor'}
        onPress={() => onChangeTab('infractor')}
      />
      <TabButton
        label="VEHÍCULO"
        isActive={tab === 'vehiculo'}
        onPress={() => onChangeTab('vehiculo')}
      />
      <TabButton
        label="FIRMA"
        isActive={tab === 'firma'}
        disabled={!!disableFirma}
        onPress={() => {
          if (disableFirma) return;
          onChangeTab('firma');
        }}
      />
    </View>
  );
}

function TabButton({
  label,
  isActive,
  onPress,
  disabled,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.tab,
        isActive ? styles.tabActive : styles.tabInactive,
        disabled ? { opacity: 0.45 } : null,
      ]}
    >
      <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PickerField({
  label,
  valueText,
  placeholder,
  onPress,
  disabled,
}: {
  label: string;
  valueText: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const hasValue = !!valueText.trim();
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.selectBox, disabled ? { opacity: 0.6 } : null]}
      >
        <Text style={hasValue ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
          {hasValue ? valueText : placeholder}
        </Text>
        <Text style={styles.selectChevron}>v</Text>
      </Pressable>
    </View>
  );
}

function StepperRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const inc = step ?? 1;
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(clampNumber(value - inc, min, max))}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{String(value).padStart(2, '0')}</Text>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(clampNumber(value + inc, min, max))}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrFallback(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysInMonth(year: number, month1Based: number): number {
  const m = clampNumber(month1Based, 1, 12);
  return new Date(year, m, 0).getDate();
}

function parseDdMmYyyy(input: string): { day: number; month: number; year: number } | null {
  const raw = (input ?? '').trim();
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { day, month, year };
}

function parseDdMmYyyyHhMm(
  input: string
): { day: number; month: number; year: number; hour: number; minute: number } | null {
  const raw = (input ?? '').trim();
  const m = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/.exec(raw);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  if (![day, month, year, hour, minute].every((n) => Number.isFinite(n))) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  const datePart = parseDdMmYyyy(`${m[1]}-${m[2]}-${m[3]}`);
  if (!datePart) return null;
  return { ...datePart, hour, minute };
}

function parseArticulosCsv(csv: string): number[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
}

function buildActaRequestSafe(input: {
  idActa: number | null;
  idGrupo: number | null;
  idTipo: number | null;
  idPuesto: number | null;
  fecha: string;
  motivo: string | null;
  nro: string;
  articulos: number[];
  infractorNombre: string;
  infractorApellido: string;
  infractorDni: string;
  infractorIdInfrac: number | null;
  infractorNacionalidad: string;
  infractorDomicilio: string;
  infractorLocalidad: string;
  infractorProvincia: string;
  infractorPropietario: boolean;
  infractorFechaNacimiento: string;
  licenciaId: number | null;
  licenciaClase: string;
  licenciaNumero: string;
  licenciaAutoridadExpedicion: string;
  licenciaFechaExpedicion: string;
  licenciaFechaVencimiento: string;
  vehiculoIdVeh: number | null;
  vehiculoDominio: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoTipoRodado: string;
  propietarioNombre: string;
  propietarioApellido: string;
  propietarioDni: string;
  propietarioDireccion: string;
  ubicLat: string;
  ubicLng: string;
  ubicDepartamento: string;
  ubicUnidadRegional: number | null;
  ubicLocalidad: number | null;
  ubicDescripcion: string;
  adjunta: string[];
  retencion: string;
  retencionVehiculo: boolean;
  graduacionAlcoholica: number;
  infractorFugado: boolean;
  juzgado: number;
  testigos: ActaRequest['testigos'];
}): Partial<ActaRequest> {
  const idPuestoValue = input.idPuesto ?? undefined;

  const propietario =
    input.infractorPropietario
      ? null
      : input.propietarioNombre.trim() && input.propietarioDni.trim() && input.propietarioDireccion.trim()
        ? {
            nombre: input.propietarioNombre.trim(),
            apellido: input.propietarioApellido.trim() || undefined,
            dni: input.propietarioDni.trim(),
            direccion: input.propietarioDireccion.trim(),
          }
        : null;

  return {
    idActa: input.idActa ?? undefined,
    idGrupo: input.idGrupo ?? 0,
    idTipo: input.idTipo ?? 0,
    idPuesto: idPuestoValue,
    fecha: ddMmYyyyHhMmToIsoLocalDateTime(input.fecha),
    motivo: input.motivo ?? '',
    nro: input.nro,
    articulos: input.articulos,
    infractor: {
      idInfrac: input.infractorIdInfrac,
      nombre: input.infractorNombre,
      apellido: input.infractorApellido,
      dni: input.infractorDni,
      nacionalidad: input.infractorNacionalidad,
      domicilio: input.infractorDomicilio,
      localidad: input.infractorLocalidad || undefined,
      provincia: input.infractorProvincia,
      fechaNacimiento: ddMmYyyyToIso(input.infractorFechaNacimiento),
      idLic: input.licenciaId ?? undefined,
      clase: input.licenciaClase || undefined,
      numero: input.licenciaNumero || undefined,
      autoridadExpedicion: input.licenciaAutoridadExpedicion || undefined,
      fechaExpedicion: ddMmYyyyToIso(input.licenciaFechaExpedicion),
      fechaVencimiento: ddMmYyyyToIso(input.licenciaFechaVencimiento),
      propietario: input.infractorPropietario,
    },
    vehiculo: {
      idVeh: input.vehiculoIdVeh ?? undefined,
      dominio: input.vehiculoDominio,
      marca: input.vehiculoMarca || null,
      modelo: input.vehiculoModelo || null,
      tipoRodado: input.vehiculoTipoRodado || undefined,
      propietario,
    },
    ubicacionRequest: {
      lat: toNumberOrFallback(input.ubicLat, 0),
      lng: toNumberOrFallback(input.ubicLng, 0),
      departamento: input.ubicDepartamento,
      unidadRegional: input.ubicUnidadRegional ?? undefined,
      localidad: input.ubicLocalidad ?? undefined,
      descripcion: input.ubicDescripcion,
    },
    adjunta: input.adjunta.join(','),
    retencion: input.retencion,
    retencionVehiculo: input.retencionVehiculo,
    graduacionAlcoholica: input.graduacionAlcoholica,
    infractorFugado: input.infractorFugado,
    juzgado: input.juzgado,
    testigos: input.testigos,
  };
}

function MultiSelectField({
  label,
  placeholder,
  values,
  options,
  onChangeValues,
}: {
  label: string;
  placeholder: string;
  values: number[];
  options: Array<{ value: number; label: string }>;
  onChangeValues: (values: number[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedLabels = useMemo(() => {
    const selectedSet = new Set(values);
    const labels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);
    if (labels.length === 0) return null;
    if (labels.length === 1) return labels[0];
    return `${labels.length} seleccionados`;
  }, [options, values]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setIsOpen(true)} style={styles.selectBox}>
          <Text style={selectedLabels ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selectedLabels ?? placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton title="Limpiar" icon="close" variant="secondary" size="sm" onPress={() => onChangeValues([])} />
                <AppButton title="Listo" icon="check" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 8 }}>
                {options.map((o) => {
                  const isActive = values.includes(o.value);
                  return (
                    <Pressable
                      key={o.value}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        if (isActive) onChangeValues(values.filter((v) => v !== o.value));
                        else onChangeValues([...values, o.value]);
                      }}
                    >
                      <Text style={styles.optionText}>{isActive ? `✓ ${o.label}` : o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MultiSelectStringField({
  label,
  placeholder,
  values,
  options,
  onChangeValues,
}: {
  label: string;
  placeholder: string;
  values: string[];
  options: string[];
  onChangeValues: (values: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedText = useMemo(() => {
    if (!values.length) return null;
    if (values.length === 1) return values[0] ?? null;
    return `${values.length} seleccionados`;
  }, [values]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setIsOpen(true)} style={styles.selectBox}>
          <Text style={selectedText ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selectedText ?? placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton title="Limpiar" icon="close" variant="secondary" size="sm" onPress={() => onChangeValues([])} />
                <AppButton title="Listo" icon="check" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 8 }}>
                {options.map((opt) => {
                  const isActive = values.includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        if (isActive) onChangeValues(values.filter((v) => v !== opt));
                        else onChangeValues([...values, opt]);
                      }}
                    >
                      <Text style={styles.optionText}>{isActive ? `âœ“ ${opt}` : opt}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SelectFieldString({
  label,
  placeholder,
  value,
  options,
  onChangeValue,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: Array<{ value: string; label: string }>;
  onChangeValue: (value: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setIsOpen(true)} style={styles.selectBox}>
          <Text style={selected ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton title="Cerrar" icon="close" variant="ghost" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 8 }}>
                {options.map((o) => {
                  const isActive = o.value === value;
                  return (
                    <Pressable
                      key={o.value}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        onChangeValue(o.value);
                        setIsOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function formatNowAsDdMmYyyyHhMm(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function formatDateTimeDdMmYyyyHhMm(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 12); // DDMMYYYYHHMM

  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const hh = digits.slice(8, 10);
  const min = digits.slice(10, 12);

  let datePart = '';
  if (dd) datePart = dd;
  if (mm) datePart = `${datePart}${datePart ? '-' : ''}${mm}`;
  if (yyyy) datePart = `${datePart}${datePart ? '-' : ''}${yyyy}`;

  let timePart = '';
  if (hh) timePart = hh;
  if (min) timePart = `${hh}:${min}`;

  if (datePart && timePart) return `${datePart} ${timePart}`;
  return datePart || timePart;
}

function isoToDdMmYyyy(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

function isoLocalDateTimeToDdMmYyyyHhMm(value: string): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(raw);
  if (!m) return raw;
  const [, yyyy, mm, dd, hh, min] = m;
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function ddMmYyyyToIso(value: string | undefined | null): string | undefined {
  const raw = (value ?? '').trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw);
  if (!m) return raw;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function ddMmYyyyHhMmToIsoLocalDateTime(value: string): string {
  const raw = value.trim();
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) return raw.length === 16 ? `${raw}:00` : raw;
  const m = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/.exec(raw);
  if (!m) return raw;
  const [, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

function splitApellidoNombrePorComa(value: string): { apellido: string; nombre: string } | null {
  const idx = value.indexOf(',');
  if (idx === -1) return null;
  const apellido = value.slice(0, idx).trim();
  const nombre = value.slice(idx + 1).trim();
  if (!apellido && !nombre) return null;
  return { apellido, nombre };
}

function normalizeInfractorNombreApellido(input: { nombre: string; apellido: string }): {
  nombre: string;
  apellido: string;
} {
  const parsedFromNombre = splitApellidoNombrePorComa(input.nombre);
  if (parsedFromNombre) {
    return {
      apellido: parsedFromNombre.apellido || input.apellido,
      nombre: parsedFromNombre.nombre || input.nombre,
    };
  }

  const parsedFromApellido = splitApellidoNombrePorComa(input.apellido);
  if (parsedFromApellido) {
    return {
      apellido: parsedFromApellido.apellido || input.apellido,
      nombre: parsedFromApellido.nombre || input.nombre,
    };
  }

  return input;
}
