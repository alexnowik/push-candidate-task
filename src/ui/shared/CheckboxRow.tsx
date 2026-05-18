import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CheckboxRowProps = Readonly<{
  label: string;
  checked: boolean;
  disabled?: boolean | undefined;
  onToggle: () => void;
}>;

export function CheckboxRow({ label, checked, disabled = false, onToggle }: CheckboxRowProps) {
  const handlePress = useCallback(() => {
    if (!disabled) onToggle();
  }, [disabled, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        checked ? styles.rowChecked : null,
        disabled ? styles.rowDisabled : null,
        pressed && !disabled ? styles.rowPressed : null,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View style={checked ? styles.boxChecked : styles.box}>
        {checked ? <Text style={styles.boxMark}>✓</Text> : null}
      </View>
      <Text style={disabled ? styles.labelDisabled : styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rowChecked: { backgroundColor: '#edf4ff' },
  rowDisabled: { opacity: 0.45 },
  rowPressed: { backgroundColor: '#f2f6fc' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9aa0a6',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  boxChecked: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1f6feb',
    backgroundColor: '#1f6feb',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxMark: { color: '#fff', fontSize: 14, lineHeight: 16, fontWeight: '700' },
  label: { flex: 1, fontSize: 15, color: '#1f2328' },
  labelDisabled: { flex: 1, fontSize: 15, color: '#444' },
});
