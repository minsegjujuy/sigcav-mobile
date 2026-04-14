import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SelectField } from '../ui/SelectedFieldString';
import { styles } from '../ui/styles';
import { AppButton } from '../ui/AppButton';
import { Field } from '../ui/Field';
import { Section } from '../ui/Section';

type LocalidadOption = {
  id: number;
  nombre: string;
};

type UnidadRegionalOption = {
  idUr: number;
  nombre: string;
};

type Props = {
  ubicLat: string | null;
  ubicLng: string | null;
  ubicDepartamento: string | null;
  ubicUnidadRegional: number | null;
  ubicLocalidad: number | null;
  ubicDescripcion: string;

  isMapOpen?: boolean;
  isLocating: boolean;
  isLoadingUr: boolean;

  ubicacionError?: string | null;
  urError?: string | null;

  unidadesRegionales: UnidadRegionalOption[];
  localidades: LocalidadOption[];

  setIsMapOpen: (open: boolean) => void;
  obtenerUbicacionActual: () => void;
  setUbicUnidadRegional: (id: number | null) => void;
  setUbicLocalidad: (id: number | null) => void;
  setUbicDescripcion: (value: string) => void;
};

export function UbicacionSection({
  ubicLat,
  ubicLng,
  ubicDepartamento,
  ubicUnidadRegional,
  ubicLocalidad,
  ubicDescripcion,
  isLocating,
  isLoadingUr,
  ubicacionError,
  urError,
  unidadesRegionales,
  localidades,
  setIsMapOpen,
  obtenerUbicacionActual,
  setUbicUnidadRegional,
  setUbicLocalidad,
  setUbicDescripcion,
}: Props) {
  return (
    <Section title="Ubicación">
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Seleccionar punto"
              icon="map"
              onPress={() => setIsMapOpen(true)}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppButton
              title="Obtener ubicacion"
              icon="gps-fixed"
              variant="secondary"
              onPress={obtenerUbicacionActual}
              loading={isLocating}
              disabled={isLocating}
            />
          </View>
        </View>

        {ubicacionError ? (
          <Text style={styles.errorText}>{ubicacionError}</Text>
        ) : null}

        {ubicLat && ubicLng ? (
          <Text style={styles.helperText}>
            Lat: {ubicLat} | Lng: {ubicLng}{' '}
            {ubicDepartamento ? `| Depto: ${ubicDepartamento}` : ''}
          </Text>
        ) : (
          <Text style={styles.helperText}>
            Todavia no seleccionaste una ubicacion.
          </Text>
        )}
      </View>

      {ubicDepartamento ? (
        <View style={{ gap: 10 }}>
          {isLoadingUr ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                Cargando unidades regionales...
              </Text>
            </View>
          ) : null}

          {urError ? <Text style={styles.errorText}>{urError}</Text> : null}

          {unidadesRegionales.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Selecciona una unidad regional *</Text>

              {unidadesRegionales.map((u) => {
                const isSelected = u.idUr === ubicUnidadRegional;

                return (
                  <Pressable
                    key={u.idUr}
                    onPress={() => {
                      setUbicUnidadRegional(u.idUr);
                      setUbicLocalidad(null);
                    }}
                    style={[
                      styles.optionRow,
                      isSelected ? styles.optionRowActive : null,
                    ]}
                  >
                    <Text style={styles.optionText}>
                      {isSelected ? `● ${u.nombre}` : `○ ${u.nombre}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {ubicUnidadRegional ? (
            <SelectField
              label="Localidad"
              placeholder="Selecciona una localidad"
              value={ubicLocalidad}
              options={localidades.map((l) => ({
                value: l.id,
                label: l.nombre,
              }))}
              onChangeValue={setUbicLocalidad}
              disabled={!localidades.length}
              allowClear
            />
          ) : null}
        </View>
      ) : null}

      <Field
        label="describir ubicacion"
        value={ubicDescripcion}
        onChangeText={setUbicDescripcion}
      />
    </Section>
  );
}