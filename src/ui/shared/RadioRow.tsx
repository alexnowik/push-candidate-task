import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RadioRowProps = Readonly<{
  label: string;
  selected: boolean;
  disabled?: boolean | undefined;
  onSelect: () => void;
}>;

export function RadioRow({ label, selected, disabled = false, onSelect }: RadioRowProps) {
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
  label: { flex: 1, fontSize: 15, color: '#1f2328' },
  labelDisabled: { flex: 1, fontSize: 15, color: '#444' },
});
