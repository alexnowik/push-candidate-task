import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  disabled?: boolean | undefined;
}>;

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={disabled ? styles.buttonDisabled : styles.button}
      accessibilityRole="button"
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9bbdf7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
