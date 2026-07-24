import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { mapHechoVialListDtoToForm } from '../features/hechos-viales/mapHechoVialListDtoToForm';
import { deleteHechoVial, listarHechosViales } from '../services/HechoVialService';
import { HechoVialListDto } from '../features/hechos-viales/types';
import HechoVialDetalle from './HechoVialDetails';
import { useHechoVial } from '../features/hechos-viales/HechoVialContext';
import { useAuth } from '../auth/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { Field } from '../components/ui/Field';
import { Section } from '../components/ui/Section';
import { styles } from '../components/ui/styles';
import { CollapsibleContainer } from '../components/ui/CollapsibleContainer';
import { SkeletonList } from '../components/ui/skeleton/SkeletonList';

// Ajustá estos imports a tu proyecto
/*import { listarHechosViales, deleteHechoVial } from '../services/hechoVialService';
import { useHechoVial } from '../context/HechoVialContext';
import { mapHechoVialListDtoToForm } from '../mappers/hechoVialMapper';
import HechoVialDetalle from '../components/HechoVialDetalle';*/

// =====================
// Tipos
// =====================
export interface ProtagonistaDto {
  graduacionAlcoholica?: string | number | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}

// =====================
// Helpers
// =====================
const formatFecha = (fecha?: string) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString();
};

const normalizeStringFilter = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const alcoholText = (protagonistas?: ProtagonistaDto[]) => {
  if (!protagonistas?.length) return '-';

  const values = protagonistas
    .map((p) => p.graduacionAlcoholica)
    .filter((v) => v !== null && v !== undefined && `${v}`.trim() !== '')
    .map((v) => `${v}`);

  if (!values.length) return '-';
  return values.join(', ');
};

// =====================
// Opción simple para selects
// =====================
type SimpleSelectOption = {
  label: string;
  value: string;
};

interface SimpleSelectProps {
  label: string;
  value?: string;
  options: SimpleSelectOption[];
  onChange: (value: string | undefined) => void;
}

function SimpleSelect({ label, value, options, onChange }: SimpleSelectProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.segmentRow}>
          {options.map((option) => {
            const selected = (value ?? '') === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                onPress={() => onChange(option.value === '' ? undefined : option.value)}
              >
                <Text style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// =====================
// Item de lista
// =====================
interface HechoVialCardProps {
  item: HechoVialListDto;
  onDetails: (item: HechoVialListDto) => void;
  onEdit: (item: HechoVialListDto) => void;
  onDelete: (id: number) => void;
}

function HechoVialCard({ item, onDetails, onEdit, onDelete }: HechoVialCardProps) {
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.subTitle}>Hecho vial #{item.id}</Text>
        <Text style={styles.helperText}>{formatFecha(item.fecha)}</Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Ruta</Text>
        <Text style={styles.kvValue}>{item.ubicacionReq.descripcion || '-'}</Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Zona</Text>
        <Text style={styles.kvValue}>{item.zona || '-'}</Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Tipo siniestro</Text>
        <Text style={styles.kvValue}>{item.tipoSiniestro || '-'}</Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Víctima fatal</Text>
        <Text style={styles.kvValue}>{item.victimaFatal || '-'}</Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Graduación alcohólica</Text>
        <Text style={styles.kvValue}>{alcoholText(item.protagonistas)}</Text>
      </View>

      <View style={styles.segmentRow}>
        <AppButton title="Ver informe" icon="description" size="sm" variant="secondary" onPress={() => onDetails(item)} />
        <AppButton title="Editar" icon="edit" size="sm" variant="secondary" onPress={() => onEdit(item)} />
        <AppButton title="Eliminar" icon="delete" size="sm" variant="ghost" onPress={() => onDelete(item.id)} />
      </View>
    </View>
  );
}

// =====================
// Pantalla principal
// =====================
export default function HechosVialesScreen({
  navigation,
  onEditHechoVial,
}: {
  navigation?: any;
  onEditHechoVial?: (hecho: HechoVialListDto) => void;
}) {
  const { setHechoVial } = useHechoVial();
  const { jwt } = useAuth();

  const [data, setData] = useState<HechoVialListDto[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HechoVialListDto | undefined>(undefined);

  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [grupoId, setGrupoId] = useState<string | undefined>(undefined);
  const [victimaFatal, setVictimaFatal] = useState<string | undefined>(undefined);
  const [danosMateriales, setDanosMateriales] = useState<string | undefined>(undefined);
  const [soloLesionados, setSoloLesionados] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response: PageResponse<HechoVialListDto> = await listarHechosViales(
        {
          page,
          size: rowsPerPage,
          fechaInicio: normalizeStringFilter(fechaInicio)
            ? `${fechaInicio}T00:00:00`
            : undefined,
          fechaFin: normalizeStringFilter(fechaFin)
            ? `${fechaFin}T23:59:59`
            : undefined,
          grupoId,
          danosMateriales,
          victimaFatal,
          soloLesionados: soloLesionados ? true : undefined,
        },
        jwt
      );

      setData(response.content ?? []);
      setTotal(response.totalElements ?? 0);
    } catch (error) {
      console.error('Error al listar hechos viales', error);
      Alert.alert('Error', 'No se pudieron cargar los hechos viales');
    } finally {
      setLoading(false);
    }
  }, [
    jwt,
    page,
    rowsPerPage,
    fechaInicio,
    fechaFin,
    grupoId,
    danosMateriales,
    victimaFatal,
    soloLesionados,
  ]);

  const handleDetails = (hv: HechoVialListDto) => {
    setSelectedItem(hv);
    setOpen(true);
  };

  const editar = (hecho: HechoVialListDto) => {
    setHechoVial(mapHechoVialListDtoToForm(hecho));
    onEditHechoVial?.(hecho);
    navigation?.navigate?.('nuevo_hecho_vial', { id: hecho.id });
  };

  const deleteItem = async (id: number) => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro que deseas eliminar este hecho vial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHechoVial(id, jwt);
              Alert.alert('Éxito', 'Se eliminó el hecho vial');
              await fetchData();
            } catch (error) {
              console.error('Error al eliminar hecho vial', error);
              Alert.alert('Error', 'No se pudo eliminar el hecho vial');
            }
          },
        },
      ]
    );
  };

  const handleFilter = async () => {
    setFiltersCollapsed(true);
    setPage(0);
    try {
      setLoading(true);
      const response: PageResponse<HechoVialListDto> = await listarHechosViales(
        {
          page: 0,
          size: rowsPerPage,
          fechaInicio: normalizeStringFilter(fechaInicio)
            ? `${fechaInicio}T00:00:00`
            : undefined,
          fechaFin: normalizeStringFilter(fechaFin)
            ? `${fechaFin}T23:59:59`
            : undefined,
          grupoId,
          danosMateriales,
          victimaFatal,
          soloLesionados: soloLesionados ? true : undefined,
        },
        jwt
      );

      setData(response.content ?? []);
      setTotal(response.totalElements ?? 0);
    } catch (error) {
      console.error('Error al filtrar hechos viales', error);
      Alert.alert('Error', 'No se pudieron aplicar los filtros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <CollapsibleContainer
            title="Filtros de hechos viales"
            iconTitle="filter-list"
            collapsed={filtersCollapsed}
            onCollapsedChange={setFiltersCollapsed}
          >
              <View style={{ gap: 14 }}>

              <Section title="Filtros">
                <Field
                  label="Fecha inicio"
                  placeholder="YYYY-MM-DD"
                  value={fechaInicio}
                  onChangeText={setFechaInicio}
                />

                <Field
                  label="Fecha fin"
                  placeholder="YYYY-MM-DD"
                  value={fechaFin}
                  onChangeText={setFechaFin}
                />

                <SimpleSelect
                  label="Grupo"
                  value={grupoId}
                  onChange={setGrupoId}
                  options={[
                    { label: 'Todos', value: '' },
                    { label: 'Grupo 1', value: '1' },
                    { label: 'Grupo 2', value: '2' },
                    { label: 'Grupo 3', value: '3' },
                  ]}
                />

                <SimpleSelect
                  label="Víctima Fatal"
                  value={victimaFatal}
                  onChange={setVictimaFatal}
                  options={[
                    { label: 'Ambos', value: '' },
                    { label: 'Sí', value: 'SI' },
                    { label: 'No', value: 'NO' },
                  ]}
                />

                <SimpleSelect
                  label="Daños Materiales"
                  value={danosMateriales}
                  onChange={setDanosMateriales}
                  options={[
                    { label: 'Ambos', value: '' },
                    { label: 'Sí', value: 'SI' },
                    { label: 'No', value: 'NO' },
                  ]}
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Solo Heridos Leve/Grave</Text>
                  <Switch value={soloLesionados} onValueChange={setSoloLesionados} />
                </View>

                <AppButton title="Filtrar" icon="filter-list" onPress={handleFilter} />
              </Section>

              <View style={styles.rowBetween}>
                <Text style={styles.helperText}>
                  Página {page + 1} de {totalPages}
                </Text>
                <Text style={styles.helperText}>Total: {total}</Text>
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Cargando...</Text>
                </View>
              ) : null}
            </View>
          </CollapsibleContainer>
        }
        renderItem={({ item }) => (
          <HechoVialCard
            item={item}
            onDetails={handleDetails}
            onEdit={editar}
            onDelete={deleteItem}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.section}>
              <SkeletonList count={4} variant="medium" />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.helperText}>No hay hechos viales para mostrar</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.rowBetween}>
            <AppButton
              title="Anterior"
              icon="chevron-left"
              size="sm"
              variant="secondary"
              disabled={page === 0}
              onPress={() => setPage((prev) => Math.max(prev - 1, 0))}
            />

            <View style={styles.segmentRow}>
              {[5, 10, 20].map((size) => {
                const selected = rowsPerPage === size;
                return (
                  <Pressable
                    key={size}
                    style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                    onPress={() => {
                      setRowsPerPage(size);
                      setPage(0);
                    }}
                  >
                    <Text style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>
                      {size}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AppButton
              title="Siguiente"
              icon="chevron-right"
              size="sm"
              variant="secondary"
              disabled={page + 1 >= totalPages}
              onPress={() => setPage((prev) => prev + 1)}
            />
          </View>
        }
      />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>INFORME DE HECHOS VIALES</Text>
              <AppButton
                title="Cerrar"
                icon="close"
                iconOnly
                size="sm"
                variant="ghost"
                onPress={() => setOpen(false)}
              />
            </View>

            <ScrollView>
              {selectedItem ? (
                <HechoVialDetalle hecho={selectedItem} />
              ) : (
                <Text>No hay información para mostrar</Text>
              )}
            </ScrollView>

            <AppButton title="Cerrar" icon="close" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
