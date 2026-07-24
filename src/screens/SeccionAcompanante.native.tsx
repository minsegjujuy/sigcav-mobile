import React from 'react';
import { Controller, useFieldArray, UseFormSetValue } from 'react-hook-form';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/ui/AppButton';
import { DateFieldString, SelectFieldString } from '../components/ui/SelectedFieldString';
import { styles } from '../components/ui/styles';
import { calcularEdad } from '../utils/formatearFecha';
import { HechoVialForm } from '../features/hechos-viales/types';

const ErrorText = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

const TIPOS_DOCUMENTO = ['DNI', 'LE', 'LC', 'CI'];
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
const PROVINCIAS = [
  'BUENOS_AIRES',
  'CIUDAD_AUTONOMA_DE_BUENOS_AIRES',
  'CATAMARCA',
  'CHACO',
  'CHUBUT',
  'CORDOBA',
  'CORRIENTES',
  'ENTRE_RIOS',
  'FORMOSA',
  'JUJUY',
  'LA_PAMPA',
  'LA_RIOJA',
  'MENDOZA',
  'MISIONES',
  'NEUQUEN',
  'RIO_NEGRO',
  'SALTA',
  'SAN_JUAN',
  'SAN_LUIS',
  'SANTA_CRUZ',
  'SANTA_FE',
  'SANTIAGO_DEL_ESTERO',
  'TIERRA_DEL_FUEGO',
  'TUCUMAN',
  'N/A',
];
const ESTADO_SALUD = ['SIN LESIONES', 'HERIDO LEVE', 'HERIDO GRAVE', 'FALLECIDO'];

interface Props {
  pIndex: number;
  control: any;
  setValue: UseFormSetValue<HechoVialForm>;
}

export const SeccionAcompanantesRN: React.FC<Props> = ({ pIndex, control, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `protagonistas.${pIndex}.acompanantes`,
  });

  return (
    <View style={{ marginTop: 16, gap: 10 }}>
      <Text style={styles.sectionTitle}>ACOMPAÑANTES DEL {pIndex + 1}º PROTAGONISTA</Text>

      {fields.map((field, aIndex) => (
        <View key={field.id} style={styles.section}>
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.nombre`} label="Apellido y Nombre" />
          <ControlledPicker control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.tipo`} label="Tipo Documento" items={TIPOS_DOCUMENTO} />
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.numeroDocumento`} label="Nro" keyboardType="numeric" />
          <ControlledPicker control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.nacionalidad`} label="Nacionalidad" items={NACIONALIDADES} />
          <ControlledPicker control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.provincia`} label="Provincia" items={PROVINCIAS} />
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.localidad`} label="Localidad" />
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.domicilio`} label="Domicilio" />
          <Controller
            control={control}
            name={`protagonistas.${pIndex}.acompanantes.${aIndex}.fechaNacimiento`}
            render={({ field, fieldState }) => (
              <View style={styles.fieldContainer}>
                <DateFieldString
                  label="Fecha de Nacimiento"
                  placeholder="Seleccioná una fecha"
                  value={field.value == null ? null : String(field.value)}
                  onChangeValue={(v) => {
                    const fechaSeleccionada = v ?? '';
                    field.onChange(fechaSeleccionada);

                    const rutaEdad = `protagonistas.${pIndex}.acompanantes.${aIndex}.edad` as const;

                    if (fechaSeleccionada) {
                      const edadCalculada = calcularEdad(fechaSeleccionada);
                      setValue(rutaEdad, edadCalculada.toString(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setValue(rutaEdad, '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  allowClear
                />
                <ErrorText message={fieldState.error?.message} />
              </View>
            )}
          />
          <ControlledInput editable={false} control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.edad`} label="Edad" keyboardType="numeric" />

          <BooleanField control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.usoCinturonCasco`} label="¿Uso cinturón/casco?" />
          <BooleanField control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.dispositivoRetencion`} label="¿Dispositivo de retención?" />

          <ControlledPicker control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.genero`} label="Género" items={GENEROS} />
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.trasladado`} label="Traslado (Hospital/SAME)" multiline />
          <ControlledInput control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.descripcion`} label="Descripcion de la persona" multiline />
          <ControlledPicker control={control} name={`protagonistas.${pIndex}.acompanantes.${aIndex}.estadoSalud`} label="Estado de salud" items={ESTADO_SALUD} />

          <AppButton
            title="Eliminar acompañante"
            icon="delete"
            variant="secondary"
            size="sm"
            onPress={() => remove(aIndex)}
          />
        </View>
      ))}

      <AppButton
        title="Añadir acompañante"
        icon="add"
        onPress={() =>
          append({
            nombre: '',
            genero: '',
            nacionalidad: '',
            provincia: '',
            tipo: 'DNI',
            numeroDocumento: '',
            fechaNacimiento: '',
            edad: '',
            localidad: '',
            domicilio: '',
            usoCinturonCasco: false,
            dispositivoRetencion: false,
            trasladado: '',
            estadoSalud: '',
          })
        }
      />
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
  editable,
}: {
  control: any;
  name: string;
  label: string;
  keyboardType?: 'default' | 'numeric';
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
          style={[styles.input, multiline && styles.textArea, editable === false && styles.inputDisabled]}
          value={field.value == null ? '' : String(field.value)}
          onChangeText={field.onChange}
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

const ControlledPicker = ({
  control,
  name,
  label,
  items,
}: {
  control: any;
  name: string;
  label: string;
  items: string[];
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
            allowClear
          />
          <ErrorText message={fieldState.error?.message} />
        </View>
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
