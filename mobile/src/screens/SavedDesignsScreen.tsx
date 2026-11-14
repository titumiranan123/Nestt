import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteLocalDesign, designImageUri, listLocalDesigns, renameLocalDesign, type LocalDesign } from '../storage/local-designs';
import { shareDesign } from '../share/design-share';

export function SavedDesignsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (design: LocalDesign) => void }) {
  const [designs, setDesigns] = useState<LocalDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    let active = true;
    listLocalDesigns().then((list) => { if (active) setDesigns(list); })
      .catch((error: unknown) => Alert.alert('Could not load designs', error instanceof Error ? error.message : 'Please try again.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const rename = async (id: string) => {
    setBusyId(id);
    try { setDesigns(await renameLocalDesign(id, draftName)); setRenamingId(null); }
    catch (error) { Alert.alert('Could not rename design', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusyId(null); }
  };
  const remove = (id: string) => Alert.alert('Delete this design?', 'The saved layout and its screenshot will be removed from this phone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => {
      setBusyId(id);
      deleteLocalDesign(id).then(() => setDesigns((current) => current.filter((item) => item.id !== id)))
        .catch((error: unknown) => Alert.alert('Could not delete design', error instanceof Error ? error.message : 'Please try again.'))
        .finally(() => setBusyId(null));
    } },
  ]);
  const share = async (design: LocalDesign) => {
    setBusyId(design.id);
    try { await shareDesign(design); }
    catch (error) { Alert.alert('Could not share design', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusyId(null); }
  };

  return <View style={styles.page}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to furniture catalogue" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Saved room designs</Text></View>
    {loading ? <ActivityIndicator color="#e85b2a" style={styles.loader} /> : <ScrollView contentContainerStyle={styles.content}>
      {designs.map((design) => <View key={design.id} style={styles.card}>
        {designImageUri(design) ? <Image accessibilityLabel={`${design.title} room screenshot`} source={{ uri: designImageUri(design) }} style={styles.preview} resizeMode="cover" /> : <View style={styles.previewPlaceholder}><Text style={styles.previewText}>3D ROOM</Text></View>}
        <View style={styles.cardBody}>
          {renamingId === design.id ? <View style={styles.renameRow}><TextInput accessibilityLabel={`New name for ${design.title}`} value={draftName} onChangeText={setDraftName} maxLength={80} autoFocus style={styles.nameInput} /><Pressable accessibilityRole="button" accessibilityLabel={`Save name for ${design.title}`} disabled={busyId === design.id} onPress={() => rename(design.id)} style={styles.actionButton}><Text style={styles.action}>SAVE</Text></Pressable></View> : <Text style={styles.name}>{design.title}</Text>}
          <Text style={styles.meta}>{design.room.items.length} items · Updated {new Date(design.updatedAt).toLocaleDateString()}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${design.title} in AR`} disabled={busyId === design.id} onPress={() => onOpen(design)} style={styles.actionButton}><Text style={styles.action}>OPEN IN AR</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Share ${design.title}`} disabled={busyId === design.id} onPress={() => share(design)} style={styles.actionButton}><Text style={styles.action}>SHARE</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Rename ${design.title}`} disabled={busyId === design.id} onPress={() => { setRenamingId(design.id); setDraftName(design.title); }} style={styles.actionButton}><Text style={styles.action}>RENAME</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${design.title}`} disabled={busyId === design.id} onPress={() => remove(design.id)} style={styles.actionButton}><Text style={styles.delete}>DELETE</Text></Pressable>
          </View>
        </View>
      </View>)}
      {!designs.length ? <Text style={styles.empty}>No saved rooms yet. Place furniture in AR and choose Save design.</Text> : null}
      <Text style={styles.privacy}>Layouts and screenshots stay on this phone. Sharing sends the screenshot and a link containing the layout. Anyone with that link can view the layout.</Text>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f6f2' },
  header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#ebe7df' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3ded5' },
  backText: { fontSize: 28, color: '#27251f' },
  title: { color: '#27251f', fontSize: 19, fontWeight: '600' },
  loader: { marginTop: 48 },
  content: { padding: 18, paddingBottom: 40 },
  card: { marginBottom: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece8e1' },
  preview: { width: '100%', height: 150, backgroundColor: '#e5ded1' },
  previewPlaceholder: { height: 85, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5ded1' },
  previewText: { color: '#9e9486', fontSize: 15, letterSpacing: 2, fontWeight: '700' },
  cardBody: { padding: 14 },
  name: { color: '#27251f', fontSize: 15, fontWeight: '700' },
  meta: { marginTop: 5, color: '#77736b', fontSize: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 14 },
  actionButton: { minHeight: 44, justifyContent: 'center' },
  action: { color: '#e85b2a', fontSize: 10, fontWeight: '800' },
  delete: { color: '#9d3b23', fontSize: 10, fontWeight: '800' },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: '#ded9d0', color: '#27251f', paddingHorizontal: 9 },
  empty: { marginTop: 30, color: '#77736b', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  privacy: { marginTop: 18, color: '#827c72', fontSize: 10, lineHeight: 16 },
});
