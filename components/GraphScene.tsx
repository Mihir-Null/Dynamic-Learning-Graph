"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { forceCenter, forceLink, forceManyBody, forceSimulation, Simulation } from "d3-force-3d";
import { useTheme } from "@mui/material";
import { GraphLink, GraphNode, GraphStrategy } from "@/lib/types";

type GraphSceneProps = {
  nodes: GraphNode[];
  links: GraphLink[];
  strategy: GraphStrategy;
  onNodeSelect: (nodeId: string) => void;
  selectedId?: string | null;
};

type SimNode = GraphNode & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type SimLink = GraphLink & {
  source: SimNode;
  target: SimNode;
};

type Palette = {
  nodeColors: string[];
  link: string;
  selection: string;
  textPrimary: string;
  textSecondary: string;
  surface: string;
};

const GraphSceneComponent = ({ nodes, links, strategy, onNodeSelect, selectedId }: GraphSceneProps) => {
  const theme = useTheme();
  const nodeColorScale = useMemo(
    () =>
      [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.success.main,
        theme.palette.error.main
      ].filter(Boolean),
    [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.error.main
    ]
  );

  const palette = useMemo<Palette>(
    () => ({
      nodeColors: nodeColorScale.length ? nodeColorScale : [theme.palette.primary.main],
      link: theme.palette.info.light ?? theme.palette.primary.light,
      selection: theme.palette.secondary.main,
      textPrimary: theme.palette.text.primary,
      textSecondary: theme.palette.text.secondary,
      surface: theme.palette.background.paper ?? "#101018"
    }),
    [
      nodeColorScale,
      theme.palette.info.light,
      theme.palette.primary.light,
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.text.primary,
      theme.palette.text.secondary,
      theme.palette.background.paper
    ]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const renderRef = useRef<() => void>(() => {});
  const selectedIdRef = useRef<string | null>(selectedId ?? null);
  const frameRef = useRef<number>();

  const memoNodes = useMemo(() => nodes.map((node) => ({ ...node })), [nodes]);
  const memoLinks = useMemo(() => links.map((link) => ({ ...link })), [links]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const simNodes: SimNode[] = memoNodes.map((node) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 40,
      y: height / 2 + (Math.random() - 0.5) * 40
    }));

    const nodeById = new Map(simNodes.map((node) => [node.id, node]));
    const simLinks: SimLink[] = memoLinks
      .map((link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) return null;
        return { ...link, source, target };
      })
      .filter((link): link is SimLink => link !== null);

    nodesRef.current = simNodes;
    linksRef.current = simLinks;

    const render = () => {
      drawGraph({
        ctx: context,
        nodes: nodesRef.current,
        links: linksRef.current,
        palette,
        selectedId: selectedIdRef.current,
        strategy,
        width: canvas.width,
        height: canvas.height
      });
    };

    renderRef.current = render;

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance(strategy === "closure" ? 150 : 110)
          .strength(0.55)
      )
      .force("charge", forceManyBody().strength(strategy === "closure" ? -220 : -160))
      .force("center", forceCenter(width / 2, height / 2))
      .alpha(1)
      .alphaDecay(0.022)
      .on("tick", render);

    simulationRef.current = simulation;
    render();

    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          resizeCanvas();
          simulation.force("center", forceCenter(canvas.width / 2, canvas.height / 2));
          render();
        })
      : null;

    observer?.observe(canvas);

    return () => {
      observer?.disconnect();
      simulation.stop();
    };
  }, [memoNodes, memoLinks, palette, strategy]);

  useEffect(() => {
    selectedIdRef.current = selectedId ?? null;
    if (renderRef.current) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = undefined;
        renderRef.current?.();
      });
    }
  }, [selectedId]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragNode: SimNode | null = null;
    let hasMoved = false;

    const pickNode = (x: number, y: number) => {
      let closest: SimNode | null = null;
      let minDist = Infinity;
      nodesRef.current.forEach((node) => {
        const nx = node.x ?? x;
        const ny = node.y ?? y;
        const dx = nx - x;
        const dy = ny - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist <= 18) {
          closest = node;
          minDist = dist;
        }
      });
      return closest;
    };

    const toCanvasCoords = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y };
    };

    const handlePointerDown = (event: PointerEvent) => {
      const pos = toCanvasCoords(event);
      const node = pickNode(pos.x, pos.y);
      if (!node) return;
      dragNode = node;
      hasMoved = false;
      dragNode.fx = node.x;
      dragNode.fy = node.y;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragNode) return;
      const pos = toCanvasCoords(event);
      dragNode.fx = pos.x;
      dragNode.fy = pos.y;
      hasMoved = true;
      simulationRef.current?.alpha(0.3).restart();
      renderRef.current?.();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragNode) return;
      dragNode.fx = null;
      dragNode.fy = null;
      const nodeId = dragNode.id;
      dragNode = null;
      canvas.releasePointerCapture(event.pointerId);
      if (!hasMoved) {
        onNodeSelect(nodeId);
      }
      renderRef.current?.();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (!dragNode) return;
      dragNode.fx = null;
      dragNode.fy = null;
      dragNode = null;
      canvas.releasePointerCapture(event.pointerId);
      renderRef.current?.();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [onNodeSelect]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
};

function drawGraph({
  ctx,
  nodes,
  links,
  palette,
  selectedId,
  strategy,
  width,
  height
}: {
  ctx: CanvasRenderingContext2D;
  nodes: SimNode[];
  links: SimLink[];
  palette: Palette;
  selectedId: string | null;
  strategy: GraphStrategy;
  width: number;
  height: number;
}) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = strategy === "closure" ? 1.6 : 1.2;
  const baseLinkColor = withAlpha(palette.link, strategy === "closure" ? 0.35 : 0.24);
  ctx.strokeStyle = baseLinkColor;
  ctx.beginPath();
  links.forEach((link) => {
    const sx = link.source.x ?? width / 2;
    const sy = link.source.y ?? height / 2;
    const tx = link.target.x ?? width / 2;
    const ty = link.target.y ?? height / 2;
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
  });
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  if (strategy === "closure") {
    ctx.fillStyle = withAlpha(palette.link, 0.55);
    links.forEach((link) => {
      const sx = link.source.x ?? width / 2;
      const sy = link.source.y ?? height / 2;
      const tx = link.target.x ?? width / 2;
      const ty = link.target.y ?? height / 2;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      ctx.beginPath();
      ctx.arc(mx, my, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  nodes.forEach((node) => {
    const x = node.x ?? width / 2;
    const y = node.y ?? height / 2;
    const isSelected = node.id === selectedId;
    const nodeColor = colorForNode(node, palette.nodeColors);
    const displayColor = isSelected ? palette.selection : nodeColor;

    ctx.beginPath();
    ctx.fillStyle = displayColor;
    ctx.shadowColor = withAlpha(displayColor, isSelected ? 0.9 : 0.55);
    ctx.shadowBlur = isSelected ? 24 : 14;
    ctx.arc(x, y, isSelected ? 9.5 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeStyle = withAlpha(nodeColor, isSelected ? 0.92 : 0.4);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.closePath();

    const label = node.name;
    ctx.font = "12px 'Inter', 'Roboto', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textMetrics = ctx.measureText(label);
    const textWidth = textMetrics.width;
    const labelY = y + 16;

    ctx.fillStyle = withAlpha(palette.surface, 0.88);
    drawRoundedRect(ctx, x - textWidth / 2 - 12, labelY - 12, textWidth + 24, 22, 11);

    ctx.fillStyle = isSelected ? displayColor : nodeColor;
    ctx.fillText(label, x, labelY - 2);
  });

  ctx.restore();
}

const GraphScene = memo(GraphSceneComponent);
export default GraphScene;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function colorForNode(node: SimNode, palette: string[]) {
  if (!palette.length) return "#ffffff";
  const target = node.area ?? node.id;
  const index = Math.abs(hashString(target)) % palette.length;
  return palette[index];
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#")) {
    return hexToRgba(color, alpha);
  }
  if (color.startsWith("rgb")) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(",").map((part) => part.trim());
      if (parts.length === 3) {
        return `rgba(${parts.join(", ")}, ${alpha})`;
      }
      parts[3] = String(alpha);
      return `rgba(${parts.join(", ")})`;
    });
  }
  return color;
}

function hexToRgba(hex: string, alpha: number) {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
