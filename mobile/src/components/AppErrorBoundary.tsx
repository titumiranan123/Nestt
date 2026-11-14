import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type State = { failed: boolean };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>The room view stopped unexpectedly. Your saved designs remain on this phone.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Return to room catalogue" onPress={() => this.setState({ failed: false })} style={styles.button}>
        <Text style={styles.buttonText}>Return to catalogue</Text>
      </Pressable>
    </View>;
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#f8f6f2' },
  title: { color: '#27251f', fontSize: 26, fontWeight: '700' },
  body: { marginTop: 10, color: '#625e56', fontSize: 15, lineHeight: 22 },
  button: { marginTop: 24, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e85b2a' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
