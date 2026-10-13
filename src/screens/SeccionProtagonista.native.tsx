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
import { Controller, useController, useFieldArray, useWatch, UseFormClearErrors, UseFormSetValue } from 'react-hook-form';
import { SeccionAcompanantesRN } from './SeccionAcompanante.native';
import { styles } from '../components/ui/styles';
import { AppButton } from '../components/ui/AppButton';
import { DateFieldString, SelectFieldString } from '../components/ui/SelectedFieldString';
import { PickerField } from '../components/forms/PickerField';
import { MultiSelectPicker } from '../components/forms/MultiSelectPicker';
import { DateTimeStepperPicker } from '../components/forms/DateTimeStrepperPicker';
import { useAuth } from '../auth/AuthContext';
import { obtenerLicenciaPorNro } from '../services/LicenciaService';
import { getArticulos } from '../services/ArticuloService';
import { calcularEdad } from '../utils/formatearFecha';
import { HechoVialForm } from '../features/hechos-viales/types';
import type { Articulo } from '../features/catalog/types';
import { COLORES, ESTADO_SALUD, GENEROS, LICENCIA_CLASE, LICENCIA_ESTADO, NACIONALIDADES, PROVINCIAS, TIPO_RODADO } from '../features/hechos-viales/values';
import { useCatalogos } from '../api/hooks/catalogos';
//import FormData from 'react-native/types_generated/Libraries/Network/FormData';



type ProtagonistaForm = HechoVialForm['protagonistas'][number];
type LicenciaRequestForm = NonNullable<ProtagonistaForm['licenciaRequest']>;
type ActaNoCargadaForm = ProtagonistaForm['actasNoCargadas'][number];

const ErrorText = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

interface Props {
  control: any;
  watch: any;
  editable?: boolean;
  setValue: UseFormSetValue<HechoVialForm>
  clearErrors: UseFormClearErrors<HechoVialForm>;
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

export const SeccionProtagonistasRN: React.FC<Props> = ({ control, watch, editable, setValue, clearErrors }) => {
  const { jwt } = useAuth();
  const { data: catalogos, isLoading: isLoadingCatalogs, error: catalogosError } = useCatalogos();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'protagonistas',
  });

  const protagonistasCount = fields.length;
  useEffect(() => {
    if (!fields.length) return;

    fields.forEach((_, index) => {
      const protagonista = watch(`protagonistas.${index}`);
      const debeHacerTest = protagonista?.graduacionAlcoholica != null;
      if (protagonista?.seHizoElTest !== debeHacerTest) {
        setValue(`protagonistas.${index}.seHizoElTest`, debeHacerTest, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    });
  }, [fields, setValue, watch]);

  useEffect(() => {
    if (protagonistasCount > 0) {
      // El error de raíz del array puede quedar pegado después de un submit fallido.
      clearErrors('protagonistas');
    }
  }, [clearErrors, protagonistasCount]);

  const jerarquiaItems = useMemo(
    () =>
      (catalogos?.jerarquias ?? [])
        .map((j) => (j.nombre ?? '').trim())
        .filter(Boolean),
    [catalogos]
  );
  const jerarquiaItemsConOtra = useMemo(() => [...jerarquiaItems, 'OTRA'], [jerarquiaItems]);

  return (
    <View style={{ marginTop: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Text style={styles.sectionTitle}>PROTAGONISTAS Y VEHÍCULOS</Text>
        <AppButton
          title="Nuevo protagonista"
          icon="add"
          size="sm"
          onPress={() => {
            append({
              tipoRodado: '',
              dominio: '',
              marca: '',
              modelo: '',
              color: '',
              asegurado: null,
              rto: null,
              cedula: null,
              airbagActivado: null,
              usoSeguridad: null,
              conductorNombre: '',
              conductorGenero: '',
              conductorDni: '',
              conductorNacionalidad: '',
              conductorEdad: '',
              conductorFechaNacimiento: '',
              licenciaEstado: 'SD',
              esFuerzaSeguridad: false,
              situacion: '',
              jerarquia: '',
              legajo: '',
              trasladoConductor: '',
              descripcion: '',
              seHizoElTest: false,
              graduacionAlcoholica: null,
              estadoSalud: '',
              licenciaRequest: createLicenciaRequestForm(),
              actasNoCargadas: [],
              domicilio: '',
              provincia: '',
              localidad: '',
              acompanantes: [],
            });
            clearErrors('protagonistas');
          }}
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

            <ControlledPicker control={control} name={`protagonistas.${index}.tipoRodado`} label="Tipo de Rodado *" items={TIPO_RODADO} />
            <ControlledInput control={control} name={`protagonistas.${index}.dominio`} label="Dominio" />
            <ControlledInput control={control} name={`protagonistas.${index}.marca`} label="Marca" />
            <ControlledInput control={control} name={`protagonistas.${index}.modelo`} label="Modelo" />
            <ControlledPicker control={control} name={`protagonistas.${index}.color`} label="Color *" items={COLORES} />

            <TriStateField control={control} name={`protagonistas.${index}.asegurado`} label="¿Asegurado?" />
            <TriStateField control={control} name={`protagonistas.${index}.rto`} label="¿RTO?" />
            <TriStateField control={control} name={`protagonistas.${index}.cedula`} label="¿Cédula?" />
            <TriStateField control={control} name={`protagonistas.${index}.airbagActivado`} label="¿Airbag activado?" />
            <TriStateField control={control} name={`protagonistas.${index}.usoSeguridad`} label="¿Uso cinturón/casco?" />

            <Text style={styles.subTitle}>Datos del conductor</Text>

            <ControlledInput control={control} name={`protagonistas.${index}.conductorNombre`} label="Apellido y Nombres *" />
            <ControlledInput control={control} name={`protagonistas.${index}.conductorDni`} label="DNI *" keyboardType="numeric" />
            <ControlledPicker control={control} name={`protagonistas.${index}.conductorGenero`} label="Género *" items={GENEROS} />
          <Controller
            control={control}
            name={`protagonistas.${index}.conductorFechaNacimiento`}
            render={({ field: renderField, fieldState }) => (
              <View style={styles.fieldContainer}>
                <DateFieldString
                  label="Fecha de Nacimiento *"
                  placeholder="Seleccioná una fecha"
                  value={renderField.value == null ? null : String(renderField.value)}
                  onChangeValue={(v) => {
                    const fechaSeleccionada = v ?? '';
                    renderField.onChange(fechaSeleccionada);

                    if (fechaSeleccionada) {
                      const edad = calcularEdad(fechaSeleccionada);
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
                <ErrorText message={fieldState.error?.message} />
              </View>
            )}
          />
            <ControlledInput control={control} editable={false} name={`protagonistas.${index}.conductorEdad`} label="Edad *" keyboardType="numeric" />
            <NacionalidadProvinciaFields
              control={control}
              setValue={setValue}
              nacionalidadName={`protagonistas.${index}.conductorNacionalidad`}
              provinciaName={`protagonistas.${index}.provincia`}
            />
            <ControlledInput control={control} name={`protagonistas.${index}.localidad`} label="Localidad *" />
            <ControlledInput control={control} name={`protagonistas.${index}.domicilio`} label="Domicilio *" />

            <ControlledPicker control={control} name={`protagonistas.${index}.licenciaEstado`} label="Estado Licencia *" items={LICENCIA_ESTADO} />
            <ControlledInput control={control} name={`protagonistas.${index}.trasladoConductor`} label="Traslado (Hospital/SAME) *" multiline />
            <Controller
              control={control}
              name={`protagonistas.${index}.seHizoElTest`}
              render={({ field, fieldState }) => (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>¿Se hizo el test de alcoholemia? *</Text>
                  <View style={styles.segmentRow}>
                    {[true, false].map((value) => {
                      const selected = field.value === value;
                      return (
                        <TouchableOpacity
                          key={String(value)}
                          style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                          onPress={() => {
                            field.onChange(value);
                            if (!value) {
                              setValue(`protagonistas.${index}.graduacionAlcoholica`, null, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                        >
                          <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                            {value ? 'SI' : 'NO'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <ErrorText message={fieldState.error?.message} />
                </View>
              )}
            />
            {watch(`protagonistas.${index}.seHizoElTest`) ? (
              <ControlledDecimalInput control={control} name={`protagonistas.${index}.graduacionAlcoholica`} label="Graduación alcohólica (g/L) *" placeholder="0.00" />
            ) : null}
            <ControlledPicker control={control} name={`protagonistas.${index}.estadoSalud`} label="Estado de salud *" items={ESTADO_SALUD} />

            <BooleanField control={control} name={`protagonistas.${index}.esFuerzaSeguridad`} label="¿Es fuerza de seguridad? *" />

            {esFuerza && (
              <>
                <ControlledInput control={control} name={`protagonistas.${index}.legajo`} label="Legajo *" />
                {isLoadingCatalogs ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>Cargando jerarquías...</Text>
                  </View>
                ) : null}
                {catalogosError ? (
                  <Text style={styles.errorText}>
                    {catalogosError instanceof Error ? catalogosError.message : 'Error cargando jerarquías.'}
                  </Text>
                ) : null}
                <JerarquiaField
                  control={control}
                  name={`protagonistas.${index}.jerarquia`}
                  label="Jerarquía *"
                  items={jerarquiaItemsConOtra}
                  disabled={isLoadingCatalogs || !jerarquiaItems.length}
                />
                <ControlledInput control={control} name={`protagonistas.${index}.situacion`} label="Situación de revista *" />
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
            label="Número de licencia *"
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.clase`}
            render={({ field, fieldState }) => (
              <View style={styles.fieldContainer}>
                <MultiSelectPicker
                  label="Clase de licencia *"
                  placeholder="Seleccioná una o más clases"
                  values={String(field.value ?? '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)}
                  options={LICENCIA_CLASE.map((item) => ({ label: item, value: item }))}
                  onChangeValues={(values) => field.onChange(values.join(','))}
                />
                <ErrorText message={fieldState.error?.message} />
              </View>
            )}
          />
          <ControlledInput
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.autoridadExpedicion`}
            label="Autoridad de expedición *"
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.fechaExpedicion`}
            render={({ field, fieldState }) => (
              <View style={styles.fieldContainer}>
                <PickerLicenseDateField
                  label="Fecha de expedición *"
                  placeholder="Seleccioná una fecha"
                  value={field.value == null ? '' : String(field.value)}
                  onChangeValue={(value) => field.onChange(value ?? '')}
                  allowClear
                />
                <ErrorText message={fieldState.error?.message} />
              </View>
            )}
          />
          <Controller
            control={control}
            name={`protagonistas.${protagonistIndex}.licenciaRequest.fechaVencimiento`}
            render={({ field, fieldState }) => (
              <View style={styles.fieldContainer}>
                <PickerLicenseDateField
                  label="Fecha de vencimiento *"
                  placeholder="Seleccioná una fecha"
                  value={field.value == null ? '' : String(field.value)}
                  onChangeValue={(value) => field.onChange(value ?? '')}
                  allowClear
                />
                <ErrorText message={fieldState.error?.message} />
              </View>
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
            label="Número de acta *"
          />
          <Controller
            control={control}
            name={`protagonistas.${pIndex}.actasNoCargadas.${index}.articulado`}
            render={({ field, fieldState }) => (
              <View style={{ gap: 6 }}>
                <Text style={styles.label}>Articulados</Text>
                {isLoadingArticulos ? <Text style={styles.helperText}>Cargando artículos...</Text> : null}
                {articulosError ? <Text style={styles.errorText}>{articulosError}</Text> : null}
                <MultiSelectPicker
                  label="Articulados *"
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
                <ErrorText message={fieldState.error?.message} />
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
    render={({ field, fieldState }) => (
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
        <ErrorText message={fieldState.error?.message} />
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
    render={({ field, fieldState }) => {
      const raw = field.value == null ? '' : String(field.value);
      const value = raw.trim() ? raw : null;
      return (
        <View style={styles.fieldContainer}>
          <SelectFieldString
            label={label}
            placeholder="Seleccioná una opción"
            value={value}
            options={items.map((item) => ({ label: item, value: item }))}
            onChangeValue={(v) => field.onChange(v ?? '')}
            disabled={disabled}
            allowClear
          />
          <ErrorText message={fieldState.error?.message} />
        </View>
      );
    }}
  />
);

const NacionalidadProvinciaFields = ({
  control,
  setValue,
  nacionalidadName,
  provinciaName,
}: {
  control: any;
  setValue: UseFormSetValue<HechoVialForm>;
  nacionalidadName: `protagonistas.${number}.conductorNacionalidad`;
  provinciaName: `protagonistas.${number}.provincia`;
}) => {
  const nacionalidad = useWatch({ control, name: nacionalidadName });
  const mostrarProvincia = String(nacionalidad ?? '').trim() === 'ARGENTINA';

  useEffect(() => {
    if (mostrarProvincia) return;
    setValue(provinciaName, '', { shouldDirty: true, shouldValidate: true });
  }, [mostrarProvincia, provinciaName, setValue]);

  return (
    <>
      <ControlledPicker control={control} name={nacionalidadName} label="Nacionalidad *" items={NACIONALIDADES} />
      {mostrarProvincia ? (
        <ControlledPicker control={control} name={provinciaName} label="Provincia *" items={PROVINCIAS} />
      ) : null}
    </>
  );
};

const JerarquiaField = ({
  control,
  name,
  label,
  items,
  disabled,
}: {
  control: any;
  name: `protagonistas.${number}.jerarquia`;
  label: string;
  items: string[];
  disabled?: boolean;
}) => {
  const { field, fieldState } = useController({ control, name });
  const currentValue = String(field.value ?? '').trim();
  const knownItems = items.filter((item) => item !== 'OTRA');
  const [otherMode, setOtherMode] = useState(currentValue === 'OTRA' || (currentValue.length > 0 && !knownItems.includes(currentValue)));

  useEffect(() => {
    if (!currentValue) return;

    if (currentValue && !knownItems.includes(currentValue)) {
      setOtherMode(true);
      return;
    }

    if (currentValue === 'OTRA') {
      setOtherMode(true);
      return;
    }

    setOtherMode(false);
  }, [currentValue, knownItems]);

  return (
    <View style={styles.fieldContainer}>
      <SelectFieldString
        label={label}
        placeholder="Seleccioná una opción"
        value={otherMode ? 'OTRA' : (knownItems.includes(currentValue) ? currentValue : null)}
        options={items.map((item) => ({ label: item, value: item }))}
        onChangeValue={(v) => {
          if (!v) {
            setOtherMode(false);
            field.onChange('');
            return;
          }

          if (v === 'OTRA') {
            setOtherMode(true);
            field.onChange('');
            return;
          }

          setOtherMode(false);
          field.onChange(v);
        }}
        disabled={disabled}
        allowClear
      />
      {otherMode ? (
        <TextInput
          style={styles.input}
          value={currentValue}
          placeholder="Escribí la jerarquía"
          onChangeText={(text) => field.onChange(text)}
          editable={!disabled}
        />
      ) : null}
      <ErrorText message={fieldState.error?.message} />
    </View>
  );
};

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
    render={({ field, fieldState }) => (
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
        <ErrorText message={fieldState.error?.message} />
      </View>
    )}
  />
);

const TriStateField = ({
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
    render={({ field, fieldState }) => {
      const value = field.value === true ? 'SI' : field.value === false ? 'NO' : 'SD';

      return (
        <View style={styles.fieldContainer}>
          <SelectFieldString
            label={label}
            placeholder="Seleccioná una opción"
            value={value}
            options={['SI', 'NO', 'SD'].map((item) => ({ label: item, value: item }))}
            onChangeValue={(next) => {
              if (!next || next === 'SD') {
                field.onChange(null);
                return;
              }
              field.onChange(next === 'SI');
            }}
          />
          <ErrorText message={fieldState.error?.message} />
        </View>
      );
    }}
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
