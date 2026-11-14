import React, { useRef, useState } from 'react';
import {
  ViroARPlaneSelector,
  ViroARScene,
  ViroAmbientLight,
  Viro3DObject,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import type { ViroARPlaneSelector as ViroARPlaneSelectorType } from '@reactvision/react-viro';
import { getARProduct } from '../catalog/ar-products';
import { selectRoomItem, setModelFailed, setModelLoading, setPlaneFound, setPlaneSelected, setRoomItemPosition, setTracking, useARRoom } from '../state/ar-room-store';
import type { Viro3DPoint } from '@reactvision/react-viro/dist/components/Types/ViroUtils';

export function RoomARScene() {
  const room = useARRoom();
  const selectorRef = useRef<ViroARPlaneSelectorType | null>(null);
  const planeIds = useRef(new Set<string>());
  const selectedPlaneId = useRef<string | null>(null);
  const lastPreviewAt = useRef(0);
  const [previewPosition, setPreviewPosition] = useState<Viro3DPoint | null>(null);
  const previewItem = room.items[0];
  const previewProduct = previewItem ? getARProduct(previewItem.productId) : null;

  return (
    <ViroARScene
      anchorDetectionTypes={['PlanesHorizontal']}
      onTrackingUpdated={(tracking) => setTracking(tracking === ViroTrackingStateConstants.TRACKING_NORMAL ? 'normal' : tracking === ViroTrackingStateConstants.TRACKING_LIMITED ? 'limited' : 'unavailable')}
      onCameraARHitTest={({ hitTestResults }) => {
        if (room.planeSelected || Date.now() - lastPreviewAt.current < 120) return;
        lastPreviewAt.current = Date.now();
        const hit = hitTestResults.find((result) => result.type === 'ExistingPlaneUsingExtent' || result.type === 'ExistingPlane');
        setPreviewPosition(hit?.transform.position ?? null);
      }}
      onAnchorFound={(anchor) => {
        if (anchor.classification === 'Ceiling') return;
        selectorRef.current?.handleAnchorFound(anchor);
        if ((anchor.width ?? 0) >= 0.8 && (anchor.height ?? 0) >= 0.8) {
          planeIds.current.add(anchor.anchorId);
          setPlaneFound(true);
        }
      }}
      onAnchorUpdated={(anchor) => {
        if (anchor.classification === 'Ceiling') return;
        if (!planeIds.current.has(anchor.anchorId) && (anchor.width ?? 0) >= 0.8 && (anchor.height ?? 0) >= 0.8) {
          planeIds.current.add(anchor.anchorId);
          setPlaneFound(true);
          selectorRef.current?.handleAnchorFound(anchor);
        } else selectorRef.current?.handleAnchorUpdated(anchor);
      }}
      onAnchorRemoved={(anchor) => {
        if (!anchor) return;
        planeIds.current.delete(anchor.anchorId);
        setPlaneFound(planeIds.current.size > 0);
        if (selectedPlaneId.current === anchor.anchorId) { selectedPlaneId.current = null; setPlaneSelected(false); }
        selectorRef.current?.handleAnchorRemoved(anchor);
      }}
    >
      <ViroAmbientLight color="#ffffff" intensity={170} />
      {!room.planeSelected && room.tracking === 'normal' && previewPosition && previewProduct?.placement === 'floor' ? (
        <Viro3DObject
          key={`preview-${previewItem.instanceId}`}
          source={previewProduct.source}
          type="GLB"
          position={[previewPosition[0], previewPosition[1] + previewProduct.floorOffsetMeters, previewPosition[2]]}
          scale={previewProduct.scale}
          opacity={0.4}
          ignoreEventHandling
          onError={() => setModelFailed(previewItem.instanceId)}
        />
      ) : null}
      <ViroARPlaneSelector
        ref={selectorRef}
        minHeight={0.8}
        minWidth={0.8}
        alignment="HorizontalUpward"
        onPlaneDetected={(plane) => plane.classification !== 'Ceiling'}
        hideOverlayOnSelection
        onPlaneSelected={(plane) => { selectedPlaneId.current = plane.anchorId; setPreviewPosition(null); setPlaneSelected(true); }}
        onPlaneRemoved={(id) => { if (selectedPlaneId.current === id) { selectedPlaneId.current = null; setPlaneSelected(false); } }}
      >
        {room.items.map((item) => {
          const product = getARProduct(item.productId);
          if (!product || product.placement !== 'floor') return null;
          return (
            <Viro3DObject
              key={item.instanceId}
              source={product.source}
              type="GLB"
              position={[item.position[0], product.floorOffsetMeters, item.position[2]]}
              rotation={[0, item.rotationY, 0]}
              scale={product.scale}
              dragType="FixedToPlane"
              dragPlane={{ planePoint: [0, 0, 0], planeNormal: [0, 1, 0], maxDistance: 7 }}
              onClick={() => selectRoomItem(item.instanceId)}
              onDrag={(position) => setRoomItemPosition(item.instanceId, position)}
              onLoadStart={() => setModelLoading(item.instanceId, true)}
              onLoadEnd={(event) => event.nativeEvent.success ? setModelLoading(item.instanceId, false) : setModelFailed(item.instanceId)}
              onError={() => setModelFailed(item.instanceId)}
            />
          );
        })}
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}
