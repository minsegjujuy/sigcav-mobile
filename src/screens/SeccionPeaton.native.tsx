import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useWatch, UseFormSetValue } from 'react-hook-form';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/ui/AppButton';
import { DateFieldString, SelectFieldString } from '../components/ui/SelectedFieldString';
import { styles } from '../components/ui/styles';
import { HechoVialForm, Peaton } from '../features/hechos-viales/types';
import { calcularEdad } from '../utils/formatearFecha';
import { ESTADO_SALUD, GENEROS, NACIONALIDADES, PROVINCIAS } from '../features/hechos-viales/values';

const ErrorText = ({ message }: { message?: string | null }) => {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
};

const TIPOS_DOCUMENTO: Peaton['tipo'][] = ['DNI', 'LC', 'LE', 'CI'];

interface Props {
  control: any;
  setValue: UseFormSetValue<HechoVialForm>;
}

function createPeaton(): Peaton {
  return {
    nombre: '',
    genero: '',
    nacionalidad: '',
    provincia: '',
    domicilio: '',
    localidad: '',
    tipo: 'DNI',
    numeroDocumento: '',
    fechaNacimiento: '',
    edad: '',
    dispositivoRetencion: false,
    trasladado: '',
    estadoSalud: '',
    descripcion: ''
  };
}

export const SeccionPeatonRN: React.FC<Props> = ({ control, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'peatones',
  });

  return (
    <View style={{ marginTop: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Text style={styles.sectionTitle}>PEATONES</Text>
        <AppButton title="Nuevo peatón" icon="add" size="sm" onPress={() => append(createPeaton())} />
      </View>

      {fields.length === 0 ? (
        <View style={styles.section}>
          <Text style={styles.helperText}>Podés agregar uno o más peatones para asociarlos al hecho vial.</Text>
        </View>
      ) : null}

      {fields.map((field, index) => (
        <View key={field.id} style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <Text style={styles.subTitle}>{index + 1}º PEATÓN</Text>
            <AppButton
              title="Quitar"
              icon="delete"
              variant="secondary"
              size="sm"
              onPress={() => remove(index)}
            />
          </View>

          <ControlledInput control={control} name={`peatones.${index}.nombre`} label="Apellido y nombres" />
          <ControlledPicker control={control} name={`peatones.${index}.genero`} label="Género *" items={GENEROS} />
          <NacionalidadProvinciaFields
            control={control}
            setValue={setValue}
            nacionalidadName={`peatones.${index}.nacionalidad`}
            provinciaName={`peatones.${index}.provincia`}
          />
          <ControlledInput control={control} name={`peatones.${index}.domicilio`} label="Domicilio" />
          <ControlledInput control={control} name={`peatones.${index}.localidad`} label="Localidad" />
          <ControlledPicker control={control} name={`peatones.${index}.tipo`} label="Tipo documento *" items={TIPOS_DOCUMENTO.map(String)} />
          <ControlledInput control={control} name={`peatones.${index}.numeroDocumento`} label="Número de documento" keyboardType="numeric" />

          <Controller
            control={control}
            name={`peatones.${index}.fechaNacimiento`}
            render={({ field, fieldState }) => (
              <View style={styles.fieldContainer}>
                <DateFieldString
                  label="Fecha de nacimiento"
                  placeholder="Seleccioná una fecha"
                  value={field.value == null ? null : String(field.value)}
                  onChangeValue={(v) => {
                    const fechaSeleccionada = v ?? '';
                    field.onChange(fechaSeleccionada);

                    if (fechaSeleccionada) {
                      const edad = calcularEdad(fechaSeleccionada);
                      setValue(`peatones.${index}.edad`, edad.toString(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setValue(`peatones.${index}.edad`, '', {
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

          <ControlledInput
            control={control}
            editable={false}
            name={`peatones.${index}.edad`}
            label="Edad"
            keyboardType="numeric"
          />

          <ControlledInput control={control} name={`peatones.${index}.trasladado`} label="Traslado (Hospital/SAME)" multiline />
          <ControlledPicker control={control} name={`peatones.${index}.estadoSalud`} label="Estado de salud *" items={ESTADO_SALUD} />
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

const NacionalidadProvinciaFields = ({
  control,
  setValue,
  nacionalidadName,
  provinciaName,
}: {
  control: any;
  setValue: UseFormSetValue<HechoVialForm>;
  nacionalidadName: `peatones.${number}.nacionalidad`;
  provinciaName: `peatones.${number}.provincia`;
}) => {
  const nacionalidad = useWatch({ control, name: nacionalidadName });
  const mostrarProvincia = String(nacionalidad ?? '').trim() === 'ARGENTINA';

  useEffect(() => {
    if (mostrarProvincia) return;
    setValue(provinciaName, '', { shouldDirty: true, shouldValidate: true });
  }, [mostrarProvincia, provinciaName, setValue]);

  return (
    <>
      <ControlledPicker control={control} name={nacionalidadName} label="Nacionalidad" items={NACIONALIDADES} />
      {mostrarProvincia ? (
        <ControlledPicker control={control} name={provinciaName} label="Provincia" items={PROVINCIAS} />
      ) : null}
    </>
  );
};
