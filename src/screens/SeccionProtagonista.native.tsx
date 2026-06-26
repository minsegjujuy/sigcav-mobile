import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../auth/AuthContext';
import { getJerarquias, type Jerarquia } from '../services/JerarquiaService';
import { calcularEdad } from '../utils/formatearFecha';
import { HechoVialForm } from '../features/hechos-viales/types';
//import FormData from 'react-native/types_generated/Libraries/Network/FormData';

const TIPO_RODADO = [
  'AUTOMOVIL',
  'CAMIONETA',
  'MOTOCICLETA',
  'CAMION',
  'CAMION CON ACOPLADO',
  'CARGA TRACTOR',
  'OMNIBUS',
  'OMNIBUS URBANO',
  'OMNIBUS A LARGA DISTANCIA / ARTICULADO',
  'MAQUINARIA',
];

const COLORES = ['ROJO', 'AZUL', 'BLANCO', 'NEGRO', 'AMARILLO', 'GRIS', 'OTRO'];
const GENEROS = ['M', 'F', 'OTRO'];
const NACIONALIDADES = [
  'ARGENTINA',
  'CHILENA',
  'BOLIVIANA',
  'PARAGUAYA',
  'BRASILERA',
  'PERUANA',
  'VENEZOLANA',
];
const LICENCIA_TIPO = ['NACIONAL', 'MUNICIPAL', 'PROVINCIAL', 'EXTRANJERA'];
const LICENCIA_CLASE = ['A', 'A.1', 'B', 'B.1', 'B.2', 'C', 'D', 'D.1', 'D.2', 'E', 'F', 'G'];
const LICENCIA_ESTADO = ['VIGENTE', 'VENCIDA', 'NO_POSEE', 'SD'];
const ESTADO_SALUD = ['SIN LESIONES', 'HERIDO LEVE', 'HERIDO GRAVE', 'FALLECIDO'];

interface Props {
  control: any;
  watch: any;
  editable?: boolean;
  setValue: UseFormSetValue<HechoVialForm>
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
              licenciaNro: '',
              municipio: '',
              licenciaTipo: '',
              licenciaClase: '',
              licenciaEstado: 'SD',
              esFuerzaSeguridad: false,
              situacion: '',
              jerarquia: '',
              legajo: '',
              trasladoConductor: '',
              graduacionAlcoholica: null,
              estadoSalud: '',
              actaRef: '',
              actaRetencionRef: '',
              articuladoRef: [],
              acompanantes: [],
            })
          }
        />
      </View>

      {fields.map((field, index) => {
        const esFuerza = watch(`protagonistas.${index}.esFuerzaSeguridad`);
        const licenciaTipo = watch(`protagonistas.${index}.licenciaTipo`);

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

            <ControlledPicker control={control} name={`protagonistas.${index}.licenciaTipo`} label="Tipo de licencia" items={LICENCIA_TIPO} />
            <ControlledPicker control={control} name={`protagonistas.${index}.licenciaClase`} label="Clase de licencia" items={LICENCIA_CLASE} />
            <ControlledInput control={control} name={`protagonistas.${index}.licenciaNro`} label="Licencia Nro" />

            {licenciaTipo === 'MUNICIPAL' && (
              <ControlledInput control={control} name={`protagonistas.${index}.municipio`} label="Municipio" />
            )}

            <ControlledPicker control={control} name={`protagonistas.${index}.licenciaEstado`} label="Estado Licencia" items={LICENCIA_ESTADO} />
            <ControlledInput control={control} name={`protagonistas.${index}.trasladoConductor`} label="Traslado (Hospital/SAME)" multiline />
            <ControlledDecimalInput control={control} name={`protagonistas.${index}.graduacionAlcoholica`} label="Graduación alcohólica (g/L)" placeholder="0.00" />
            <ControlledPicker control={control} name={`protagonistas.${index}.estadoSalud`} label="Estado de salud" items={ESTADO_SALUD} />

            <BooleanField control={control} name={`protagonistas.${index}.esFuerzaSeguridad`} label="¿Es fuerza de seguridad?" />

            <ControlledInput control={control} name={`protagonistas.${index}.actaRef`} label="Ref Nro acta" />
            <ControlledInput control={control} name={`protagonistas.${index}.actaRetencionRef`} label="Ref Nro acta retención" />

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

            <SeccionAcompanantesRN pIndex={index} control={control} setValue={setValue} />
          </View>
        );
      })}
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
