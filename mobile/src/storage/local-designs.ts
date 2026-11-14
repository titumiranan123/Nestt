import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

export type RoomLayout = {
  width: number;
  length: number;
  items: Array<{ id: string; slug?: string; name?: string; x: number; y: number; z: number; rotation: number }>;
};

export type LocalDesign = {
  id: string;
  title: string;
  room: RoomLayout;
  screenshotFile?: string;
  createdAt: string;
  updatedAt: string;
};

const storageKey = 'nestt.ar.designs.v1';
const imagePath = (fileName: string) => `${RNFS.DocumentDirectoryPath}/${fileName}`;

export function designImageUri(design: LocalDesign) {
  return design.screenshotFile ? `file://${imagePath(design.screenshotFile)}` : undefined;
}

export async function listLocalDesigns(): Promise<LocalDesign[]> {
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  return Array.isArray(parsed) ? parsed.filter((item): item is LocalDesign => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && item.room && Array.isArray(item.room.items))) : [];
}

export async function saveLocalDesign(input: { id?: string; title: string; room: RoomLayout; screenshotTempPath?: string; clearScreenshot?: boolean }) {
  const designs = await listLocalDesigns();
  const existing = designs.find((item) => item.id === input.id);
  const id = existing?.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  let screenshotFile = input.clearScreenshot ? undefined : existing?.screenshotFile;
  let copiedFile: string | undefined;
  if (input.screenshotTempPath) {
    const ext = input.screenshotTempPath.match(/\.(png|jpe?g)(?:\?|$)/i)?.[1]?.toLowerCase() ?? 'png';
    const nextFile = `nestt-room-${id}-${Date.now()}.${ext}`;
    const source = input.screenshotTempPath.replace(/^file:\/\//, '');
    await RNFS.copyFile(source, imagePath(nextFile));
    copiedFile = nextFile;
    screenshotFile = nextFile;
  }
  const design: LocalDesign = { id, title: input.title.trim() || 'My room', room: input.room, screenshotFile, createdAt: existing?.createdAt ?? now, updatedAt: now };
  const next = [design, ...designs.filter((item) => item.id !== id)];
  const discarded = next.slice(50);
  try { await AsyncStorage.setItem(storageKey, JSON.stringify(next.slice(0, 50))); }
  catch (error) {
    if (copiedFile && await RNFS.exists(imagePath(copiedFile))) await RNFS.unlink(imagePath(copiedFile));
    throw error;
  }
  const oldFiles = [existing?.screenshotFile, ...discarded.map((item) => item.screenshotFile)].filter((file): file is string => Boolean(file && file !== screenshotFile));
  for (const file of oldFiles) {
    try { if (await RNFS.exists(imagePath(file))) await RNFS.unlink(imagePath(file)); }
    catch { /* The saved design remains valid if an old image cannot be cleaned up. */ }
  }
  return design;
}

export async function renameLocalDesign(id: string, title: string) {
  const designs = await listLocalDesigns();
  const updated = designs.map((item) => item.id === id ? { ...item, title: title.trim() || item.title, updatedAt: new Date().toISOString() } : item);
  await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  return updated;
}

export async function deleteLocalDesign(id: string) {
  const designs = await listLocalDesigns();
  const removed = designs.find((item) => item.id === id);
  await AsyncStorage.setItem(storageKey, JSON.stringify(designs.filter((item) => item.id !== id)));
  if (removed?.screenshotFile && await RNFS.exists(imagePath(removed.screenshotFile))) await RNFS.unlink(imagePath(removed.screenshotFile));
}
