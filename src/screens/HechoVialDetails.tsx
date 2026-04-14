import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Ajustá estos imports a tu proyecto
import ProtagonistaDetalle from './ProtagonistaDetalle';
import BotonCopiarHechoVial from '../components/modules/BotonCopiarHechoVial';
import { HechoVialListDto } from '../features/hechos-viales/types';

interface Props {
  hecho: HechoVialListDto;
}

const Label = ({ label, value }: { label: string; value?: any }) => (
  <View style={styles.labelRow}>
    <Text style={styles.labelText}>
      <Text style={styles.labelBold}>{label}: </Text>
      {value ?? '—'}
    </Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

export const HechoVialDetalle = ({ hecho }: Props) => {
  const fecha = new Date(hecho.fecha);

  const fechaTexto = isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString();
  const horaTexto = isNaN(fecha.getTime()) ? '—' : fecha.toLocaleTimeString();

  const coordenadas =
    hecho?.ubicacionReq?.lat != null && hecho?.ubicacionReq?.lng != null
      ? `${hecho.ubicacionReq.lat}, ${hecho.ubicacionReq.lng}`
      : '—';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ENCABEZADO */}
      <View style={styles.copyButtonContainer}>
        <BotonCopiarHechoVial hechoVial={hecho} />
      </View>

      <Text style={styles.title}>DESTACAMENTO</Text>

      <Text style={styles.subtitle}>
        INFORME: HECHO VIAL CON / SIN VÍCTIMA – DAÑOS MATERIALES
      </Text>

      <Divider />

      {/* FECHA Y HORA */}
      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="FECHA" value={fechaTexto} />
        </View>
        <View style={styles.col6}>
          <Label label="HORA" value={horaTexto} />
        </View>
      </View>

      <Divider />

      {/* UBICACION */}
      <Text style={styles.sectionTitle}>UBICACIÓN DEL HECHO</Text>
      <View style={styles.row}>
        <View style={styles.col12}>
          <Label label="Lugar" value={hecho?.ubicacionReq?.descripcion} />
        </View>
        <View style={styles.col6}>
          <Label label="Coordenadas" value={coordenadas} />
        </View>
        <View style={styles.col6}>
          <Label label="Ciudad / Localidad" value={hecho?.ubicacionReq?.localidad} />
        </View>
        <View style={styles.col6}>
          <Label label="Departamento" value={hecho?.ubicacionReq?.departamento} />
        </View>
        <View style={styles.col6}>
          <Label label="Unidad Regional" value={hecho?.ubicacionReq?.unidadRegional} />
        </View>
      </View>

      <Divider />

      {/* DATOS GENERALES */}
      <Text style={styles.sectionTitle}>DATOS GENERALES</Text>
      <View style={styles.row}>
        <View style={styles.col4}>
          <Label label="Víctima fatal" value={hecho.victimaFatal} />
        </View>
        <View style={styles.col4}>
          <Label label="Daños materiales" value={hecho.danosMateriales} />
        </View>
        <View style={styles.col4}>
          <Label label="Zona" value={hecho.zona} />
        </View>
        <View style={styles.col6}>
          <Label label="Tipo de vía" value={hecho.tipoVia} />
        </View>
        <View style={styles.col6}>
          <Label label="Otro tipo de vía" value={hecho.tipoViaOtro} />
        </View>
      </View>

      <Divider />

      {/* INVOLUCRADOS */}
      <Text style={styles.sectionTitle}>INVOLUCRADOS</Text>
      <Text style={styles.bodyText}>
        {hecho.involucrados?.length ? hecho.involucrados.join(' – ') : '—'}
      </Text>

      <Divider />

      {/* CONDICIONES */}
      <Text style={styles.sectionTitle}>CONDICIONES DE LA VÍA</Text>
      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="Configuración" value={hecho.configuracionVia} />
        </View>
        <View style={styles.col6}>
          <Label label="Estado calzada" value={hecho.estadoCalzada} />
        </View>
        <View style={styles.col6}>
          <Label label="Estado físico" value={hecho.estadoFisicoCalzada} />
        </View>
        <View style={styles.col6}>
          <Label label="Material calzada" value={hecho.materialCalzada} />
        </View>
        <View style={styles.col6}>
          <Label label="Semáforo" value={hecho.semaforo} />
        </View>
        <View style={styles.col6}>
          <Label label="Luz artificial" value={hecho.luzArtificial} />
        </View>
        <View style={styles.col6}>
          <Label label="Estado ambiental" value={hecho.estadoAmbiental} />
        </View>
      </View>

      <Divider />

      {/* SINIESTRO */}
      <Text style={styles.sectionTitle}>SINIESTRO</Text>
      <View style={styles.row}>
        <View style={styles.col6}>
          <Label label="Tipo de siniestro" value={hecho.tipoSiniestro} />
        </View>
        <View style={styles.col6}>
          <Label label="Tipo de colisión" value={hecho.tipoColision} />
        </View>
        <View style={styles.col12}>
          <Label
            label="Posibles causas"
            value={hecho.posiblesCausas?.length ? hecho.posiblesCausas.join(' – ') : '—'}
          />
        </View>
      </View>

      <Divider />

      {/* SINTESIS */}
      <Text style={styles.sectionTitle}>SÍNTESIS</Text>
      <Text style={styles.bodyText}>{hecho.sintesis ?? '—'}</Text>

      <Divider />

      {/* PROTAGONISTAS */}
      <Text style={styles.bigSectionTitle}>Protagonistas</Text>

      {hecho.protagonistas?.map((p, index) => (
        <ProtagonistaDetalle key={index} protagonista={p} nro={index + 1} />
      ))}

      <Divider />

      {/* PIE */}
      <Text style={styles.footerTitle}>PERSONAL INTERVINIENTE:</Text>

      {hecho?.unidades?.map((unidad, uIndex) => (
        <View key={uIndex} style={styles.unitBlock}>
          <Text style={styles.unitTitle}>{unidad.unidad ?? '—'}</Text>

          {unidad.personal?.map((p, pIndex) => (
            <Text key={pIndex} style={styles.personalText}>
              • {p.jerarquia} {p.nombre}
              {p.observacion ? ` (${p.observacion})` : ''}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default HechoVialDetalle;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  copyButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 8,
    color: '#374151',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  col12: {
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  bigSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  bodyText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 22,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    color: '#111827',
  },
  unitBlock: {
    marginTop: 10,
  },
  unitTitle: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  personalText: {
    marginLeft: 12,
    marginTop: 4,
    fontSize: 14,
    color: '#374151',
  },
});