"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Player, Move, Direction } from "@/types/chessboard";
import WoodImg from '../../public/wood-01.jpg';
// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: Player[][];
  horizontalWalls: Player[][];
  selectedChess: Move | null;
  remainSteps: number;
  flattenTerritoriesObj: Record<string, Player>;
  isLock: boolean;
  isPlacingChess: boolean;
  breakWallCountObj: Record<Exclude<Player, null>, number>;
  isBreakWallAvailable: boolean;
  selectChess: (row: number, col: number) => void;
  selectWall: (row: number, col: number, direction: Direction) => void;
  selectCell: (row: number, col: number) => void;
  setChessPosition: (row: number, col: number) => void;
  onClickBreakWall: (row: number, col: number, direction: "horizontal" | "vertical") => void;
};

// ── Internal types ───────────────────────────────────────────────────────────

interface TileData {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
}

interface PreviewWallData {
  mesh: THREE.Mesh;
  row: number;
  col: number;
  isHorizontal: boolean;
  direction: Direction;
}

interface BreakWallData {
  mesh: THREE.Mesh;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
}

interface GeomConst {
  tileSize: number;
  tileHeight: number;
  gap: number;
  offset: number;
  wallH: number;
  wallGeoH: THREE.ExtrudeGeometry;
  wallGeoV: THREE.ExtrudeGeometry;
  playerMats: Record<Exclude<Player, null>, THREE.MeshStandardMaterial>;
  previewMat: THREE.MeshStandardMaterial;
  breakIndicatorMat: THREE.MeshStandardMaterial;
}

// ── Helper: rounded box geometry ─────────────────────────────────────────────

function createRoundedBoxGeometry(
  w: number,
  h: number,
  d: number,
  radius: number,
  bevel: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -d / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + d - radius);
  shape.quadraticCurveTo(x + w, y + d, x + w - radius, y + d);
  shape.lineTo(x + radius, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geo.rotateX(Math.PI / 2);
  return geo;
}

// ── Territory / highlight colors ─────────────────────────────────────────────

const TERRITORY_EMISSIVE: Record<string, THREE.Color> = {
  A: new THREE.Color(0xffe0c0),
  B: new THREE.Color(0xc0d8ff),
  C: new THREE.Color(0xffd0d0),
};
const AVAILABLE_EMISSIVE = new THREE.Color(0x88ff88);
const NO_EMISSIVE = new THREE.Color(0x000000);

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chessboard3D(props: Props) {
  const {
    size,
    board,
    currentPlayer,
    verticalWalls,
    horizontalWalls,
    selectedChess,
    remainSteps,
    flattenTerritoriesObj,
    breakWallCountObj,
    isBreakWallAvailable,
  } = props;

  const gridSize = size;

  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js scene refs (populated by main setup effect)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const geomRef = useRef<GeomConst | null>(null);
  const tileMapRef = useRef<Map<string, TileData>>(new Map());
  const pawnMapRef = useRef<Map<string, THREE.Group>>(new Map()); // key: "row,col"
  const hoverPawnRef = useRef<THREE.Group | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const previewGroupRef = useRef<THREE.Group | null>(null);
  const breakWallGroupRef = useRef<THREE.Group | null>(null);

  // Raycaster interaction state refs
  const previewWallsRef = useRef<PreviewWallData[]>([]);
  const breakWallMeshesRef = useRef<BreakWallData[]>([]);

  // Always-fresh props for use inside event listeners
  const latestPropsRef = useRef(props);
  latestPropsRef.current = props;

  // ── Available moves (computed in React, kept in ref for raycaster) ─────────

  const availableMoves = useMemo((): Move[] => {
    if (!selectedChess || remainSteps === 0) return [];

    const getMovesRecursive = (
      r: number,
      c: number,
      steps: number,
      visited: Set<string>
    ): Move[] => {
      if (steps <= 0) return [];
      const key = `${r},${c}`;
      if (visited.has(key)) return [];
      const newVisited = new Set(visited);
      newVisited.add(key);

      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
      ];
      const current: Move[] = [];
      const next: Move[] = [];

      for (const { dr, dc } of dirs) {
        const r1 = r + dr;
        const c1 = c + dc;
        if (r1 < 0 || r1 >= gridSize || c1 < 0 || c1 >= gridSize) continue;

        let hasWall = false;
        if (dr === 1 && horizontalWalls[r]?.[c]) hasWall = true;
        else if (dr === -1 && r > 0 && horizontalWalls[r - 1]?.[c]) hasWall = true;
        if (dc === 1 && verticalWalls[r]?.[c]) hasWall = true;
        else if (dc === -1 && c > 0 && verticalWalls[r]?.[c - 1]) hasWall = true;

        if (!hasWall && !board[r1]?.[c1]) {
          current.push({ row: r1, col: c1 });
          if (steps > 1) {
            next.push(...getMovesRecursive(r1, c1, steps - 1, newVisited));
          }
        }
      }
      return [...current, ...next];
    };

    return getMovesRecursive(selectedChess.row, selectedChess.col, remainSteps, new Set());
  }, [selectedChess, remainSteps, board, horizontalWalls, verticalWalls, gridSize]);

  const availableMovesRef = useRef(availableMoves);
  availableMovesRef.current = availableMoves;

  // ── Main scene setup (once per size change) ───────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene / camera / renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 22, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(12, 22, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -9;
    dirLight.shadow.camera.right = 9;
    dirLight.shadow.camera.top = 9;
    dirLight.shadow.camera.bottom = -9;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    // Materials
    const textureLoader = new THREE.TextureLoader();
    const boardTexture = textureLoader.load(
      WoodImg.src,
    );
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTexture,
      color: "#ffffff",
      roughness: 0.85,
    });

    const playerMats: Record<Exclude<Player, null>, THREE.MeshStandardMaterial> = {
      A: new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.35, metalness: 0.05 }),
      B: new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.35, metalness: 0.05 }),
      C: new THREE.MeshStandardMaterial({ color: 0xc84b1a, roughness: 0.35, metalness: 0.05 }),
    };

    const previewMat = new THREE.MeshStandardMaterial({
      color: "#aaddff",
      transparent: true,
      opacity: 0.7,
      emissive: new THREE.Color("#5599ff"),
      emissiveIntensity: 0.5,
    });

    const breakIndicatorMat = new THREE.MeshStandardMaterial({
      color: "#ff4444",
      transparent: true,
      opacity: 0.85,
      emissive: new THREE.Color("#ff0000"),
      emissiveIntensity: 0.6,
    });

    // Geometry constants
    const tileSize = 1.2;
    const tileHeight = 0.45;
    const gap = 0.25;
    const boardSize = gridSize * tileSize + (gridSize - 1) * gap + 0.6;
    const pawnHeight = 1.2;
    const offset = (boardSize - 0.6) / 2 - tileSize / 2;
    const wallH = tileHeight + pawnHeight / 2;

    const wallGeoH = createRoundedBoxGeometry(tileSize - 0.04, wallH, gap - 0.04, 0.04, 0.02);
    const wallGeoV = createRoundedBoxGeometry(gap - 0.04, wallH, tileSize - 0.04, 0.04, 0.02);

    geomRef.current = {
      tileSize,
      tileHeight,
      gap,
      offset,
      wallH,
      wallGeoH,
      wallGeoV,
      playerMats,
      previewMat,
      breakIndicatorMat,
    };

    // Base platform
    const baseGeo = createRoundedBoxGeometry(boardSize - 0.1, 0.45, boardSize - 0.1, 0.2, 0.05);
    const basePosAttr = baseGeo.attributes.position as THREE.BufferAttribute;
    const baseUvAttr = baseGeo.attributes.uv as THREE.BufferAttribute;
    for (let k = 0; k < basePosAttr.count; k++) {
      baseUvAttr.setXY(
        k,
        basePosAttr.getX(k) / boardSize + 0.5,
        basePosAttr.getZ(k) / boardSize + 0.5
      );
    }
    scene.add(new THREE.Mesh(baseGeo, boardMat));

    // Tiles — each gets a cloned material for individual emissive control
    const roundedGeo = createRoundedBoxGeometry(
      tileSize - 0.1,
      tileHeight - 0.05,
      tileSize - 0.1,
      0.1,
      0.04
    );
    const tileMap = new Map<string, TileData>();
    tileMapRef.current = tileMap;

    for (let col = 0; col < gridSize; col++) {
      for (let row = 0; row < gridSize; row++) {
        const tileGeo = roundedGeo.clone();
        const posAttr = tileGeo.attributes.position as THREE.BufferAttribute;
        const uvAttr = tileGeo.attributes.uv as THREE.BufferAttribute;

        const tileX = col * (tileSize + gap) - offset;
        const tileZ = row * (tileSize + gap) - offset;

        for (let k = 0; k < posAttr.count; k++) {
          uvAttr.setXY(
            k,
            (posAttr.getX(k) + tileX) / boardSize + 0.5,
            (posAttr.getZ(k) + tileZ) / boardSize + 0.5
          );
        }

        const mat = boardMat.clone();
        const tile = new THREE.Mesh(tileGeo, mat);
        tile.position.set(tileX, tileHeight, tileZ);
        tile.receiveShadow = true;
        tile.castShadow = true;
        tile.userData = { type: "tile", col, row, x: tileX, z: tileZ };
        scene.add(tile);
        tileMap.set(`${col},${row}`, { mesh: tile, mat });
      }
    }

    // Groups for dynamic objects
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    wallGroupRef.current = wallGroup;

    const previewGroup = new THREE.Group();
    scene.add(previewGroup);
    previewGroupRef.current = previewGroup;

    const breakWallGroup = new THREE.Group();
    scene.add(breakWallGroup);
    breakWallGroupRef.current = breakWallGroup;

    // Pawn map reset
    pawnMapRef.current = new Map();

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(event: PointerEvent) {
      const p = latestPropsRef.current;
      if (p.isLock) return;

      const rect = (container as HTMLDivElement).getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // 1. Break wall indicator
      const breakMeshes = breakWallMeshesRef.current.map((b) => b.mesh);
      if (breakMeshes.length > 0) {
        const hits = raycaster.intersectObjects(breakMeshes);
        if (hits.length > 0) {
          const bwd = breakWallMeshesRef.current.find((b) => b.mesh === hits[0].object);
          if (bwd) {
            p.onClickBreakWall(bwd.row, bwd.col, bwd.direction);
            return;
          }
        }
      }

      // 2. Preview wall
      const previewMeshes = previewWallsRef.current.map((pw) => pw.mesh);
      if (previewMeshes.length > 0) {
        const hits = raycaster.intersectObjects(previewMeshes);
        if (hits.length > 0) {
          const pwd = previewWallsRef.current.find((pw) => pw.mesh === hits[0].object);
          if (pwd) {
            p.selectWall(pwd.row, pwd.col, pwd.direction);
            return;
          }
        }
      }

      // 3. Pawn hitbox
      const hitBoxes: THREE.Mesh[] = [];
      pawnMapRef.current.forEach((group) => {
        const hb = group.children.find((c) => c.userData.isHitBox) as THREE.Mesh | undefined;
        if (hb) hitBoxes.push(hb);
      });
      if (hitBoxes.length > 0) {
        const hits = raycaster.intersectObjects(hitBoxes);
        if (hits.length > 0) {
          const { player, row, col } = hits[0].object.userData;
          if (player === p.currentPlayer && !p.isPlacingChess) {
            p.selectChess(row, col);
          }
          return;
        }
      }

      // 4. Tile
      const tileMeshes = [...tileMapRef.current.values()].map((t) => t.mesh);
      const hits = raycaster.intersectObjects(tileMeshes);
      if (hits.length > 0) {
        const { col, row } = hits[0].object.userData as { col: number; row: number };
        if (p.isPlacingChess && !p.board[row]?.[col]) {
          p.setChessPosition(row, col);
          return;
        }
        if (p.selectedChess) {
          const isAvailable = availableMovesRef.current.some(
            (m) => m.row === row && m.col === col
          );
          if (isAvailable) {
            p.selectCell(row, col);
          }
        }
      }
    }

    container.addEventListener("pointerdown", onPointerDown);

    // Hover preview (isPlacingChess)
    function onPointerMove(event: PointerEvent) {
      const p = latestPropsRef.current;
      if (!p.isPlacingChess || p.isLock) {
        if (hoverPawnRef.current) {
          scene.remove(hoverPawnRef.current);
          hoverPawnRef.current = null;
        }
        return;
      }

      const rect = (container as HTMLDivElement).getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const tileMeshes = [...tileMapRef.current.values()].map((t) => t.mesh);
      const hits = raycaster.intersectObjects(tileMeshes);

      if (hits.length > 0) {
        const { col, row } = hits[0].object.userData as { col: number; row: number };
        if (p.board[row]?.[col]) {
          // Cell occupied — remove preview
          if (hoverPawnRef.current) {
            scene.remove(hoverPawnRef.current);
            hoverPawnRef.current = null;
          }
          return;
        }
        const g = geomRef.current;
        if (!g || !p.currentPlayer) return;
        const x = col * (g.tileSize + g.gap) - g.offset;
        const z = row * (g.tileSize + g.gap) - g.offset;

        if (!hoverPawnRef.current) {
          // Create semi-transparent preview pawn
          const baseMat = g.playerMats[p.currentPlayer as Exclude<Player, null>];
          const mat = baseMat.clone();
          mat.transparent = true;
          mat.opacity = 0.45;
          const group = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 0.8, 32), mat);
          body.position.y = 0.4;
          group.add(body);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), mat);
          head.position.y = 0.9;
          group.add(head);
          group.position.set(x, g.tileHeight, z);
          scene.add(group);
          hoverPawnRef.current = group;
        } else {
          hoverPawnRef.current.position.x = x;
          hoverPawnRef.current.position.z = z;
        }
      } else {
        if (hoverPawnRef.current) {
          scene.remove(hoverPawnRef.current);
          hoverPawnRef.current = null;
        }
      }
    }

    container.addEventListener("pointermove", onPointerMove);

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation loop
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      if (hoverPawnRef.current) {
        scene.remove(hoverPawnRef.current);
        hoverPawnRef.current = null;
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      geomRef.current = null;
      tileMapRef.current = new Map();
      pawnMapRef.current = new Map();
      wallGroupRef.current = null;
      previewGroupRef.current = null;
      breakWallGroupRef.current = null;
      previewWallsRef.current = [];
      breakWallMeshesRef.current = [];
    };
  }, [gridSize]);

  // ── Sync: Pawn positions ───────────────────────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    const g = geomRef.current;
    if (!scene || !g) return;

    const pawnMap = pawnMapRef.current;

    // Build current occupied cells: key = "row,col"
    const currentCells = new Map<string, { row: number; col: number; player: Exclude<Player, null> }>();
    board.forEach((rowArr, row) => {
      rowArr.forEach((cell, col) => {
        if (cell) currentCells.set(`${row},${col}`, { row, col, player: cell });
      });
    });

    // Remove pawns for cells no longer occupied
    for (const key of [...pawnMap.keys()]) {
      if (!currentCells.has(key)) {
        scene.remove(pawnMap.get(key)!);
        pawnMap.delete(key);
      }
    }

    // Create or update pawns
    for (const [key, { row, col, player }] of currentCells) {
      const x = col * (g.tileSize + g.gap) - g.offset;
      const z = row * (g.tileSize + g.gap) - g.offset;

      if (pawnMap.has(key)) {
        const group = pawnMap.get(key)!;
        group.position.x = x;
        group.position.z = z;
        const hb = group.children.find((c) => c.userData.isHitBox) as THREE.Mesh | undefined;
        if (hb) {
          hb.userData.player = player;
          hb.userData.row = row;
          hb.userData.col = col;
        }
      } else {
        const mat = g.playerMats[player];
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 0.8, 32), mat);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), mat);
        head.position.y = 0.9;
        head.castShadow = true;
        group.add(head);

        const hbMat = new THREE.MeshBasicMaterial({ visible: false });
        const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16), hbMat);
        hb.position.y = 0.75;
        hb.userData = { isHitBox: true, player, row, col };
        group.add(hb);

        group.position.set(x, g.tileHeight, z);
        scene.add(group);
        pawnMap.set(key, group);
      }
    }
  }, [board]);

  // ── Sync: Placed walls ─────────────────────────────────────────────────────

  useEffect(() => {
    const wallGroup = wallGroupRef.current;
    const g = geomRef.current;
    if (!wallGroup || !g) return;

    wallGroup.clear();

    horizontalWalls.forEach((rowArr, row) => {
      rowArr.forEach((player, col) => {
        if (!player) return;
        const x = col * (g.tileSize + g.gap) - g.offset;
        const z = (row + 0.5) * (g.tileSize + g.gap) - g.offset;
        const wall = new THREE.Mesh(g.wallGeoH, g.playerMats[player]);
        wall.position.set(x, g.wallH, z);
        wall.receiveShadow = true;
        wallGroup.add(wall);
      });
    });

    verticalWalls.forEach((rowArr, row) => {
      rowArr.forEach((player, col) => {
        if (!player) return;
        const x = (col + 0.5) * (g.tileSize + g.gap) - g.offset;
        const z = row * (g.tileSize + g.gap) - g.offset;
        const wall = new THREE.Mesh(g.wallGeoV, g.playerMats[player]);
        wall.position.set(x, g.wallH, z);
        wall.receiveShadow = true;
        wallGroup.add(wall);
      });
    });
  }, [horizontalWalls, verticalWalls]);

  // ── Sync: Selected chess → pawn lift + wall previews ─────────────────────

  useEffect(() => {
    const g = geomRef.current;
    const previewGroup = previewGroupRef.current;
    if (!g || !previewGroup) return;

    // Reset all pawn heights
    pawnMapRef.current.forEach((group) => {
      group.position.y = g.tileHeight;
    });

    // Clear previews
    previewGroup.clear();
    previewWallsRef.current = [];

    if (!selectedChess) return;

    // Lift the selected pawn
    const pawnGroup = pawnMapRef.current.get(`${selectedChess.row},${selectedChess.col}`);
    if (pawnGroup) pawnGroup.position.y = g.tileHeight + 0.35;

    const { row, col } = selectedChess;

    // Preview wall candidates (mirrors 2D checkWallBuildable logic)
    const candidates: { row: number; col: number; isH: boolean; direction: Direction }[] = [
      { row: row - 1, col, isH: true, direction: "top" },   // top (horizontalWalls[row-1][col])
      { row, col, isH: true, direction: "bottom" },          // bottom (horizontalWalls[row][col])
      { row, col: col - 1, isH: false, direction: "left" },  // left (verticalWalls[row][col-1])
      { row, col, isH: false, direction: "right" },           // right (verticalWalls[row][col])
    ];

    const newPreviews: PreviewWallData[] = [];

    for (const c of candidates) {
      if (c.isH) {
        if (c.row < 0 || c.row >= gridSize - 1) continue;
        if (horizontalWalls[c.row]?.[c.col]) continue;
      } else {
        if (c.col < 0 || c.col >= gridSize - 1) continue;
        if (verticalWalls[c.row]?.[c.col]) continue;
      }

      const x = c.isH
        ? c.col * (g.tileSize + g.gap) - g.offset
        : (c.col + 0.5) * (g.tileSize + g.gap) - g.offset;
      const z = c.isH
        ? (c.row + 0.5) * (g.tileSize + g.gap) - g.offset
        : c.row * (g.tileSize + g.gap) - g.offset;

      const mesh = new THREE.Mesh(c.isH ? g.wallGeoH : g.wallGeoV, g.previewMat);
      mesh.position.set(x, g.wallH, z);
      previewGroup.add(mesh);
      newPreviews.push({ mesh, row: c.row, col: c.col, isHorizontal: c.isH, direction: c.direction });
    }

    previewWallsRef.current = newPreviews;
  }, [selectedChess, horizontalWalls, verticalWalls, gridSize]);

  // ── Sync: Tile highlights (available moves + territory) ───────────────────

  useEffect(() => {
    const tileMap = tileMapRef.current;
    if (tileMap.size === 0) return;

    const availSet = new Set(availableMoves.map((m) => `${m.col},${m.row}`));

    tileMap.forEach((td, key) => {
      // key = "col,row"; flattenTerritoriesObj uses "row,col"
      const [colStr, rowStr] = key.split(",");
      const territoryKey = `${rowStr},${colStr}`;

      if (availSet.has(key)) {
        td.mat.emissive = AVAILABLE_EMISSIVE;
        td.mat.emissiveIntensity = 0.4;
      } else {
        const territory = flattenTerritoriesObj[territoryKey];
        if (territory && TERRITORY_EMISSIVE[territory]) {
          td.mat.emissive = TERRITORY_EMISSIVE[territory];
          td.mat.emissiveIntensity = 0.3;
        } else {
          td.mat.emissive = NO_EMISSIVE;
          td.mat.emissiveIntensity = 0;
        }
      }
    });
  }, [availableMoves, flattenTerritoriesObj]);

  // ── Sync: Break wall indicators ───────────────────────────────────────────

  useEffect(() => {
    const breakWallGroup = breakWallGroupRef.current;
    const g = geomRef.current;
    if (!breakWallGroup || !g) return;

    breakWallGroup.clear();
    breakWallMeshesRef.current = [];

    if (!isBreakWallAvailable || !selectedChess || !currentPlayer) return;
    const breakCount = breakWallCountObj[currentPlayer as Exclude<Player, null>];
    if (!breakCount || breakCount <= 0) return;

    const { row, col } = selectedChess;
    const newBreakMeshes: BreakWallData[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);

    const hChecks = [
      { r: row - 1, c: col, dir: "horizontal" as const },
      { r: row, c: col, dir: "horizontal" as const },
    ];
    const vChecks = [
      { r: row, c: col - 1, dir: "vertical" as const },
      { r: row, c: col, dir: "vertical" as const },
    ];

    for (const { r, c, dir } of hChecks) {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
      if (!horizontalWalls[r]?.[c]) continue;
      const x = c * (g.tileSize + g.gap) - g.offset;
      const z = (r + 0.5) * (g.tileSize + g.gap) - g.offset;
      const mesh = new THREE.Mesh(sphereGeo, g.breakIndicatorMat);
      mesh.position.set(x, g.wallH + 0.35, z);
      breakWallGroup.add(mesh);
      newBreakMeshes.push({ mesh, row: r, col: c, direction: dir });
    }

    for (const { r, c, dir } of vChecks) {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;
      if (!verticalWalls[r]?.[c]) continue;
      const x = (c + 0.5) * (g.tileSize + g.gap) - g.offset;
      const z = r * (g.tileSize + g.gap) - g.offset;
      const mesh = new THREE.Mesh(sphereGeo, g.breakIndicatorMat);
      mesh.position.set(x, g.wallH + 0.35, z);
      breakWallGroup.add(mesh);
      newBreakMeshes.push({ mesh, row: r, col: c, direction: dir });
    }

    breakWallMeshesRef.current = newBreakMeshes;
  }, [isBreakWallAvailable, selectedChess, currentPlayer, breakWallCountObj, horizontalWalls, verticalWalls, gridSize]);

  return <div ref={containerRef} className="size-full" />;
}
