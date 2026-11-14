import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCart, placeOrder, removeCartItem, updateCartItem } from '../api/nestt-api';

type Cart = Awaited<ReturnType<typeof getCart>>;
type Address = { name: string; phone: string; region: string; city: string; area: string; address: string; postalCode: string };
const blankAddress: Address = { name: '', phone: '', region: '', city: '', area: '', address: '', postalCode: '' };

export function CartScreen({ onBack, signedIn }: { onBack: () => void; signedIn: boolean }) {
  const [items, setItems] = useState<Cart>([]);
  const [address, setAddress] = useState(blankAddress);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => { try { setItems(await getCart()); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not load your cart'); } finally { setLoading(false); } }, []);

  useEffect(() => { if (signedIn) void refresh(); else setLoading(false); }, [refresh, signedIn]);
  const setQuantity = async (variantId: string, quantity: number) => {
    try { if (quantity < 1) await removeCartItem(variantId); else await updateCartItem(variantId, quantity); await refresh(); }
    catch (error) { Alert.alert('Cart update failed', error instanceof Error ? error.message : 'Please try again.'); }
  };
  const checkout = async () => {
    if (!items.length) return;
    if (!address.name || !address.phone || !address.region || !address.city || !address.area || !address.address) { Alert.alert('Complete delivery details', 'Name, phone, region, city, area and address are required.'); return; }
    setBusy(true);
    try {
      const order = await placeOrder(items.map((item) => ({ variantId: item.variant.id, quantity: item.quantity })), address);
      await Promise.all(items.map((item) => removeCartItem(item.variant.id).catch(() => undefined)));
      setItems([]);
      Alert.alert('Order placed', `Your order number is ${order.orderCode}.`);
    } catch (error) { Alert.alert('Could not place order', error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const updateAddress = (key: keyof Address, value: string) => setAddress((current) => ({ ...current, [key]: value }));

  return (
    <View style={styles.page}>
      <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>Your cart</Text></View>
      {loading ? <ActivityIndicator style={styles.loader} color="#e85b2a" /> : !signedIn ? <View style={styles.empty}><Text style={styles.emptyTitle}>Sign in to view your cart</Text><Text style={styles.muted}>Your cart is saved to your Nestt account.</Text></View> : !items.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>Your cart is empty</Text><Text style={styles.muted}>{notice || 'Add an in-stock product from the collection.'}</Text></View> : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((item) => <View key={item.variant.id} style={styles.item}><View style={styles.itemCopy}><Text style={styles.itemName}>{item.variant.product.name}</Text><Text style={styles.sku}>{item.variant.sku} · ৳{item.variant.price}</Text></View><View style={styles.qty}><Pressable onPress={() => void setQuantity(item.variant.id, item.quantity - 1)} style={styles.qtyButton}><Text>−</Text></Pressable><Text style={styles.qtyText}>{item.quantity}</Text><Pressable onPress={() => void setQuantity(item.variant.id, item.quantity + 1)} style={styles.qtyButton}><Text>+</Text></Pressable></View></View>)}
          <Text style={styles.section}>Delivery details</Text>
          {(['name', 'phone', 'region', 'city', 'area', 'address', 'postalCode'] as const).map((key) => <TextInput key={key} placeholder={key === 'postalCode' ? 'Postal code (optional)' : key[0].toUpperCase() + key.slice(1)} value={address[key]} onChangeText={(value) => updateAddress(key, value)} multiline={key === 'address'} style={[styles.input, key === 'address' && styles.addressInput]} />)}
          <Pressable disabled={busy} onPress={() => void checkout()} style={[styles.checkout, busy && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Place order</Text>}</Pressable>
          <Text style={styles.muted}>Final price, stock and delivery rules are confirmed by Nestt checkout.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f6f2' }, header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#ebe7df' }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3ded5' }, backText: { fontSize: 28, color: '#27251f' }, title: { fontSize: 21, fontWeight: '600', color: '#27251f' }, loader: { marginTop: 50 }, empty: { marginTop: 90, paddingHorizontal: 28, alignItems: 'center' }, emptyTitle: { color: '#27251f', fontSize: 18, fontWeight: '700' }, muted: { marginTop: 8, color: '#77736b', fontSize: 11, lineHeight: 17 }, content: { padding: 18, paddingBottom: 35 }, item: { minHeight: 66, marginBottom: 8, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ece8e1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, itemCopy: { flex: 1 }, itemName: { color: '#27251f', fontSize: 13, fontWeight: '700' }, sku: { marginTop: 4, color: '#77736b', fontSize: 10 }, qty: { flexDirection: 'row', alignItems: 'center', gap: 9 }, qtyButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ded9d0' }, qtyText: { minWidth: 16, textAlign: 'center', color: '#27251f' }, section: { marginTop: 22, marginBottom: 5, color: '#9a4d37', fontSize: 10, letterSpacing: 1.2, fontWeight: '800' }, input: { minHeight: 44, marginTop: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ded9d0', backgroundColor: '#fff', color: '#27251f', fontSize: 12 }, addressInput: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' }, checkout: { height: 48, marginTop: 18, backgroundColor: '#e85b2a', alignItems: 'center', justifyContent: 'center' }, checkoutText: { color: '#fff', fontSize: 12, fontWeight: '800' }, disabled: { opacity: 0.6 },
});
