// DateTimeStepperPicker.tsx
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepperRow } from '../../screens/NuevaActaScreen';
import { AppButton } from '../ui/AppButton';

type PickerMode = 'date' | 'datetime';

export type DateTimePickerValue = {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
};

type Props = {
  mode?: PickerMode;
  initialValue?: Partial<DateTimePickerValue>;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

const pad = (value: number) => String(value).padStart(2, '0');

const buildPickerValue = (
  initialValue?: Partial<DateTimePickerValue>
): DateTimePickerValue => {
  const now = new Date();

  return {
    day: initialValue?.day ?? now.getDate(),
    month: initialValue?.month ?? now.getMonth() + 1,
    year: initialValue?.year ?? now.getFullYear(),
    hour: initialValue?.hour ?? now.getHours(),
    minute: initialValue?.minute ?? now.getMinutes(),
  };
};

export function DateTimeStepperPicker({
  mode = 'date',
  initialValue,
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();

  const [picker, setPicker] = useState<DateTimePickerValue>(() =>
    buildPickerValue(initialValue)
  );

  const maxDays = useMemo(
    () => daysInMonth(picker.year, picker.month),
    [picker.year, picker.month]
  );

  const updatePicker = (field: keyof DateTimePickerValue, value: number) => {
    setPicker((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      const validDay = Math.min(
        next.day,
        daysInMonth(next.year, next.month)
      );

      return {
        ...next,
        day: validDay,
      };
    });
  };

  const handleConfirm = () => {
    const date = `${picker.year}-${pad(picker.month)}-${pad(picker.day)}`;

    if (mode === 'date') {
      onConfirm(date);
      return;
    }

    const datetime = `${date}T${pad(picker.hour)}:${pad(picker.minute)}`;
    onConfirm(datetime);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
      <View style={{ gap: 12 }}>
        <StepperRow
          label="Día"
          value={picker.day}
          min={1}
          max={maxDays}
          onChange={(day) => updatePicker('day', day)}
        />

        <StepperRow
          label="Mes"
          value={picker.month}
          min={1}
          max={12}
          onChange={(month) => updatePicker('month', month)}
        />

        <StepperRow
          label="Año"
          value={picker.year}
          min={1900}
          max={2100}
          onChange={(year) => updatePicker('year', year)}
        />

        {mode === 'datetime' && (
          <>
            <StepperRow
              label="Hora"
              value={picker.hour}
              min={0}
              max={23}
              onChange={(hour) => updatePicker('hour', hour)}
            />

            <StepperRow
              label="Minutos"
              value={picker.minute}
              min={0}
              max={59}
              step={5}
              onChange={(minute) => updatePicker('minute', minute)}
            />
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
          <AppButton
            title="Cancelar"
            icon="close"
            variant="secondary"
            onPress={onCancel}
          />

          <AppButton
            title="Aceptar"
            icon="check"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ScrollView>
  );
}