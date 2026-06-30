import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller, useController, useFieldArray, UseFormSetValue } from 'react-hook-form';
import { SeccionAcompanantesRN } from './SeccionAcompanante.native';
import { styles } from '../components/ui/styles';
import { AppButton } from '../components/ui/AppButton';
import { DateFieldString, SelectFieldString } from '../components/ui/SelectedFieldString';
import { PickerField } from '../components/forms/PickerField';
import { MultiSelectPicker } from '../components/forms/MultiSelectPicker';
import { DateTimeStepperPicker } from '../components/forms/DateTimeStrepperPicker';
import { useAuth } from '../auth/AuthContext';
import { getJerarquias, type Jerarquia } from '../services/JerarquiaService';
import { obtenerLicenciaPorNro } from '../services/LicenciaService';
import { getArticulos } from '../services/ArticuloService';
import { calcularEdad } from '../utils/formatearFecha';
import { HechoVialForm } from '../features/hechos-viales/types';
import type { Articulo } from '../features/catalog/types';
import { COLORES, ESTADO_SALUD, GENEROS, LICENCIA_CLASE, LICENCIA_ESTADO, NACIONALIDADES, PROVINCIAS, TIPO_RODADO } from '../features/hechos-viales/values';
//import FormData from 'react-native/types_generated/Libraries/Network/FormData';



type ProtagonistaForm = HechoVialForm['protagonistas'][number];
type LicenciaRequestForm = NonNullable<ProtagonistaForm['licenciaRequest']>;
type ActaNoCargadaForm = ProtagonistaForm['actasNoCargadas'][number];

interface Props {
  control: any;
  watch: any;
  editable?: boolean;
  setValue: UseFormSetValue<HechoVialForm>
}

function createLicenciaRequestForm(): LicenciaRequestForm {
  return {
    id: 0,
    numero: '',
    clase: '',
    autoridadExpedicion: '',
    fechaExpedicion: '',
    fechaVencimiento: '',
  };
}

function createActaNoCargadaForm(): ActaNoCargadaForm {
  return {
    id: 0,
    nroActa: '',
    fechaActa: '',
    articulado: '',
    tipo: '',
    actaId: undefined,
  };
}

export const SeccionProtagonistasRN: React.FC<Props> = ({ control, watch, editable, setValue }) => {
  const { jwt } = useAuth();
  const [jerarquias, setJerarquias] = useState<Jerarquia[]>([]);
  const [isLoadingJerarquias, setIsLoadingJerarquias] = useState(false);
  const [jerarquiasError, setJerarquiasError] = useState<string | null>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'protagonistas',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadJerarquias() {
      setJerarquiasError(null);
      setIsLoadingJerarquias(true);
      try {
        const res = await getJerarquias(jwt);
        if (!isMounted) return;
        setJerarquias(res);
      } catch (e) {
        if (!isMounted) return;
        setJerarquiasError(e instanceof Error ? e.message : 'Error cargando jerarquías.');
        setJerarquias([]);
      } finally {
        if (!isMounted) return;
        setIsLoadingJerarquias(false);
      }
    }

    loadJerarquias();
    return () => {
      isMounted = false;
    };
  }, [jwt]);

  const jerarquiaItems = useMemo(
    () =>
      jerarquias
        .map((j) => (j.nombre ?? '').trim())
        .filter(Boolean),
    [jerarquias]
  );

  return (
    <View style={{ marginTop: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Text style={styles.sectionTitle}>PROTAGONISTAS Y VEHÍCULOS</Text>
        <AppButton
          title="Nuevo protagonista"
          icon="add"
          size="sm"
          onPress={() =>
            append({
              tipoRodado: '',
              dominio: '',
              marca: '',
              modelo: '',
              color: '',
              asegurado: false,
              rto: false,
              cedula: false,
              airbagActivado: false,
              usoSeguridad: false,
              conductorNombre: '',
              conductorGenero: '',
              conductorDni: '',
              conductorNacionalidad: '',
              conductorEdad: '',
              conductorFechaNacimiento: '',
              municipio: '',
              licenciaEstado: 'SD',
              esFuerzaSeguridad: false,
              situacion: '',
              jerarquia: '',
              legajo: '',
              trasladoConductor: '',
              graduacionAlcoholica: null,
              estadoSalud: '',
              licenciaRequest: createLicenciaRequestForm(),
              actasNoCargadas: [],
              domicilio: '',
              provincia: '',
              localidad: '',
              acompanantes: [],
            })
          }
        />
      </View>

      {fields.map((field, index) => {
        const esFuerza = watch(`protagonistas.${index}.esFuerzaSeguridad`);
        const licenciaEstado = watch(`protagonistas.${index}.licenciaEstado`);

        return (
          <View key={field.id} style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <Text style={styles.subTitle}>{index + 1}º PROTAGONISTA</Text>
              <AppButton title="Quitar" icon="delete" variant="secondary" size="sm" onPress={() => remove(index)} />
            </View>

            <ControlledPicker control={control} name={`protagonistas.${index}.tipoRodado`} label="Tipo de Rodado" items={TIPO_RODADO} />
            <ControlledInput control={control} name={`protagonistas.${index}.dominio`} label="Dominio" />
            <ControlledInput control={control} name={`protagonistas.${index}.marca`} label="Marca" />
            <ControlledInput control={control} name={`protagonistas.${index}.modelo`} label="Modelo" />
            <ControlledPicker control={control} name={`protagonistas.${index}.color`} label="Color" items={COLORES} />

            <BooleanField control={control} name={`protagonistas.${index}.asegurado`} label="¿Asegurado?" />
            <BooleanField control={control} name={`protagonistas.${index}.rto`} label="¿RTO?" />
            <BooleanField control={control} name={`protagonistas.${index}.cedula`} label="¿Cédula?" />
            <BooleanField control={control} name={`protagonistas.${index}.airbagActivado`} label="¿Airbag activado?" />
            <BooleanField control={control} name={`protagonistas.${index}.usoSeguridad`} label="¿Uso cinturón/casco?" />

            <Text style={styles.subTitle}>Datos del conductor</Text>

            <ControlledInput control={control} name={`protagonistas.${index}.conductorNombre`} label="Apellido y Nombres" />
            <ControlledInput control={control} name={`protagonistas.${index}.conductorDni`} label="DNI" keyboardType="numeric" />
            <ControlledPicker control={control} name={`protagonistas.${index}.conductorGenero`} label="Género" items={GENEROS} />
            <Controller
            control={control}
            name={`protagonistas.${index}.conductorFechaNacimiento`}
            render={({ field: renderField }) => (
              <DateFieldString
                label="Fecha de Nacimiento"
                placeholder="Seleccioná una fecha"
                value={renderField.value == null ? null : String(renderField.value)}
                onChangeValue={(v) => {
                  const fechaSeleccionada = v ?? '';
                  renderField.onChange(fechaSeleccionada);

                  if (fechaSeleccionada) {
                    const edad = calcularEdad(fechaSeleccionada);
                    // Pasamos el index dinámicamente para actualizar la fila correcta
                    setValue(
                      `protagonistas.${index}.conductorEdad`, 
                      edad.toString(),
                      { shouldValidate: true, shouldDirty: true }
                    );
                  } else {
                    setValue(
                      `protagonistas.${index}.conductorEdad`, 
                      '',
                      { shouldValidate: true, shouldDirty: true }
                    );
                  }
                }}
                allowClear
              />
            )}
          />
            <ControlledInput control={control} editable={false} name={`protagonistas.${index}.conductorEdad`} label="Edad" keyboardType="numeric" />
            <ControlledPicker control={control} name={`protagonistas.${index}.conductorNacionalidad`} label="Nacionalidad" items={NACIONALIDADES} />
            <ControlledPicker control={control} name={`protagonistas.${index}.provincia`} label="Provincia" items={PROVINCIAS} />
            <ControlledInput control={control} name={`protagonistas.${index}.localidad`} label="Localidad" />
            <ControlledInput control={control} name={`protagonistas.${index}.domicilio`} label="Domicilio" />

            <ControlledPicker control={control} name={`protagonistas.${index}.licenciaEstado`} label="Estado Licencia" items={LICENCIA_ESTADO} />
            <ControlledInput control={control} name={`protagonistas.${index}.municipio`} label="Municipio" />
            <ControlledInput control={control} name={`protagonistas.${index}.trasladoConductor`} label="Traslado (Hospital/SAME)" multiline />
            <ControlledDecimalInput control={control} name={`protagonistas.${index}.graduacionAlcoholica`} label="Graduación alcohólica (g/L)" placeholder="0.00" />
            <ControlledPicker control={control} name={`protagonistas.${index}.estadoSalud`} label="Estado de salud" items={ESTADO_SALUD} />

            <BooleanField control={control} name={`protagonistas.${index}.esFuerzaSeguridad`} label="¿Es fuerza de seguridad?" />

            {esFuerza && (
              <>
                <ControlledInput control={control} name={`protagonistas.${index}.legajo`} label="Legajo" />
                {isLoadingJerarquias ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>Cargando jerarquías...</Text>
                  </View>
                ) : null}
                {jerarquiasError ? <Text style={styles.errorText}>{jerarquiasError}</Text> : null}
                <ControlledPicker
                  control={control}
                  name={`protagonistas.${index}.jerarquia`}
                  label="Jerarquía"
                  items={jerarquiaItems}
                  disabled={isLoadingJerarquias || !jerarquiaItems.length}
                />
                <ControlledInput control={control} name={`protagonistas.${index}.situacion`} label="Situación de revista" />
              </>
            )}

            {licenciaEstado !== 'NO_POSEE' ? (
              <>
                <Text style={styles.subTitle}>Licencia</Text>
                <SeccionLicenciaRN control={control} protagonistIndex={index} watch={watch} setValue={setValue} />
              </>
            ) : null}

            <Text style={styles.subTitle}>Actas no cargadas</Text>
            <SeccionActasNoCargadasRN pIndex={index} control={control} />
            <SeccionAcompanantesRN pIndex={index} control={control} setValue={setValue} />
          </View>
        );
      })}
    </View>
  );
};

const SeccionLicenciaRN = ({
  control,
  protagonistIndex,
  watch,
  setValue,
}: {
  control: any;
  protagonistIndex: number;
  watch: any;
  setValue: UseFormSetValue<HechoVialForm>;
}) => {
  const { jwt } = useAuth();
  const conductorDni = watch(`protagonistas.${protagonistIndex}.conductorDni`);
  const licenciaActual = watch(`protagonistas.${protagonistIndex}.licenciaRequest`);
  const [isLoadingLicencias, setIsLoadingLicencias] = useState(false);
  const [licenciasError, setLicenciasError] = useState<string | null>(null);
  const [licenciasEncontradas, setLicenciasEncontradas] = useState<LicenciaRequestForm[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const limpiarFormulario = () => {
    setLicenciasError(null);
    setLicenciasEncontradas([]);
    setMostrarFormulario(false);
    setValue(`protagonistas.${protagonistIndex}.licenciaRequest`, null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    if (!licenciaActual) return;

    const values = [
      licenciaActual.numero,
      licenciaActual.clase,
      licenciaActual.autoridadExpedicion,
      licenciaActual.fechaExpedicion,
      licenciaActual.fechaVencimiento,
    ];
    const tieneDatos = values.some((value) => String(value ?? '').trim().length > 0);
    if (tieneDatos) setMostrarFormulario(true);
  }, [licenciaActual]);

  useEffect(() => {
    const dni = String(conductorDni ?? '').trim();
    if (!dni) {
      setLicenciasEncontradas([]);
      setLicenciasError(null);
    }
  }, [conductorDni]);

  async function verRegistroLicencias() {
    const dni = String(conductorDni ?? '').trim();
    if (!dni) {
      setLicenciasError('Primero ingresá el DNI del protagonista.');
      return;
    }

    setIsLoadingLicencias(true);
    setLicenciasError(null);
    try {
      const registros = await obtenerLicenciaPorNro(dni, jwt);
      setLicenciasEncontradas(registros);
      setMostrarFormulario(false);
      if (!registros.length) {
        setLicenciasError('No se encontraron registros de licencias para ese DNI.');
      }
    } catch (error) {
      setLicenciasEncontradas([]);
      setLicenciasError(error instanceof Error ? error.message : 'No se pudo obtener el registro de licencias.');
    } finally {
      setIsLoadingLicencias(false);
    }
  }

  function seleccionarLicencia(licencia: LicenciaRequestForm) {
    setValue(
      `protagonistas.${protagonistIndex}.licenciaRequest`,
      {
        id: licencia.id ?? 0,
        numero: licencia.numero ?? '',
        clase: licencia.clase ?? '',
        autoridadExpedicion: licencia.autoridadExpedicion ?? '',
        fechaExpedicion: licencia.fechaExpedicion ?? '',
        fechaVencimiento: licencia.fechaVencimiento ?? '',
      },
      { shouldDirty: true, shouldValidate: true }
    );
    setMostrarFormulario(true);
  }

  function crearNuevaLicencia() {
    setLicenciasError(null);
    setLicenciasEncontradas([]);
    setValue(`protagonistas.${protagonistIndex}.licenciaRequest`, createLicenciaRequestForm(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setMostrarFormulario(true);
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <AppButton title="Ver registro de licencias" icon="search" size="sm" onPress={verRegistroLicencias} />
        <AppButton title="Agregar licencia nueva" icon="add" size="sm" variant="secondary" onPress={crearNuevaLicencia} />
      </View>

      {isLoadingLicencias ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Buscando licencias...</Text>
        </View>
      ) : null}

      {licenciasError ? <Text style={styles.errorText}>{licenciasError}</Text> : null}

      {licenciasEncontradas.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.subTitle}>Registros encontrados</Text>
          {licenciasEncontradas.map((licencia, index) => (
            <View key={`${licencia.id ?? 'lic'}-${index}`} style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#fff' }}>
              <Text style={styles.label}>Número: {licencia.numero ?? '-'}</Text>
              <Text style={styles.helperText}>Clase: {licencia.clase ?? '-'}</Text>
              <Text style={styles.helperText}>Autoridad: {licencia.autoridadExpedicion ?? '-'}</Text>
              <Text style={styles.helperText}>Vencimiento: {licencia.fechaVencimiento ?? '-'}</Text>
              <AppButton title="Seleccionar" icon="check" size="sm" onPress={() => seleccionarLicencia(licencia)} />
            </View>
          ))}
        </View>
      ) : null}

      {mostrarFormulario ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.subTitle}>Licencia</Text>
          <ControlledInput
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.numero`}
            label="Número de licencia"
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.clase`}
            render={({ field }) => (
              <MultiSelectPicker
                label="Clase de licencia"
                placeholder="Seleccioná una o más clases"
                values={String(field.value ?? '')
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)}
                options={LICENCIA_CLASE.map((item) => ({ label: item, value: item }))}
                onChangeValues={(values) => field.onChange(values.join(','))}
              />
            )}
          />
          <ControlledInput
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.autoridadExpedicion`}
            label="Autoridad de expedición"
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.fechaExpedicion`}
            render={({ field }) => (
              <PickerLicenseDateField
                label="Fecha de expedición"
                placeholder="Seleccioná una fecha"
                value={field.value == null ? '' : String(field.value)}
                onChangeValue={(value) => field.onChange(value ?? '')}
                allowClear
              />
            )}
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.fechaVencimiento`}
            render={({ field }) => (
              <PickerLicenseDateField
                label="Fecha de vencimiento"
                placeholder="Seleccioná una fecha"
                value={field.value == null ? '' : String(field.value)}
                onChangeValue={(value) => field.onChange(value ?? '')}
                allowClear
              />
            )}
          />
        </View>
      ) : null}
    </View>
  );
};

const SeccionActasNoCargadasRN = ({
  pIndex,
  control,
}: {
  pIndex: number;
  control: any;
}) => {
  const { jwt } = useAuth();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [isLoadingArticulos, setIsLoadingArticulos] = useState(false);
  const [articulosError, setArticulosError] = useState<string | null>(null);
  const { fields, append, remove } = useFieldArray({
    control,
    name: `protagonistas.${pIndex}.actasNoCargadas` as const,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadArticulos() {
      setIsLoadingArticulos(true);
      setArticulosError(null);
      try {
        const res = await getArticulos(jwt);
        if (!isMounted) return;
        setArticulos(res);
      } catch (error) {
        if (!isMounted) return;
        setArticulos([]);
        setArticulosError(error instanceof Error ? error.message : 'No se pudieron cargar los artículos.');
      } finally {
        if (!isMounted) return;
        setIsLoadingArticulos(false);
      }
    }

    loadArticulos();
    return () => {
      isMounted = false;
    };
  }, [jwt]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Text style={styles.helperText}>Agregá las actas no cargadas del protagonista.</Text>
        <AppButton
          title="Agregar acta"
          icon="add"
          size="sm"
          onPress={() => append(createActaNoCargadaForm() as ActaNoCargadaForm)}
        />
      </View>

      {fields.length === 0 ? <Text style={styles.helperText}>No hay actas cargadas.</Text> : null}

      {fields.map((field, index) => (
        <View key={field.id} style={{ gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={styles.subTitle}>{index + 1}º Acta</Text>
            <AppButton title="Quitar" icon="delete" variant="secondary" size="sm" onPress={() => remove(index)} />
          </View>

          <ControlledInput
            control={control}
            name={`protagonistas.${pIndex}.actasNoCargadas.${index}.nroActa`}
            label="Número de acta"
          />
          <Controller
            control={control}
            name={`protagonistas.${pIndex}.actasNoCargadas.${index}.articulado`}
            render={({ field }) => (
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Articulados</Text>
                {isLoadingArticulos ? <Text style={styles.helperText}>Cargando artículos...</Text> : null}
                {articulosError ? <Text style={styles.errorText}>{articulosError}</Text> : null}
                <MultiSelectPicker
                  label="Articulados"
                  placeholder="Seleccioná uno o más artículos"
                  values={String(field.value ?? '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)}
                  options={articulos
                    .map((item) => ({ label: `${item.nro} - ${item.detalle}`, value: item.nro }))
                    .filter((item) => String(item.value).trim().length > 0)}
                  onChangeValues={(values) => field.onChange(values.join(','))}
                />
              </View>
            )}
          />
        </View>
      ))}
    </View>
  );
};

const ControlledInput = ({
  control,
  name,
  label,
  keyboardType,
  placeholder,
  multiline,
  editable
}: {
  control: any;
  name: string;
  label: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={field.value == null ? '' : String(field.value)}
          onChangeText={(text) => {
            field.onChange(text);
          }}
          keyboardType={keyboardType}
          placeholder={placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable}
        />
      </View>
    )}
  />
);

const ControlledDecimalInput = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
}) => {
  const [text, setText] = useState('');
  const { field } = useController({ control, name });

  const sanitize = (raw: string) => {
    const normalized = raw.replace(',', '.');
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 1) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
  };

  useEffect(() => {
    const external = field.value == null ? '' : String(field.value);
    setText(external);
  }, [field.value]);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={text}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        onChangeText={(raw) => {
          setText(sanitize(raw));
        }}
        onBlur={() => {
          const normalized = sanitize(text);
          if (!normalized || normalized === '.') {
            field.onChange(null);
            return;
          }
          const parsed = Number.parseFloat(normalized);
          field.onChange(Number.isFinite(parsed) ? parsed : null);
        }}
      />
    </View>
  );
};

const ControlledPicker = ({
  control,
  name,
  label,
  items,
  disabled,
}: {
  control: any;
  name: string;
  label: string;
  items: string[];
  disabled?: boolean;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => {
      const raw = field.value == null ? '' : String(field.value);
      const value = raw.trim() ? raw : null;
      return (
        <SelectFieldString
          label={label}
          placeholder="Seleccioná una opción"
          value={value}
          options={items.map((item) => ({ label: item, value: item }))}
          onChangeValue={(v) => field.onChange(v ?? '')}
          disabled={disabled}
          allowClear
        />
      );
    }}
  />
);

const BooleanField = ({
  control,
  name,
  label,
}: {
  control: any;
  name: string;
  label: string;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.segmentRow}>
          {[true, false].map((value) => {
            const selected = field.value === value;
            return (
              <TouchableOpacity
                key={String(value)}
                style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                onPress={() => field.onChange(value)}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {value ? 'SI' : 'NO'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    )}
  />
);

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (![year, month, day].every(Number.isFinite)) return null;
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { year, month, day };
}

const PickerLicenseDateField = ({
  label,
  placeholder,
  value,
  onChangeValue,
  allowClear,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (value: string | null) => void;
  allowClear?: boolean;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = useMemo(() => parseIsoDate(value), [value]);
  const valueText = parsed ? `${pad2(parsed.day)}-${pad2(parsed.month)}-${parsed.year}` : '';

  return (
    <>
      <PickerField
        label={label}
        valueText={valueText}
        placeholder={placeholder}
        onPress={() => setIsOpen(true)}
        disabled={disabled}
      />

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {allowClear ? (
                  <AppButton
                    title="Limpiar"
                    icon="close"
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      onChangeValue(null);
                      setIsOpen(false);
                    }}
                  />
                ) : null}
                <AppButton title="Cerrar" icon="close" variant="ghost" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <DateTimeStepperPicker
              mode="date"
              initialValue={parsed ?? undefined}
              onCancel={() => setIsOpen(false)}
              onConfirm={(nextValue) => {
                onChangeValue(nextValue);
                setIsOpen(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};
