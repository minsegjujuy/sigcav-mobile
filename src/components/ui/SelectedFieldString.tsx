import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton } from "./AppButton";
import { styles } from "./styles";

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChangeValue,
  disabled,
  allowClear,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  options: Array<{ value: number; label: string }>;
  onChangeValue: (value: number | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setIsOpen(true)}
          disabled={disabled}
          style={[styles.selectBox, disabled ? { opacity: 0.6 } : null]}
        >
          <Text style={selected ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {allowClear ? (
                  <AppButton title="Limpiar" icon="close" variant="secondary" size="sm" onPress={() => onChangeValue(null)} />
                ) : null}
                <AppButton title="Cerrar" icon="close" variant="ghost" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 8 }}>
                {options.map((o) => {
                  const isActive = o.value === value;
                  return (
                    <Pressable
                      key={o.value}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        onChangeValue(o.value);
                        setIsOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function SelectFieldString({
  label,
  placeholder,
  value,
  options,
  onChangeValue,
  disabled,
  allowClear,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: Array<{ value: string; label: string }>;
  onChangeValue: (value: string | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setIsOpen(true)} disabled={disabled} style={[styles.selectBox, disabled ? { opacity: 0.6 } : null]}>
          <Text style={selected ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
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

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 8 }}>
                {options.map((o) => {
                  const isActive = o.value === value;
                  return (
                    <Pressable
                      key={o.value}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        onChangeValue(o.value);
                        setIsOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseIsoDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const raw = (value ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (![year, month, day].every((n) => Number.isFinite(n))) return null;
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { year, month, day };
}

export function DateFieldString({
  label,
  placeholder,
  value,
  onChangeValue,
  disabled,
  allowClear,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 1,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  onChangeValue: (value: string | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
  minYear?: number;
  maxYear?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const parsed = useMemo(() => parseIsoDate(value), [value]);
  const [dayText, setDayText] = useState("");
  const [monthText, setMonthText] = useState("");
  const [yearText, setYearText] = useState("");

  const selectedText = useMemo(() => {
    if (parsed) return `${pad2(parsed.day)}-${pad2(parsed.month)}-${parsed.year}`;
    return null;
  }, [parsed]);

  function open() {
    if (disabled) return;
    const p = parseIsoDate(value);
    setDayText(p ? pad2(p.day) : "");
    setMonthText(p ? pad2(p.month) : "");
    setYearText(p ? String(p.year) : "");
    setIsOpen(true);
  }

  function applyAndClose() {
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (![year, month, day].every((n) => Number.isFinite(n))) return;
    if (year < minYear || year > maxYear) return;
    if (month < 1 || month > 12) return;
    if (day < 1 || day > daysInMonth(year, month)) return;

    onChangeValue(`${year}-${pad2(month)}-${pad2(day)}`);
    setIsOpen(false);
  }

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={open} disabled={disabled} style={[styles.selectBox, disabled ? { opacity: 0.6 } : null]}>
          <Text style={selectedText ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {selectedText ?? placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: 12 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, width: '100%' }}>
                <Text style={[styles.modalTitle, { width: '100%' }]}>{label}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {allowClear ? (
                  <AppButton
                    title="Limpiar"
                    icon="close"
                    variant="secondary"
                    size="sm"
                    onPress={() => {
                      onChangeValue(null);
                      setDayText("");
                      setMonthText("");
                      setYearText("");
                      setIsOpen(false);
                    }}
                  />
                ) : null}
                <AppButton title="Aplicar" icon="check" size="sm" onPress={applyAndClose} />
                <AppButton title="Cerrar" icon="close" variant="ghost" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
              <View style={{ gap: 12 }}>
                <DateInputRow label="Día" value={dayText} placeholder="DD" maxLength={2} onChangeText={setDayText} />
                <DateInputRow label="Mes" value={monthText} placeholder="MM" maxLength={2} onChangeText={setMonthText} />
                <DateInputRow label="Año" value={yearText} placeholder="AAAA" maxLength={4} onChangeText={setYearText} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DateInputRow({
  label,
  value,
  placeholder,
  maxLength,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        keyboardType="numeric"
        placeholder={placeholder}
        maxLength={maxLength}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, "").slice(0, maxLength))}
      />
    </View>
  );
}
