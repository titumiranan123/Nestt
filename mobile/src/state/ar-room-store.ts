import { useSyncExternalStore } from 'react';
import { getARProduct } from '../catalog/ar-products';
import type { Viro3DPoint } from '@reactvision/react-viro/dist/components/Types/ViroUtils';

export type RoomItem = { instanceId: string; productId: string; position: Viro3DPoint; rotationY: number };
export type ARRoomState = {
  items: RoomItem[];
  selectedId: string | null;
  planeFound: boolean;
  planeSelected: boolean;
  tracking: 'initializing' | 'normal' | 'limited' | 'unavailable';
  canUndo: boolean;
  loadingModels: string[];
  failedModels: string[];
};

const listeners = new Set<() => void>();
const initialRoom = (): ARRoomState => ({ items: [], selectedId: null, planeFound: false, planeSelected: false, tracking: 'initializing', canUndo: false, loadingModels: [], failedModels: [] });
let state: ARRoomState = initialRoom();
let undoStack: Array<{ items: RoomItem[]; selectedId: string | null }> = [];
let draggingId: string | null = null;
let dragEndTimer: ReturnType<typeof setTimeout> | null = null;
const positions: Viro3DPoint[] = [[0, 0, 0], [-0.85, 0, 0], [0.85, 0, 0], [-1.5, 0, 0.4], [1.5, 0, 0.4], [0, 0, -1.25]];

function commit(next: ARRoomState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function remember() {
  undoStack.push({ items: state.items.map((item) => ({ ...item, position: [...item.position] as Viro3DPoint })), selectedId: state.selectedId });
  if (undoStack.length > 25) undoStack.shift();
}

function endDrag() {
  draggingId = null;
  if (dragEndTimer) clearTimeout(dragEndTimer);
  dragEndTimer = null;
}

const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const getSnapshot = () => state;
export const useARRoom = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export function beginRoom(productId?: string) {
  endDrag();
  undoStack = [];
  const product = productId ? getARProduct(productId) : undefined;
  const firstItem = product?.placement === 'floor' ? [{ instanceId: `${product.id}-${Date.now()}`, productId: product.id, position: [0, 0, 0] as Viro3DPoint, rotationY: 0 }] : [];
  commit({ ...initialRoom(), items: firstItem, selectedId: firstItem[0]?.instanceId ?? null });
}

export function beginRoomFromDesign(items: Array<{ id: string; productVariantId?: string; slug?: string; x: number; y: number; z: number; rotation: number }>) {
  endDrag();
  undoStack = [];
  const restored: RoomItem[] = items.flatMap((saved) => {
    const product = getARProduct(saved.productVariantId ?? saved.slug ?? '');
    if (!product || product.placement !== 'floor') return [];
    return [{ instanceId: saved.id, productId: product.id, position: [saved.x, saved.y, saved.z] as Viro3DPoint, rotationY: saved.rotation }];
  });
  commit({ ...initialRoom(), items: restored, selectedId: restored[0]?.instanceId ?? null });
}

export function addRoomItem(productId: string) {
  if (getARProduct(productId)?.placement !== 'floor' || state.items.length >= 50) return;
  endDrag();
  remember();
  const instanceId = `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: RoomItem = { instanceId, productId, position: positions[state.items.length % positions.length], rotationY: 0 };
  commit({ ...state, items: [...state.items, item], selectedId: instanceId, canUndo: true });
}

export function selectRoomItem(instanceId: string | null) { commit({ ...state, selectedId: instanceId }); }
export function setPlaneFound(planeFound: boolean) { if (state.planeFound !== planeFound) commit({ ...state, planeFound }); }
export function setPlaneSelected(planeSelected: boolean) { commit({ ...state, planeSelected }); }
export function resetARTracking() { commit({ ...state, planeFound: false, planeSelected: false, tracking: 'initializing', loadingModels: [], failedModels: [] }); }
export function setTracking(tracking: ARRoomState['tracking']) { if (state.tracking !== tracking) commit({ ...state, tracking }); }
export function setModelLoading(id: string, loading: boolean) {
  const next = loading ? [...new Set([...state.loadingModels, id])] : state.loadingModels.filter((item) => item !== id);
  commit({ ...state, loadingModels: next, failedModels: loading ? state.failedModels.filter((item) => item !== id) : state.failedModels });
}
export function setModelFailed(id: string) { commit({ ...state, loadingModels: state.loadingModels.filter((item) => item !== id), failedModels: [...new Set([...state.failedModels, id])] }); }

export function setRoomItemPosition(instanceId: string, position: Viro3DPoint) {
  if (!state.items.some((item) => item.instanceId === instanceId)) return;
  if (draggingId !== instanceId) { endDrag(); remember(); draggingId = instanceId; }
  if (dragEndTimer) clearTimeout(dragEndTimer);
  dragEndTimer = setTimeout(endDrag, 500);
  commit({ ...state, items: state.items.map((item) => item.instanceId === instanceId ? { ...item, position } : item), canUndo: true });
}

export function rotateSelectedItem(direction: -1 | 1) {
  if (!state.selectedId) return;
  endDrag();
  remember();
  commit({ ...state, items: state.items.map((item) => item.instanceId === state.selectedId ? { ...item, rotationY: item.rotationY + direction * 15 } : item), canUndo: true });
}

export function removeSelectedItem() {
  if (!state.selectedId) return;
  endDrag();
  remember();
  const items = state.items.filter((item) => item.instanceId !== state.selectedId);
  commit({ ...state, items, selectedId: items.at(-1)?.instanceId ?? null, canUndo: true, loadingModels: state.loadingModels.filter((id) => id !== state.selectedId), failedModels: state.failedModels.filter((id) => id !== state.selectedId) });
}

export function undoRoomChange() {
  endDrag();
  const previous = undoStack.pop();
  if (previous) commit({ ...state, ...previous, canUndo: undoStack.length > 0 });
}
