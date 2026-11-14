import React, { useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ARProduct } from '../catalog/ar-products';
import { RoomARScene } from '../ar/RoomARScene';
import { addRoomItem, removeSelectedItem, resetARTracking, rotateSelectedItem, undoRoomChange, useARRoom } from '../state/ar-room-store';
import { saveLocalDesign, type LocalDesign } from '../storage/local-designs';
import { shareDesign } from '../share/design-share';
import { WEB_BASE_URL } from '../config';

const orange = '#e85b2a';

export function RoomARScreen({ onClose, products, initialDesign }: { onClose: () => void; products: ARProduct[]; initialDesign: LocalDesign | null }) {
  const insets = useSafeAreaInsets();
  const navigatorRef = useRef<ViroARSceneNavigator | null>(null);
  const room = useARRoom();
  const [sceneKey, setSceneKey] = useState(0);
  const [title, setTitle] = useState(initialDesign?.title ?? 'My Nestt room');
  const [savedId, setSavedId] = useState(initialDesign?.id);
  const [saving, setSaving] = useState(false);
  const planeStatusStyle = room.tracking === 'limited' || room.tracking === 'unavailable' ? styles.statusWarning : room.planeSelected ? styles.statusReady : room.planeFound ? styles.statusFound : styles.statusScanning;
  const selected = room.items.find((item) => item.instanceId === room.selectedId);
  const selectedProduct = selected ? products.find((product) => product.id === selected.productId) : null;
  const retryTracking = () => { resetARTracking(); setSceneKey((current) => current + 1); };
  const open3DPreview = () => {
    const product = selectedProduct ?? products.find((entry) => entry.placement === 'floor');
    if (product) Linking.openURL(`${WEB_BASE_URL.replace(/\/$/, '')}/ar/${product.slug}`).catch(() => Alert.alert('Preview unavailable', 'Set a reachable website URL in src/config.ts.'));
  };

  const saveDesign = async (shouldShare: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const savedRoom = {
        width: 5,
        length: 4,
        items: room.items.map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          return { id: item.instanceId, ...(product?.variantId ? { productVariantId: product.variantId } : {}), slug: product?.slug, name: product?.name, x: item.position[0], y: item.position[1], z: item.position[2], rotation: item.rotationY };
        }),
      };
      const screenshot = await navigatorRef.current?.arSceneNavigator.takeScreenshot(`nestt-room-${Date.now()}`, false) as { success?: boolean; url?: string; errorCode?: number } | undefined;
      const screenshotTempPath = screenshot?.success ? screenshot.url : undefined;
      let imageSaved = Boolean(screenshotTempPath);
      let saved: LocalDesign;
      try {
        saved = await saveLocalDesign({ id: savedId, title, room: savedRoom, screenshotTempPath, clearScreenshot: !screenshotTempPath });
      } catch (error) {
        if (!screenshotTempPath) throw error;
        imageSaved = false;
        saved = await saveLocalDesign({ id: savedId, title, room: savedRoom, clearScreenshot: true });
      }
      setSavedId(saved.id);
      if (shouldShare) {
        try { await shareDesign(saved); }
        catch (error) { Alert.alert('Design saved, sharing failed', error instanceof Error ? error.message : 'Please try sharing from Saved designs.'); }
      } else Alert.alert('Design saved', imageSaved ? 'Your room and screenshot are saved on this phone.' : 'Your room is saved on this phone. Screenshot capture was unavailable.');
    } catch (error) {
      Alert.alert('Could not save or share this room', error instanceof Error ? error.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ViroARSceneNavigator key={sceneKey} ref={navigatorRef} initialScene={{ scene: RoomARScene }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close room AR" onPress={onClose} style={styles.roundButton}><Text style={styles.closeText}>×</Text></Pressable>
          <View style={styles.statusPill}><View style={[styles.statusDot, planeStatusStyle]} /><Text style={styles.statusText}>{room.tracking === 'limited' ? 'TRACKING LIMITED' : room.tracking === 'unavailable' ? 'TRACKING LOST' : room.planeSelected ? 'ROOM READY' : room.planeFound ? 'FLOOR FOUND' : 'SCANNING ROOM'}</Text></View>
          <View style={styles.roundButton}><Text style={styles.roomIcon}>⌂</Text></View>
        </View>

        {(!room.planeSelected || room.tracking === 'limited' || room.tracking === 'unavailable' || room.failedModels.length > 0) && (
          <View style={[styles.instruction, { top: insets.top + 74 }]}>
            <Text style={styles.instructionTitle}>{room.failedModels.length ? '3D model লোড হয়নি' : room.tracking === 'unavailable' ? 'AR tracking বন্ধ' : room.tracking === 'limited' ? 'Tracking দুর্বল' : room.planeFound ? 'Preview দেখে মেঝেতে ট্যাপ করুন' : 'ঘরের মেঝে স্ক্যান করুন'}</Text>
            <Text style={styles.instructionBody}>{room.failedModels.length ? 'আবার চেষ্টা করুন, অথবা 3D preview খুলুন।' : room.tracking === 'unavailable' ? 'ফোনটি ধীরে নাড়ান এবং আলো বাড়ান। না ফিরলে Retry চাপুন।' : room.tracking === 'limited' ? 'ফোন ধীরে নাড়ান; ফাঁকা বা অন্ধকার মেঝে থেকে আলো ও texture-যুক্ত জায়গায় যান।' : room.planeFound ? 'আধা-স্বচ্ছ furniture preview দেখুন, তারপর highlighted floor-এ ট্যাপ করুন।' : 'ফোনটি ধীরে ধীরে ডানে-বামে নাড়ান। মেঝেতে আলো ও texture থাকলে দ্রুত detect হবে।'}</Text>
            {(room.tracking === 'unavailable' || room.failedModels.length > 0) ? <View style={styles.recoveryRow}><Pressable onPress={retryTracking} style={styles.recoveryButton}><Text style={styles.recoveryText}>Retry AR</Text></Pressable><Pressable onPress={open3DPreview} style={styles.recoveryButton}><Text style={styles.recoveryText}>3D preview</Text></Pressable></View> : null}
          </View>
        )}

        {selectedProduct && room.planeSelected && room.tracking === 'normal' && room.failedModels.length === 0 ? (
          <View style={[styles.selectedCard, { top: insets.top + 76 }]}>
            <Text style={styles.selectedEyebrow}>SELECTED · {selectedProduct.category.toUpperCase()}</Text>
            <Text style={styles.selectedName}>{selectedProduct.name}</Text>
            <Text style={styles.selectedSize}>Footprint {selectedProduct.dimensionsMm[0]} × {selectedProduct.dimensionsMm[1]} mm · height {selectedProduct.dimensionsMm[2]} mm</Text>
          </View>
        ) : null}

        <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 14) + 10 }]}>
          <View style={styles.panelHandle} />
          <View style={styles.panelTitleRow}><View><Text style={styles.panelEyebrow}>ROOM COLLECTION</Text><Text style={styles.panelTitle}>Add furniture</Text></View><Text style={styles.itemCount}>{room.items.length} in room</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {products.filter((product) => product.placement === 'floor').map((product) => {
              const isPlaced = room.items.some((item) => item.productId === product.id);
              return (
                <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`Add ${product.name}`} onPress={() => addRoomItem(product.id)} style={[styles.productTile, isPlaced && styles.productTilePlaced]}>
                  <View style={[styles.miniArt, { backgroundColor: product.color }]}><Text style={styles.miniGlyph}>{product.glyph}</Text></View>
                  <Text numberOfLines={1} style={styles.tileName}>{product.name}</Text>
                  <Text style={styles.tileAction}>{isPlaced ? 'ADD ANOTHER +' : 'ADD TO ROOM +'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.controlRow}>
            <Pressable accessibilityRole="button" disabled={!room.canUndo} onPress={undoRoomChange} style={[styles.removeButton, !room.canUndo && styles.controlDisabled]}><Text style={styles.removeText}>Undo</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate selected furniture left" disabled={!selected} onPress={() => rotateSelectedItem(-1)} style={[styles.controlButton, !selected && styles.controlDisabled]}><Text style={styles.controlIcon}>↶</Text><Text style={styles.controlLabel}>Rotate</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate selected furniture right" disabled={!selected} onPress={() => rotateSelectedItem(1)} style={[styles.controlButton, !selected && styles.controlDisabled]}><Text style={styles.controlIcon}>↷</Text><Text style={styles.controlLabel}>Rotate</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={!selected} onPress={removeSelectedItem} style={[styles.removeButton, !selected && styles.controlDisabled]}><Text style={styles.removeText}>Remove</Text></Pressable>
          </View>
          {!room.planeSelected ? <Text style={styles.footerHint}>Preview দেখে floor-এ tap করুন; তারপর furniture drag বা rotate করুন</Text> : <Text style={styles.footerHint}>বসানো furniture-এ ট্যাপ করে select করুন, তারপর drag বা rotate করুন</Text>}
          {room.loadingModels.length > 0 ? <Text style={styles.footerHint}>Loading 3D model…</Text> : null}
          <TextInput accessibilityLabel="Room design name" value={title} onChangeText={setTitle} maxLength={80} placeholder="Name this room" placeholderTextColor="#8a857c" style={styles.nameInput} />
          <View style={styles.saveRow}>
            <Pressable accessibilityRole="button" disabled={!room.planeSelected || !room.items.length || saving} onPress={() => saveDesign(false)} style={[styles.saveButton, (!room.planeSelected || !room.items.length || saving) && styles.controlDisabled]}><Text style={styles.saveText}>Save design</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={!room.planeSelected || !room.items.length || saving} onPress={() => saveDesign(true)} style={[styles.shareButton, (!room.planeSelected || !room.items.length || saving) && styles.controlDisabled]}><Text style={styles.shareText}>{saving ? 'Saving…' : 'Save & share'}</Text></Pressable>
          </View>
          <Text style={styles.footerHint}>Screenshot stays on this phone. Sharing sends the image and a layout link; anyone with the link can view the layout.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#24231f' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  topBar: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 44, height: 44, backgroundColor: '#171713b8', borderWidth: 1, borderColor: '#ffffff38', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 29, lineHeight: 31, fontWeight: '300' },
  roomIcon: { color: '#fff', fontSize: 21 },
  statusPill: { height: 32, paddingHorizontal: 12, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#171713b8', borderRadius: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusReady: { backgroundColor: '#83bd7b' },
  statusFound: { backgroundColor: '#edc36b' },
  statusScanning: { backgroundColor: '#ffffff' },
  statusWarning: { backgroundColor: '#e4a347' },
  statusText: { color: '#fff', fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  instruction: { position: 'absolute', alignSelf: 'center', width: '82%', paddingHorizontal: 17, paddingVertical: 15, backgroundColor: '#191814d9', borderWidth: 1, borderColor: '#ffffff26', borderRadius: 4 },
  instructionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  instructionBody: { marginTop: 6, color: '#e4dfd6', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  recoveryRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  recoveryButton: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#ffffff88' },
  recoveryText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  selectedCard: { position: 'absolute', left: 18, right: 18, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#191814d9', borderRadius: 3 },
  selectedEyebrow: { color: '#f49a76', fontSize: 8, letterSpacing: 1.2, fontWeight: '800' },
  selectedName: { marginTop: 4, color: '#fff', fontSize: 16, fontWeight: '700' },
  selectedSize: { marginTop: 3, color: '#d6d0c6', fontSize: 9 },
  bottomPanel: { backgroundColor: '#f8f6f2', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 9 },
  panelHandle: { alignSelf: 'center', width: 34, height: 4, backgroundColor: '#d4cfc6', borderRadius: 3 },
  panelTitleRow: { paddingHorizontal: 18, paddingTop: 11, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  panelEyebrow: { color: '#9a4d37', fontSize: 8, letterSpacing: 1.4, fontWeight: '800' },
  panelTitle: { marginTop: 3, color: '#27251f', fontSize: 20, fontWeight: '600' },
  itemCount: { color: '#77736b', fontSize: 9, marginBottom: 3 },
  carousel: { paddingHorizontal: 17, gap: 9, paddingBottom: 10 },
  productTile: { width: 105, padding: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8e3da' },
  productTilePlaced: { borderColor: '#d8ad9c' },
  miniArt: { height: 55, alignItems: 'center', justifyContent: 'center' },
  miniGlyph: { color: '#514b40', fontSize: 26 },
  tileName: { marginTop: 6, color: '#302d27', fontSize: 9, fontWeight: '700' },
  tileAction: { marginTop: 4, color: orange, fontSize: 7, letterSpacing: 0.45, fontWeight: '900' },
  controlRow: { marginHorizontal: 17, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8e3da', flexDirection: 'row', alignItems: 'center', gap: 7 },
  controlButton: { flex: 1, minHeight: 44, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1dcd3', alignItems: 'center', justifyContent: 'center' },
  controlIcon: { color: '#37342e', fontSize: 15, lineHeight: 17 },
  controlLabel: { color: '#625e56', fontSize: 7, fontWeight: '700' },
  controlDisabled: { opacity: 0.4 },
  removeButton: { minHeight: 44, paddingHorizontal: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dec7be', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#9a472e', fontSize: 9, fontWeight: '800' },
  footerHint: { paddingHorizontal: 18, paddingTop: 8, color: '#827c72', fontSize: 8, textAlign: 'center' },
  nameInput: { marginHorizontal: 17, marginTop: 9, height: 38, borderWidth: 1, borderColor: '#ded9d0', backgroundColor: '#fff', color: '#27251f', paddingHorizontal: 10, fontSize: 11 },
  saveRow: { flexDirection: 'row', gap: 8, marginHorizontal: 17, marginTop: 8 },
  saveButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: orange },
  saveText: { color: orange, fontSize: 10, fontWeight: '800' },
  shareButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: orange },
  shareText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
