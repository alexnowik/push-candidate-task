import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CheckboxRowProps = Readonly<{
  label: string;
  helper?: string | undefined;
  checked: boolean;
  disabled?: boolean | undefined;
  onToggle: () => void;
}>;

export function CheckboxRow({ label, helper, checked, disabled = false, onToggle }: CheckboxRowProps) {
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
      <View style={styles.textColumn}>
        <Text style={disabled ? styles.labelDisabled : styles.label}>{label}</Text>
        {helper ? <Text style={disabled ? styles.helperDisabled : styles.helper}>{helper}</Text> : null}
      </View>
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
  textColumn: { flex: 1 },
  label: { fontSize: 15, color: '#1f2328' },
  labelDisabled: { fontSize: 15, color: '#444' },
  helper: { marginTop: 2, fontSize: 12, color: '#57606a' },
  helperDisabled: { marginTop: 2, fontSize: 12, color: '#57606a' },
});
