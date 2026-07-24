import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Acompanante } from '../features/hechos-viales/types';


interface AcompananteProps {
  acompanante: Acompanante;
  nro: number;
}

const Label = ({ label, value }: { label: string; value?: any }) => (
  <View style={styles.labelRow}>
    <Text style={styles.labelText}>
      <Text style={styles.labelBold}>{label}: </Text>
      {value ?? '—'}
    </Text>
  </View>
);

const booleanText = (value?: boolean | string) => {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

export const AcompananteDetalle = ({ acompanante, nro }: AcompananteProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{nro}º Acompañante</Text>

      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="Nombre" value={acompanante.nombre} />
        </View>

        <View style={styles.col6}>
          <Label label="Género" value={acompanante.genero} />
        </View>

        <View style={styles.col6}>
          <Label label="Nacionalidad" value={acompanante.nacionalidad} />
        </View>

        <View style={styles.col6}>
          <Label label="Provincia" value={acompanante.provincia} />
        </View>

        <View style={styles.col6}>
          <Label
            label="Documento"
            value={
              acompanante.tipo || acompanante.numeroDocumento
                ? `${acompanante.tipo ?? ''} ${acompanante.numeroDocumento ?? ''}`.trim()
                : '—'
            }
          />
        </View>

        <View style={styles.col6}>
          <Label label="Edad" value={acompanante.edad} />
        </View>

        <View style={styles.col6}>
          <Label
            label="Cinturón/Casco"
            value={booleanText(acompanante.usoCinturonCasco)}
          />
        </View>

        <View style={styles.col6}>
          <Label
            label="Retención"
            value={booleanText(acompanante.dispositivoRetencion)}
          />
        </View>

        <View style={styles.col6}>
          <Label label="Traslado" value={acompanante.trasladado} />
        </View>

        <View style={styles.col6}>
          <Label label="Estado Salud" value={acompanante.estadoSalud} />
        </View>
      </View>
    </View>
  );
};

export default AcompananteDetalle;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  col6: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  labelRow: {
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  labelBold: {
    fontWeight: '700',
  },
});