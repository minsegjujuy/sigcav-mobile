import { useMemo, useState } from "react";
import { Pressable, View, Modal, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";
import { AppButton } from "./AppButton";

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
          style={[
            styles.selectBox,
            disabled ? { opacity: 0.6 } : null,
          ]}
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
              <View style={{ flexDirection: 'row', gap: 10 }}>
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
              <View style={{ flexDirection: 'row', gap: 10 }}>
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
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

function parseIsoDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const raw = (value ?? '').trim();
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

  const [step, setStep] = useState<'year' | 'month' | 'day'>(() => (parsed ? 'day' : 'year'));
  const [year, setYear] = useState<number | null>(() => parsed?.year ?? null);
  const [month, setMonth] = useState<number | null>(() => parsed?.month ?? null);
  const [day, setDay] = useState<number | null>(() => parsed?.day ?? null);

  const selectedText = useMemo(() => {
    if (parsed) return `${pad2(parsed.day)}-${pad2(parsed.month)}-${parsed.year}`;
    return null;
  }, [parsed]);

  const years = useMemo(() => {
    const out: number[] = [];
    const from = Math.max(1, minYear);
    const to = Math.max(from, maxYear);
    for (let y = to; y >= from; y--) out.push(y);
    return out;
  }, [maxYear, minYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const days = useMemo(() => {
    if (!year || !month) return [];
    const maxDay = daysInMonth(year, month);
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [month, year]);

  function open() {
    if (disabled) return;
    const p = parseIsoDate(value);
    setYear(p?.year ?? null);
    setMonth(p?.month ?? null);
    setDay(p?.day ?? null);
    setStep(p ? 'day' : 'year');
    setIsOpen(true);
  }

  function applyAndClose(next: { year: number; month: number; day: number }) {
    onChangeValue(`${next.year}-${pad2(next.month)}-${pad2(next.day)}`);
    setIsOpen(false);
  }

  const headerSubtitle = useMemo(() => {
    if (!year) return 'Seleccioná el año';
    if (!month) return `Año: ${year} · Seleccioná el mes`;
    if (!day) return `Año: ${year} · Mes: ${pad2(month)} · Seleccioná el día`;
    return `Año: ${year} · Mes: ${pad2(month)} · Día: ${pad2(day)}`;
  }, [day, month, year]);

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
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.modalTitle}>{label}</Text>
                <Text style={styles.helperText}>{headerSubtitle}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {step !== 'year' ? (
                  <AppButton
                    title="Atrás"
                    icon="arrow-back"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      if (step === 'day') {
                        setDay(null);
                        setStep('month');
                      } else if (step === 'month') {
                        setMonth(null);
                        setStep('year');
                      }
                    }}
                  />
                ) : null}
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
                {step === 'year'
                  ? years.map((y) => {
                      const isActive = y === year;
                      return (
                        <Pressable
                          key={y}
                          style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                          onPress={() => {
                            setYear(y);
                            setMonth(null);
                            setDay(null);
                            setStep('month');
                          }}
                        >
                          <Text style={styles.optionText}>{y}</Text>
                        </Pressable>
                      );
                    })
                  : null}

                {step === 'month'
                  ? months.map((m) => {
                      const isActive = m === month;
                      return (
                        <Pressable
                          key={m}
                          style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                          onPress={() => {
                            setMonth(m);
                            setDay(null);
                            setStep('day');
                          }}
                        >
                          <Text style={styles.optionText}>{pad2(m)}</Text>
                        </Pressable>
                      );
                    })
                  : null}

                {step === 'day'
                  ? days.map((d) => {
                      const isActive = d === day;
                      return (
                        <Pressable
                          key={d}
                          style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                          onPress={() => {
                            setDay(d);
                            if (year && month) applyAndClose({ year, month, day: d });
                          }}
                        >
                          <Text style={styles.optionText}>{pad2(d)}</Text>
                        </Pressable>
                      );
                    })
                  : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
