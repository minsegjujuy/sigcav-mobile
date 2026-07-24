import { Colors } from "../../theme/colors";
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, gap: 14, backgroundColor: Colors.background },
  listContent: { padding: 16, paddingBottom: 24, gap: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // overflow hidden para que el spring no sobresalga del contenedor
    overflow: 'hidden',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabInactive: {
    backgroundColor: Colors.white,
    borderColor: Colors.divider,
  },
  tabText: { fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: Colors.white },
  tabTextInactive: { color: Colors.primary },

  // ── Estados de error / loading ────────────────────────────────────────────
  errorText: { color: Colors.danger, fontWeight: '800' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: Colors.textSecondary, fontWeight: '700' },

  // ── Secciones ─────────────────────────────────────────────────────────────
  section: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 18,
    padding: 12,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  subTitle: { fontSize: 14, fontWeight: '900', color: Colors.textPrimary },
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },

  // ── Inputs ────────────────────────────────────────────────────────────────
  fieldContainer: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
  },
  textArea: { minHeight: 100 },
  inputDisabled: { backgroundColor: '#f2f2f2' },
  helperText: { color: Colors.textSecondary, fontWeight: '700' },

  // ── Select ────────────────────────────────────────────────────────────────
  selectBox: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  selectText: { fontSize: 16, color: Colors.textPrimary, flexShrink: 1 },
  selectPlaceholder: { fontSize: 16, color: Colors.textSecondary, flexShrink: 1 },
  selectChevron: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  // ── Modal bottom sheet ────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    maxHeight: '70%',
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.lightPrimary },
  optionText: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },

  // ── Segmented controls ────────────────────────────────────────────────────
  segmentRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segmentButton: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  segmentButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: { color: Colors.textPrimary, fontWeight: '800' },
  segmentTextSelected: { color: Colors.white },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  chipTextSelected: { color: Colors.white },

  // ── Switch row ────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },

  // ── Misc layout ───────────────────────────────────────────────────────────
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kvRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  kvLabel: { width: 140, color: Colors.textSecondary, fontWeight: '900' },
  kvValue: { flex: 1, color: Colors.textPrimary, fontWeight: '800' },

  // ── Stepper ───────────────────────────────────────────────────────────────
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  stepperLabel: { fontSize: 14, fontWeight: '900', color: Colors.textPrimary },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  stepperValue: { minWidth: 44, textAlign: 'center', fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
});
