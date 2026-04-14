import { Text, View, StyleSheet } from "react-native";
import { Protagonista } from "../features/hechos-viales/types";
import AcompananteDetalle from "./AcompananteDetalle";

interface ProtagonistaProps {
  protagonista: Protagonista;
  nro: number;
}

const Divider = () => <View style={styles.divider} />;

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

export const ProtagonistaDetalle = ({ protagonista, nro }: ProtagonistaProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {nro}º Protagonista – {protagonista.tipoRodado ?? '—'}
      </Text>

      <Divider />

      <View style={styles.row}>
        <View style={styles.col4}>
          <Label label="Dominio" value={protagonista.dominio} />
        </View>
        <View style={styles.col4}>
          <Label label="Marca" value={protagonista.marca} />
        </View>
        <View style={styles.col4}>
          <Label label="Modelo" value={protagonista.modelo} />
        </View>
        <View style={styles.col4}>
          <Label label="Color" value={protagonista.color} />
        </View>
        <View style={styles.col4}>
          <Label label="Asegurado" value={booleanText(protagonista.asegurado)} />
        </View>
        <View style={styles.col4}>
          <Label label="RTO" value={booleanText(protagonista.rto)} />
        </View>
        <View style={styles.col4}>
          <Label label="Cédula" value={booleanText(protagonista.cedula)} />
        </View>
        <View style={styles.col4}>
          <Label label="Airbag" value={booleanText(protagonista.airbagActivado)} />
        </View>
        <View style={styles.col4}>
          <Label label="Uso Seguridad" value={booleanText(protagonista.usoSeguridad)} />
        </View>
      </View>

      <Divider />

      <Text style={styles.sectionTitle}>Conductor</Text>
      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="Nombre" value={protagonista.conductorNombre} />
        </View>
        <View style={styles.col6}>
          <Label label="Género" value={protagonista.conductorGenero} />
        </View>
        <View style={styles.col6}>
          <Label label="DNI" value={protagonista.conductorDni} />
        </View>
        <View style={styles.col6}>
          <Label label="Nacionalidad" value={protagonista.conductorNacionalidad} />
        </View>
        <View style={styles.col6}>
          <Label label="Edad" value={protagonista.conductorEdad} />
        </View>
        <View style={styles.col6}>
          <Label label="Licencia" value={protagonista.licenciaNro} />
        </View>
        <View style={styles.col6}>
          <Label label="Clase" value={protagonista.licenciaClase} />
        </View>
        <View style={styles.col6}>
          <Label label="Estado" value={protagonista.licenciaEstado} />
        </View>
      </View>

      <Divider />

      <Text style={styles.sectionTitle}>Salud y Alcohol</Text>
      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="Traslado" value={protagonista.trasladoConductor} />
        </View>
        <View style={styles.col6}>
          <Label label="Alcohol" value={protagonista.graduacionAlcoholica} />
        </View>
        <View style={styles.col6}>
          <Label label="Acta" value={protagonista.actaRef} />
        </View>
        <View style={styles.col6}>
          <Label label="Articulado" value={protagonista.articuladoRef} />
        </View>
      </View>

      {protagonista.acompanantes?.length ? (
        <>
          <Divider />
          <Text style={styles.sectionTitle}>Acompañantes</Text>

          {protagonista.acompanantes.map((a, idx) => (
            <AcompananteDetalle key={idx} acompanante={a} nro={idx + 1} />
          ))}
        </>
      ) : null}
    </View>
  );
};

export default ProtagonistaDetalle;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 14,
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
  col4: {
    width: '33.3333%',
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