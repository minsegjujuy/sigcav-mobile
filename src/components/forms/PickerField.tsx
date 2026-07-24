import { Pressable, View } from "react-native";
import { Text } from "react-native-paper";
import { styles } from "../ui/styles";

export function PickerField({
  label,
  valueText,
  placeholder,
  onPress,
  disabled,
}: {
  label: string;
  valueText: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const hasValue = !!valueText.trim();
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.selectBox, disabled ? { opacity: 0.6 } : null]}
      >
        <Text style={hasValue ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
          {hasValue ? valueText : placeholder}
        </Text>
        <Text style={styles.selectChevron}>v</Text>
      </Pressable>
    </View>
  );
}