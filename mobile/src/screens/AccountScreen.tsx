import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { signIn, signUp, verifyEmail } from '../api/nestt-api';

const orange = '#e85b2a';
type User = { id: string; name: string; email?: string | null };

export function AccountScreen({ onBack, onAuthenticated, onSavedDesigns, user, onSignOut }: { onBack: () => void; onAuthenticated: (user: User) => void; onSavedDesigns: () => void; user: User | null; onSignOut: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'login') {
        const session = await signIn(email.trim(), password);
        if (session.user) onAuthenticated(session.user);
      } else if (mode === 'signup') {
        await signUp(email.trim(), password);
        Alert.alert('Check your email', 'Enter the verification code sent to your email address.');
        setMode('verify');
      } else {
        await verifyEmail(email.trim(), code.trim(), password);
        const session = await signIn(email.trim(), password);
        if (session.user) onAuthenticated(session.user);
      }
    } catch (error) {
      Alert.alert('Could not continue', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.brand}>NESTT</Text></View>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>YOUR NESTT ACCOUNT</Text>
        <Text style={styles.title}>{user ? 'Welcome back' : mode === 'signup' ? 'Create an account' : mode === 'verify' ? 'Verify your email' : 'Sign in'}</Text>
        {user ? <><Text style={styles.body}>{user.name}{user.email ? ` · ${user.email}` : ''}</Text><Pressable onPress={onSavedDesigns} style={styles.primary}><Text style={styles.primaryText}>My saved room designs</Text></Pressable><Pressable onPress={onSignOut} style={styles.secondary}><Text style={styles.secondaryText}>Sign out</Text></Pressable></> : <>
          <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email address" value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput secureTextEntry placeholder="Password (12+ characters)" value={password} onChangeText={setPassword} style={styles.input} />
          {mode === 'verify' ? <TextInput keyboardType="number-pad" maxLength={6} placeholder="6-digit email code" value={code} onChangeText={setCode} style={styles.input} /> : null}
          <Pressable disabled={busy} onPress={submit} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Verify and sign in'}</Text>}</Pressable>
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.modeButton}><Text style={styles.modeText}>{mode === 'login' ? 'New to Nestt? Create an account' : 'Already have an account? Sign in'}</Text></Pressable>
        </>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f6f2' }, header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3ded5' }, backText: { color: '#27251f', fontSize: 28 }, brand: { color: orange, fontSize: 19, fontWeight: '900', letterSpacing: 2 }, card: { margin: 20, marginTop: 48, padding: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece8e1' }, eyebrow: { color: '#9a4d37', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 }, title: { marginTop: 8, color: '#27251f', fontSize: 25, fontWeight: '600' }, body: { marginTop: 14, color: '#77736b', fontSize: 13 }, input: { height: 48, marginTop: 12, borderWidth: 1, borderColor: '#ded9d0', paddingHorizontal: 12, color: '#27251f', backgroundColor: '#fff' }, primary: { height: 48, marginTop: 16, backgroundColor: orange, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontSize: 12, fontWeight: '800' }, secondary: { height: 44, marginTop: 20, borderWidth: 1, borderColor: '#ded9d0', alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#5d584f', fontSize: 12, fontWeight: '700' }, modeButton: { marginTop: 18, alignItems: 'center' }, modeText: { color: '#8c4a36', fontSize: 11, fontWeight: '700' }, disabled: { opacity: 0.6 },
});
