import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorText } from './ErrorText';

type FieldRowProps = Readonly<{
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}>;

export function FieldRow({ label, hint, error, children }: FieldRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.control}>{children}</View>
      <ErrorText message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  hint: { fontSize: 13, color: '#555', marginBottom: 6 },
  control: { marginTop: 4 },
});
