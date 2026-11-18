"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { arAssets, getArAssetUrl, type ArAsset } from "@/lib/ar-assets";
import { ArPhoneQr } from "@/components/ar/ArPhoneQr";

type PlacedItem = { id: string; slug?: string; productVariantId?: string; name?: string; x: number; y?: number; z: number; rotation: number };
type Design = { width: number; length: number; items: PlacedItem[] };
type PlannerAsset = { slug: string; name: string; category: string; dimensionsMm: [number, number, number]; modelUrl: string };
type ThreeRuntime = {
  THREE: typeof import("three");
  scene: import("three").Scene;
  camera: import("three").PerspectiveCamera;
  renderer: import("three").WebGLRenderer;
  controls: InstanceType<typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls>;
  floor: import("three").Mesh;
  groups: Map<string, import("three").Group>;
  loadItems: (items: PlacedItem[]) => void;
  resize: () => void;
  animate: () => void;
  frame: number;
};

const STORAGE_KEY = "nestt-room-design-v1";
const defaultDesign: Design = { width: 5, length: 4, items: [] };
const sampleAssets: PlannerAsset[] = arAssets.filter((asset) => asset.placement === "floor").map((asset) => ({ ...asset, modelUrl: getArAssetUrl(asset) }));

function encodeDesign(design: Design) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(design)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeDesign(value: string): Design | null {
  try {
    if (value.trimStart().startsWith("{")) {
      const parsed = JSON.parse(value) as Design;
      if (typeof parsed.width !== "number" || typeof parsed.length !== "number" || !Array.isArray(parsed.items)) return null;
      return { width: Math.max(3, Math.min(8, parsed.width)), length: Math.max(3, Math.min(8, parsed.length)), items: parsed.items.filter((item) => sampleAssets.some((asset) => asset.slug === item.slug)).slice(0, 50) };
    }
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const json = decodeURIComponent(escape(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))));
    const parsed = JSON.parse(json) as Design;
    if (typeof parsed.width !== "number" || typeof parsed.length !== "number" || !Array.isArray(parsed.items)) return null;
    return { width: Math.max(3, Math.min(8, parsed.width)), length: Math.max(3, Math.min(8, parsed.length)), items: parsed.items.filter((item) => sampleAssets.some((asset) => asset.slug === item.slug)).slice(0, 50) };
  } catch { return null; }
}

export function RoomPlanner({ androidStoreUrl, iosStoreUrl }: { androidStoreUrl?: string; iosStoreUrl?: string }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ThreeRuntime | null>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const [design, setDesign] = useState<Design>(defaultDesign);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const availableAssets = sampleAssets;
  const selectedItem = design.items.find((item) => item.id === selectedId);

  useEffect(() => {
    let disposed = false;
    let runtime: ThreeRuntime | undefined;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const [THREE, { OrbitControls }, { GLTFLoader }] = await Promise.all([
        import("three"), import("three/examples/jsm/controls/OrbitControls.js"), import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);
      if (disposed || !canvasRef.current) return;
      const host = canvasRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#eee9df");
      scene.fog = new THREE.Fog("#eee9df", 12, 25);
      const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(1, host.clientHeight), 0.1, 100);
      camera.position.set(6.4, 7.5, 7.4);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.7, 0);
      controls.enableDamping = true;
      controls.maxPolarAngle = Math.PI * 0.48;
      controls.minDistance = 3.5;
      controls.maxDistance = 15;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x9c8f7c, 2.1));
      const sun = new THREE.DirectionalLight(0xffffff, 3.2);
      sun.position.set(-4, 8, 5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      scene.add(sun);
      const floorMaterial = new THREE.MeshStandardMaterial({ color: "#cbbda8", roughness: 0.85 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(design.width, design.length), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      floor.name = "planner-floor";
      scene.add(floor);
      const grid = new THREE.GridHelper(8, 16, 0x8c8172, 0xb8ac9b);
      grid.position.y = 0.012;
      scene.add(grid);
      const walls = new THREE.Group();
      const wallMaterial = new THREE.MeshStandardMaterial({ color: "#f6f1e8", roughness: 0.92, side: THREE.DoubleSide });
      const back = new THREE.Mesh(new THREE.PlaneGeometry(design.width, 2.8), wallMaterial);
      back.position.set(0, 1.4, -design.length / 2);
      walls.add(back);
      const side = new THREE.Mesh(new THREE.PlaneGeometry(design.length, 2.8), wallMaterial);
      side.rotation.y = Math.PI / 2;
      side.position.set(-design.width / 2, 1.4, 0);
      walls.add(side);
      scene.add(walls);
      const groups = new Map<string, import("three").Group>();
      const resize = () => {
        if (!host.isConnected) return;
        camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight);
      };
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        runtime!.frame = requestAnimationFrame(animate);
      };
      runtime = { THREE, scene, camera, renderer, controls, floor, groups, resize, animate, frame: 0, loadItems: () => undefined };
      runtimeRef.current = runtime;
      runtime.animate();
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      const loader = new GLTFLoader();
      let disposedModels = false;
      const loadItems = (items: PlacedItem[]) => {
        for (const item of items) {
          if (groups.has(item.id)) continue;
          const asset = sampleAssets.find((entry) => entry.slug === item.slug);
          if (!asset) continue;
          const group = new THREE.Group();
          group.position.set(item.x, 0, item.z);
          group.rotation.y = item.rotation;
          groups.set(item.id, group);
          scene.add(group);
          loader.load(asset.modelUrl, (gltf) => {
            if (disposedModels) return;
            const model = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            const target = asset.dimensionsMm.map((value) => value / 1000);
            model.scale.set(target[0] / Math.max(size.x, 0.001), target[1] / Math.max(size.y, 0.001), target[2] / Math.max(size.z, 0.001));
            const fittedBounds = new THREE.Box3().setFromObject(model);
            const fittedCenter = fittedBounds.getCenter(new THREE.Vector3());
            model.position.set(-fittedCenter.x, -fittedBounds.min.y, -fittedCenter.z);
            model.traverse((node) => { if ((node as import("three").Mesh).isMesh) { (node as import("three").Mesh).castShadow = true; (node as import("three").Mesh).receiveShadow = true; } });
            group.add(model);
          }, undefined, () => { groups.delete(item.id); scene.remove(group); });
        }
      };
      runtime.loadItems = loadItems;
      cleanup = () => { disposedModels = true; observer.disconnect(); cancelAnimationFrame(runtime!.frame); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); };
      setReady(true);
      loadItems(design.items);
    })();
    return () => { disposed = true; cleanup?.(); runtimeRef.current = null; };
    // Initialize the renderer once; state updates are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { THREE, scene, floor } = runtime;
    floor.geometry.dispose();
    floor.geometry = new THREE.PlaneGeometry(design.width, design.length);
    floor.position.set(0, 0, 0);
    const wallGroup = scene.children.find((child) => child.type === "Group");
    if (wallGroup) {
      scene.remove(wallGroup);
      const material = new THREE.MeshStandardMaterial({ color: "#f6f1e8", roughness: 0.92, side: THREE.DoubleSide });
      const walls = new THREE.Group();
      const back = new THREE.Mesh(new THREE.PlaneGeometry(design.width, 2.8), material);
      back.position.set(0, 1.4, -design.length / 2);
      walls.add(back);
      const side = new THREE.Mesh(new THREE.PlaneGeometry(design.length, 2.8), material);
      side.rotation.y = Math.PI / 2;
      side.position.set(-design.width / 2, 1.4, 0);
      walls.add(side);
      scene.add(walls);
    }
    for (const item of design.items) {
      const group = runtime.groups.get(item.id);
      if (group) { group.position.set(item.x, 0, item.z); group.rotation.y = item.rotation; }
    }
    for (const [id, group] of runtime.groups) if (!design.items.some((item) => item.id === id)) { scene.remove(group); runtime.groups.delete(id); }
    runtime.loadItems(design.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const legacy = params.get("design");
    const decoded = legacy ? decodeDesign(legacy) : null;
    let saved: Design | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      saved = stored ? decodeDesign(encodeDesign(JSON.parse(stored) as Design)) : null;
    } catch { saved = null; }
    if (!cancelled) {
      setDesign(decoded ?? saved ?? defaultDesign);
      if (params.has("share")) setNotice("This saved link needs the Nestt backend; use a static design link for this demo.");
      setHydrated(true);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSharedLink = params.has("share") || params.has("design");
    if (hydrated && !isSharedLink) localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
  }, [design, hydrated]);

  const addItem = (asset: PlannerAsset) => {
    const id = crypto.randomUUID();
    const layout = [
      { x: -0.9, z: -0.35 }, { x: 0, z: 0.55 }, { x: 1.15, z: -0.35 },
      { x: -1.35, z: -1.1 }, { x: 1.35, z: 1.05 }, { x: 0, z: -1.25 },
    ];
    const position = layout[design.items.length % layout.length];
    const next = { id, slug: asset.slug, name: asset.name, ...position, rotation: 0 };
    setDesign((current) => ({ ...current, items: [...current.items, next] }));
    setSelectedId(id);
  };

  const updateSelected = (patch: Partial<PlacedItem>) => setDesign((current) => ({ ...current, items: current.items.map((item) => item.id === selectedId ? { ...item, ...patch } : item) }));
  const removeSelected = () => { if (!selectedId) return; setDesign((current) => ({ ...current, items: current.items.filter((item) => item.id !== selectedId) })); setSelectedId(null); };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pointer = new runtime.THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const raycaster = new runtime.THREE.Raycaster(); raycaster.setFromCamera(pointer, runtime.camera);
    const hits = raycaster.intersectObjects([...runtime.groups.values()], true);
    const group = hits[0] && [...runtime.groups.entries()].find(([, candidate]) => { let node: import("three").Object3D | null = hits[0].object; while (node && node.parent !== candidate) node = node.parent; return node?.parent === candidate; });
    if (group) { setSelectedId(group[0]); dragRef.current = { id: group[0], pointerId: event.pointerId }; runtime.controls.enabled = false; event.currentTarget.setPointerCapture(event.pointerId); }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current; const runtime = runtimeRef.current;
    if (!drag || !runtime) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pointer = new runtime.THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    const raycaster = new runtime.THREE.Raycaster(); raycaster.setFromCamera(pointer, runtime.camera);
    const hit = raycaster.intersectObject(runtime.floor)[0];
    if (!hit) return;
    const x = Math.max(-design.width / 2 + 0.2, Math.min(design.width / 2 - 0.2, hit.point.x));
    const z = Math.max(-design.length / 2 + 0.2, Math.min(design.length / 2 - 0.2, hit.point.z));
    const group = runtime.groups.get(drag.id); if (group) group.position.set(x, 0, z);
    setDesign((current) => ({ ...current, items: current.items.map((item) => item.id === drag.id ? { ...item, x, z } : item) }));
  };

  const onPointerUp = () => { if (runtimeRef.current) runtimeRef.current.controls.enabled = true; dragRef.current = null; };

  const share = useCallback(async () => {
    try {
      const room = { ...design, items: design.items.map((item) => ({ ...item, y: 0 })) };
      const shareUrl = new URL("/room-planner", window.location.origin);
      shareUrl.searchParams.set("design", JSON.stringify(room));
      await navigator.clipboard.writeText(shareUrl.toString());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
      setNotice("Design saved on this device. Static share link copied."); window.setTimeout(() => setNotice(""), 3000);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save or share this design."); }
  }, [design]);

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#24231f]">
      <main className="mx-auto max-w-[1500px] px-4 pb-10 pt-7 sm:px-7 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><Link href="/" className="text-xs text-[#77736c] hover:text-[#f15a22]">Home / Room designer</Link><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a2513d]">Nestt Kreativ</p><h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Design your room</h1><p className="mt-2 text-sm text-[#706c64]">Build a room, arrange furniture, and save a design to share.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setDesign(defaultDesign); setSelectedId(null); }} className="min-h-11 border border-[#d9d4ca] bg-white px-4 text-xs font-semibold hover:bg-[#f0ede6]">Reset room</button><button type="button" onClick={() => void share()} className="min-h-11 bg-[#f15a22] px-5 text-xs font-semibold text-white hover:bg-[#d74a15]">Share design ↗</button></div>
        </div>
        <div className="mb-6 border border-[#e3dfd7] bg-white p-4 text-xs text-[#625e56]"><div className="flex flex-wrap items-center gap-3"><a href={design.items.length ? `nestt://room-planner?design=${encodeURIComponent(JSON.stringify({ ...design, items: design.items.map((item) => ({ ...item, y: item.y ?? 0 })) }))}` : "nestt://room-planner"} className="inline-flex min-h-11 items-center bg-[#f15a22] px-5 font-semibold text-white">Open camera AR in the app</a>{androidStoreUrl && <a href={androidStoreUrl} className="font-semibold text-[#a2513d] underline underline-offset-4">Install for Android</a>}{iosStoreUrl && <a href={iosStoreUrl} className="font-semibold text-[#a2513d] underline underline-offset-4">Install for iPhone</a>}</div><p className="mt-2">After installing, return to this page and tap Open camera AR. {design.items.length ? "Your current sample layout will open in the app; choose a new floor origin." : "The app starts with a sample coffee table; you can add more furniture."}</p>{!androidStoreUrl && !iosStoreUrl && <p className="mt-1 text-[#9d5b45]">App store links are not published yet.</p>}</div>
        <div className="grid overflow-hidden border border-[#e3dfd7] bg-white lg:min-h-[690px] lg:grid-cols-[290px_minmax(0,1fr)_300px]">
          <aside className="border-b border-[#e3dfd7] p-5 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8174]">Room dimensions</p>
            <div className="mt-3 grid grid-cols-2 gap-3">{(["width", "length"] as const).map((key) => <label key={key} className="text-[11px] text-[#6d685f]">{key === "width" ? "Width (m)" : "Length (m)"}<input type="number" min="3" max="8" step="0.5" value={design[key]} onChange={(e) => setDesign((current) => ({ ...current, [key]: Math.max(3, Math.min(8, Number(e.target.value) || 3)) }))} className="mt-1 h-10 w-full border border-[#ded9d0] px-3 text-sm text-[#28251f] outline-none focus:border-[#f15a22]" /></label>)}</div>
            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8174]">Add furniture</p>
            <div className="mt-3 max-h-[370px] space-y-2 overflow-auto pr-1">{availableAssets.map((asset) => <button key={asset.slug} type="button" onClick={() => addItem(asset)} className="flex min-h-[66px] w-full items-center justify-between gap-3 border border-[#ebe7df] px-3 text-left transition hover:border-[#d4a18c] hover:bg-[#fcfaf7]"><span><span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-[#a2513d]">{asset.category}</span><span className="mt-1 block text-sm font-medium">{asset.name}</span></span><span aria-hidden="true" className="text-xl text-[#f15a22]">+</span></button>)}</div>
            <p className="mt-4 text-[10px] leading-4 text-[#8a857c]">Sample models are for layout preview and may not match Nestt products.</p>
          </aside>
          <section className="relative min-h-[450px] bg-[#eee9df] lg:min-h-[690px]" aria-label="Interactive 3D room">
            <div ref={canvasRef} className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} />
            {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-[#706c64]">Loading your room…</div>}
            <div className="pointer-events-none absolute left-4 top-4 bg-white/90 px-3 py-2 text-[10px] text-[#625e56]">Drag furniture to arrange · Drag empty space to orbit · Scroll to zoom</div>
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 text-[10px] text-[#625e56]">{design.items.length} item{design.items.length === 1 ? "" : "s"} in room</div>
          </section>
          <aside className="border-t border-[#e3dfd7] p-5 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8174]">{selectedItem ? "Selected item" : "Your design"}</p>
            {selectedItem ? <><h2 className="mt-3 text-xl font-semibold">{availableAssets.find((asset) => asset.slug === selectedItem.slug)?.name ?? selectedItem.name ?? "Furniture"}</h2><p className="mt-2 text-xs leading-5 text-[#77736c]">Choose an item on the room floor to move it. Use the controls to rotate or remove it.</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => updateSelected({ rotation: selectedItem.rotation - Math.PI / 4 })} className="min-h-11 flex-1 border border-[#d9d4ca] text-xs hover:bg-[#f7f5f0]">↶ Rotate</button><button type="button" onClick={() => updateSelected({ rotation: selectedItem.rotation + Math.PI / 4 })} className="min-h-11 flex-1 border border-[#d9d4ca] text-xs hover:bg-[#f7f5f0]">Rotate ↷</button></div><button type="button" onClick={removeSelected} className="mt-2 min-h-11 w-full border border-[#d8b8ad] text-xs font-semibold text-[#9d3b23] hover:bg-[#fff6f3]">Remove from room</button></> : <><h2 className="mt-3 font-serif text-2xl">Make it yours</h2><p className="mt-2 text-xs leading-5 text-[#77736c]">Choose furniture from the catalogue and place it in your room. Your design is saved on this device automatically.</p></>}
            <div className="mt-7 border-t border-[#e9e5de] pt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b8174]">In this room</p>{design.items.length === 0 ? <p className="mt-3 text-xs text-[#89847b]">No furniture yet.</p> : <ul className="mt-2 space-y-2">{design.items.map((item) => { const asset = availableAssets.find((entry) => entry.slug === item.slug); return <li key={item.id}><button type="button" onClick={() => setSelectedId(item.id)} className={`w-full border px-3 py-2.5 text-left text-xs ${selectedId === item.id ? "border-[#f15a22] bg-[#fff8f4]" : "border-[#ebe7df] hover:bg-[#faf9f6]"}`}>{asset?.name ?? item.name ?? "Furniture"}<span className="float-right text-[#a39c91]">{asset ? `${asset.dimensionsMm[0]} × ${asset.dimensionsMm[2]} mm` : ""}</span></button></li>; })}</ul>}</div>
            <div className="mt-7 flex flex-col gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b8174]">Model previews</p>{[...new Set(design.items.map((item) => item.slug))].map((slug) => slug && availableAssets.some((asset) => asset.slug === slug) ? <Link key={slug} href={`/ar/${slug}`} className="text-xs font-semibold text-[#a2513d] underline underline-offset-4">View {availableAssets.find((asset) => asset.slug === slug)?.name} →</Link> : null)}</div>
          </aside>
        </div>
        {notice && <p role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 bg-[#24231f] px-5 py-3 text-sm text-white shadow-lg">{notice}</p>}
        <ArPhoneQr path="/room-planner" description="Scan to start a new room in the app. To send this exact layout, use Share design above." />
        <p className="mt-4 text-[10px] leading-5 text-[#868078]">Room dimensions can be entered manually. Whole-room LiDAR scanning and product-accurate Nestt models are not included in this browser prototype.</p>
      </main>
    </div>
  );
}
