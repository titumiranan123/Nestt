import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isARSupportedOnDevice, requestRequiredPermissions } from '@reactvision/react-viro';
import { arProducts } from './src/catalog/ar-products';
import type { ARProduct } from './src/catalog/ar-products';
import { RoomARScreen } from './src/screens/RoomARScreen';
import { beginRoom, beginRoomFromDesign, useARRoom } from './src/state/ar-room-store';
import { SavedDesignsScreen } from './src/screens/SavedDesignsScreen';
import type { LocalDesign } from './src/storage/local-designs';
import { WEB_BASE_URL } from './src/config';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const orange = '#e85b2a';
const ink = '#27251f';
const muted = '#77736b';

function AppContent() {
  const [arProduct, setArProduct] = useState<ARProduct | null>(null);
  const [editingDesign, setEditingDesign] = useState<LocalDesign | null>(null);
  const [linkLoading, setLinkLoading] = useState(true);
  const [section, setSection] = useState<'catalog' | 'designs'>('catalog');
  const products = arProducts;

  const startAR = useCallback(async (product: ARProduct, keepRoom = false) => {
    try {
      if (product.placement !== 'floor') {
        Alert.alert(
          `${product.placement === 'wall' ? 'Wall' : 'Ceiling'} placement is not ready`,
          'This sample can be viewed in 3D. It will not be placed on the floor in AR.',
          [
            { text: 'Close', style: 'cancel' },
            { text: 'Open 3D preview', onPress: () => { Linking.openURL(`${WEB_BASE_URL.replace(/\/$/, '')}/ar/${product.slug}`).catch(() => Alert.alert('Preview unavailable', 'Set a reachable website URL in src/config.ts.')); } },
          ],
        );
        return;
      }
      const support = await isARSupportedOnDevice();
      if (!support.isARSupported) {
        Alert.alert('AR is not supported on this phone', 'You can still rotate this furniture model in 3D.', [
          { text: 'Close', style: 'cancel' },
          { text: 'Open 3D preview', onPress: () => { Linking.openURL(`${WEB_BASE_URL.replace(/\/$/, '')}/ar/${product.slug}`).catch(() => Alert.alert('Preview unavailable', 'Set a reachable website URL in src/config.ts.')); } },
        ]);
        return;
      }
      const permissions = await requestRequiredPermissions(['camera']);
      if (!permissions.camera) {
        Alert.alert('Camera permission needed', 'Allow camera access in phone settings to place furniture in your room.', [
          { text: 'Close', style: 'cancel' },
          { text: 'Open settings', onPress: () => { Linking.openSettings().catch(() => undefined); } },
        ]);
        return;
      }
      if (!keepRoom) beginRoom(product.id);
      setArProduct(product);
    } catch {
      Alert.alert('Could not start AR', 'Please check that your phone supports AR and try again.');
    }
  }, []);

  const openLink = useCallback((rawUrl: string | null) => {
    if (!rawUrl) return;
    try {
      const url = new URL(rawUrl);
      const slug = url.searchParams.get('asset') ?? url.searchParams.get('product') ?? url.pathname.split('/').filter(Boolean).at(-1);
      const isNesttScheme = url.protocol === 'nestt:' && (url.hostname === 'ar' || url.pathname.startsWith('/ar'));
      const isArWebRoute = url.protocol === 'https:' && url.pathname.split('/').includes('ar');
      const isRoomPlannerRoute = (url.protocol === 'nestt:' && url.hostname === 'room-planner') || (url.protocol === 'https:' && url.pathname === '/room-planner');
      const shareId = url.pathname.split('/').includes('room-planner') ? url.searchParams.get('share') : null;
      const designValue = url.searchParams.get('design');
      if (designValue) {
        const room = JSON.parse(designValue) as LocalDesign['room'];
        if (!room || !Array.isArray(room.items) || room.items.length > 50) throw new Error('Invalid shared room');
        const items = room.items.filter((item) => item && typeof item.id === 'string' && Number.isFinite(item.x) && Number.isFinite(item.z) && Number.isFinite(item.rotation) && products.some((entry) => entry.slug === item.slug && entry.placement === 'floor'));
        beginRoomFromDesign(items.map((item) => ({ ...item, y: Number.isFinite(item.y) ? item.y : 0, rotation: item.rotation * 180 / Math.PI })));
        const first = items[0];
        const product = products.find((entry) => entry.slug === first?.slug || entry.id === first?.slug);
        if (product) { setEditingDesign(null); startAR(product, true); }
        else Alert.alert('Design unavailable', 'This shared design does not include a model from the current free sample collection.');
        return;
      }
      if (shareId) {
        Alert.alert('Backend link unavailable', 'This share link was saved on a Nestt server. Use a design link shared from this static demo.');
        return;
      }
      if (isRoomPlannerRoute) {
        const starter = products.find((entry) => entry.slug === 'coffee-table');
        if (starter) { setEditingDesign(null); startAR(starter); }
        return;
      }
      if (isNesttScheme || isArWebRoute) {
        const product = slug ? products.find((entry) => entry.slug === slug || entry.id === slug || entry.categorySlug === slug || slugify(entry.category).includes(slug) || slugify(entry.name).includes(slug)) : undefined;
        if (product) {
          setEditingDesign(null);
          startAR(product);
        }
      }
    } catch {
      // Ignore malformed or unrelated links and keep the catalogue available.
    }
  }, [products, startAR]);

  useEffect(() => {
    let alive = true;
    Linking.getInitialURL().then((url) => {
      if (alive) { openLink(url); setLinkLoading(false); }
    }).catch(() => { if (alive) setLinkLoading(false); });
    const subscription = Linking.addEventListener('url', ({ url }) => openLink(url));
    return () => { alive = false; subscription.remove(); };
  }, [openLink]);

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (arProduct) { setArProduct(null); setEditingDesign(null); return true; }
      if (section === 'designs') { setSection('catalog'); return true; }
      return false;
    });
    return () => listener.remove();
  }, [arProduct, section]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f6f2" />
      {linkLoading ? <View style={styles.loading}><ActivityIndicator color={orange} /></View> : null}
      {arProduct ? <RoomARScreen products={products} initialDesign={editingDesign} onClose={() => { setArProduct(null); setEditingDesign(null); }} /> : section === 'designs' ? <SavedDesignsScreen onBack={() => setSection('catalog')} onOpen={(design: LocalDesign) => {
        beginRoomFromDesign(design.room.items);
        const first = design.room.items[0];
        const product = products.find((entry) => entry.slug === first?.slug || entry.id === first?.slug);
        if (product) { setEditingDesign(design); setSection('catalog'); startAR(product, true); }
        else Alert.alert('Model unavailable', 'This saved design uses products that are not in the current AR catalogue.');
      }} /> : <CatalogScreen products={products} onStartAR={(product) => { setEditingDesign(null); startAR(product); }} onSavedDesigns={() => setSection('designs')} />}
    </SafeAreaProvider>
  );
}

function CatalogScreen({ products, onStartAR, onSavedDesigns }: { products: ARProduct[]; onStartAR: (product: ARProduct) => void; onSavedDesigns: () => void }) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category)))];
  const visibleProducts = category === 'All' ? products : products.filter((product) => product.category === category);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>NESTT</Text>
        <Pressable accessibilityRole="button" onPress={onSavedDesigns} style={styles.headerAction}><Text style={styles.actionText}>Saved designs</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>ROOM DESIGN · AUGMENTED REALITY</Text>
          <Text style={styles.title}>See it in{ '\n' }your space.</Text>
          <Text style={styles.subtitle}>Choose a piece, scan your floor, and arrange furniture at room scale.</Text>
          <View style={styles.heroPills}><Text style={styles.pill}>Live camera AR</Text><Text style={styles.pill}>Multiple products</Text></View>
        </View>
        <View style={styles.collectionHead}><View><Text style={styles.eyebrow}>THE COLLECTION</Text><Text style={styles.sectionTitle}>Explore furniture</Text></View><Text style={styles.count}>{products.length} models</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {categories.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityLabel={`${item} category`} accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.productList}>
          {visibleProducts.map((product, index) => (
            <View key={product.id} style={styles.productCard}>
              <View style={[styles.productArt, { backgroundColor: product.color }]}>
                <Text style={styles.productNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.productGlyph}>{product.glyph}</Text>
                <Text style={styles.modelTag}>3D · AR</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productCategory}>{product.category.toUpperCase()}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.dimensions}>Footprint {product.dimensionsMm[0]} × {product.dimensionsMm[1]} mm · height {product.dimensionsMm[2]} mm</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`${product.placement === 'floor' ? 'View in my room' : 'Open 3D preview'}: ${product.name}`} onPress={() => onStartAR(product)} style={styles.tryButton}>
                  <Text style={styles.tryButtonText}>{product.placement === 'floor' ? 'View in my room' : 'Open 3D preview'}</Text><Text style={styles.tryArrow}>↗</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.disclaimer}>The current library contains free sample models for the AR prototype. Match each item to an approved Nestt SKU model before public sales use.</Text>
      </ScrollView>
    </View>
  );
}

export default function App() {
  return <AppErrorBoundary><AppContent /></AppErrorBoundary>;
}

export function useRoomItemCount() {
  return useARRoom().items.length;
}

export const palette = { orange, ink, muted };

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f6f2' },
  loading: { position: 'absolute', zIndex: 10, top: 4, right: 16 },
  header: { height: 54, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: orange, fontSize: 23, letterSpacing: 2.3, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAction: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3ded5' },
  actionText: { color: ink, fontSize: 9, fontWeight: '700' },
  headerIcon: { minWidth: 42, height: 38, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3ded5' },
  headerIconText: { color: ink, fontSize: 9, fontWeight: '700' },
  hero: { marginHorizontal: 20, marginTop: 10, padding: 23, minHeight: 248, backgroundColor: '#e8e2d7', justifyContent: 'center' },
  eyebrow: { fontSize: 9, letterSpacing: 1.6, fontWeight: '800', color: '#9a4d37' },
  title: { marginTop: 13, color: ink, fontSize: 43, lineHeight: 46, letterSpacing: -1.8, fontWeight: '300' },
  subtitle: { marginTop: 10, maxWidth: 300, color: '#635f57', fontSize: 13, lineHeight: 19 },
  heroPills: { flexDirection: 'row', gap: 7, marginTop: 15 },
  pill: { paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#f8f6f2', color: '#59554d', fontSize: 9, fontWeight: '700' },
  collectionHead: { marginHorizontal: 22, marginTop: 29, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { marginTop: 5, fontSize: 22, color: ink, fontWeight: '600' },
  count: { fontSize: 10, color: muted, marginBottom: 3 },
  categoryList: { paddingHorizontal: 20, gap: 8, paddingTop: 15, paddingBottom: 14 },
  categoryChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: '#e2ddd4', borderRadius: 2 },
  categoryChipActive: { backgroundColor: ink, borderColor: ink },
  categoryText: { fontSize: 10, color: '#5f5b53' },
  categoryTextActive: { color: '#fff' },
  productList: { paddingHorizontal: 20, gap: 12 },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece8e1', minHeight: 156 },
  productArt: { width: 118, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  productNumber: { fontSize: 51, color: '#2d2a24', opacity: 0.14, fontWeight: '800' },
  productGlyph: { position: 'absolute', fontSize: 36, color: '#4c4539' },
  modelTag: { position: 'absolute', top: 9, left: 8, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#ffffffd9', color: '#4d4941', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  productInfo: { flex: 1, paddingHorizontal: 13, paddingVertical: 12, justifyContent: 'center' },
  productCategory: { color: '#9a4d37', fontSize: 8, letterSpacing: 1.2, fontWeight: '800' },
  productName: { marginTop: 5, color: ink, fontSize: 14, fontWeight: '700' },
  dimensions: { marginTop: 4, color: muted, fontSize: 9 },
  tryButton: { marginTop: 10, minHeight: 44, paddingHorizontal: 10, backgroundColor: orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tryButtonText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.35 },
  tryArrow: { color: '#fff', fontSize: 15 },
  cartButton: { marginTop: 6, minHeight: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e0d8cc' },
  cartButtonText: { color: '#675e50', fontSize: 9, fontWeight: '700' },
  cartButtonDisabled: { opacity: 0.45 },
  disclaimer: { marginHorizontal: 22, marginTop: 18, color: '#8b857b', fontSize: 9, lineHeight: 14 },
});
