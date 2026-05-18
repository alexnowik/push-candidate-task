import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RadioRowProps = Readonly<{
  label: string;
  helper?: string | undefined;
  selected: boolean;
  disabled?: boolean | undefined;
  onSelect: () => void;
}>;

export function RadioRow({ label, helper, selected, disabled = false, onSelect }: RadioRowProps) {
  const handlePress = useCallback(() => {
    if (!disabled) onSelect();
  }, [disabled, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : null,
        disabled ? styles.rowDisabled : null,
        pressed && !disabled ? styles.rowPressed : null,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      <View style={selected ? styles.outerSelected : styles.outer}>
        {selected ? <View style={styles.inner} /> : null}
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
  rowSelected: { backgroundColor: '#edf4ff' },
  rowDisabled: { opacity: 0.45 },
  rowPressed: { backgroundColor: '#f2f6fc' },
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#8b949e',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  outerSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#1f6feb',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1f6feb',
  },
  textColumn: { flex: 1 },
  label: { fontSize: 15, color: '#1f2328' },
  labelDisabled: { fontSize: 15, color: '#444' },
  helper: { marginTop: 2, fontSize: 12, color: '#57606a' },
  helperDisabled: { marginTop: 2, fontSize: 12, color: '#57606a' },
});
