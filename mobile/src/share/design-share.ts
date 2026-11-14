import { Share as NativeShare } from 'react-native';
import FileShare from 'react-native-share';
import { WEB_BASE_URL } from '../config';
import { designImageUri, type LocalDesign, type RoomLayout } from '../storage/local-designs';

export function designPreviewUrl(room: RoomLayout) {
  const previewRoom = {
    ...room,
    items: room.items.map((item) => ({ ...item, rotation: item.rotation * Math.PI / 180 })),
  };
  return `${WEB_BASE_URL.replace(/\/$/, '')}/room-planner?design=${encodeURIComponent(JSON.stringify(previewRoom))}`;
}

export async function shareDesign(design: LocalDesign) {
  const url = designPreviewUrl(design.room);
  const image = designImageUri(design);
  if (image) {
    const type = /\.jpe?g$/i.test(image) ? 'image/jpeg' : 'image/png';
    await FileShare.open({ title: design.title, subject: design.title, message: `See my Nestt room design: ${url}`, url: image, type, failOnCancel: false });
  } else {
    await NativeShare.share({ title: design.title, message: `See my Nestt room design: ${url}`, url });
  }
}
