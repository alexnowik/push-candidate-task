import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  disabled?: boolean | undefined;
  tone?: 'primary' | 'error' | undefined;
}>;

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tone = 'primary',
}: PrimaryButtonProps) {
  const style = disabled ? styles.buttonDisabled : tone === 'error' ? styles.buttonError : styles.button;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
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
    backgroundColor: '#8c959f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonError: {
    backgroundColor: '#cf222e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
