"use client";

import { useMemo, useState } from "react";
import { sankey as d3Sankey } from "d3-sankey";

interface CategoryData {
  name: string;
  color: string | null;
  total: number;
}

interface SankeyChartProps {
  incomeByCategory: CategoryData[];
  expenseByCategory: CategoryData[];
  openingBalance?: number;
}

export function SankeyChart({
  incomeByCategory,
  expenseByCategory,
  openingBalance = 0,
}: SankeyChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const totalIncome = incomeByCategory.reduce((s, c) => s + c.total, 0);
  const totalExpenses = expenseByCategory.reduce((s, c) => s + c.total, 0);
  const totalInflow = openingBalance + totalIncome;
  const endingBalance = Math.max(0, totalInflow - totalExpenses);
  const showBalance = openingBalance > 0;
  const showEnding = endingBalance > 0 && totalInflow > 0;

    // commented out unused onMouseMove logic
    // const _onMouseMove = useCallback((e: React.MouseEvent) => {
    //   const rect = e.currentTarget.getBoundingClientRect();
    //   setTooltip((prev) =>
    //     prev
    //       ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top - 8 }
    //       : null,
    //   );
    // }, []);

  const raw = useMemo(() => {
    const nodes: Array<{
      id: string;
      name: string;
      value: number;
      pct: number;
      color: string;
      side: string;
    }> = [];
    const links: Array<{
      source: string;
      target: string;
      value: number;
      sc: string;
      tc: string;
      pct: number;
    }> = [];

    const pct = (v: number) =>
      totalInflow > 0 ? Math.round((v / totalInflow) * 1000) / 10 : 0;

    if (showBalance) {
      nodes.push({
        id: "balance",
        name: "Balance",
        value: openingBalance,
        pct: pct(openingBalance),
        color: "#3b82f6",
        side: "left",
      });
    }
    for (const ic of incomeByCategory) {
      nodes.push({
        id: `i-${ic.name}`,
        name: ic.name,
        value: ic.total,
        pct: pct(ic.total),
        color: ic.color || "#22c55e",
        side: "left",
      });
    }

    nodes.push({
      id: "cf",
      name: "Cash Flow",
      value: totalInflow,
      pct: 100,
      color: "#6B7280",
      side: "center",
    });

    for (const ec of expenseByCategory) {
      nodes.push({
        id: `e-${ec.name}`,
        name: ec.name,
        value: ec.total,
        pct: pct(ec.total),
        color: ec.color || "#ef4444",
        side: "right",
      });
    }
    if (showEnding) {
      nodes.push({
        id: "end",
        name: "Ending Balance",
        value: endingBalance,
        pct: pct(endingBalance),
        color: "#94a3b8",
        side: "right",
      });
    }

    for (const nd of nodes) {
      if (nd.side === "left")
        links.push({
          source: nd.id,
          target: "cf",
          value: nd.value,
          sc: nd.color,
          tc: "#6B7280",
          pct: nd.pct,
        });
    }
    for (const nd of nodes) {
      if (nd.side === "right")
        links.push({
          source: "cf",
          target: nd.id,
          value: nd.value,
          sc: "#6B7280",
          tc: nd.color,
          pct: nd.pct,
        });
    }

    return { nodes, links };
  }, [
    incomeByCategory,
    expenseByCategory,
    openingBalance,
    totalInflow,
    totalExpenses,
    endingBalance,
    showBalance,
    showEnding,
  ]);

  const layout = useMemo(() => {
    if (raw.nodes.length < 2 || raw.links.length === 0) return null;

    const gen = d3Sankey()
      .nodeId((d: unknown) => (d as { id: string }).id)
      .nodeWidth(16)
      .nodePadding(14)
      .extent([
        [16, 16],
        [584, 264],
      ]);

    return gen({
      nodes: raw.nodes.map((n) => ({ ...n })),
      links: raw.links.map((l) => ({
        source: l.source,
        target: l.target,
        value: Math.max(0.01, l.value),
      })),
    });
  }, [raw]);

  const ln = useMemo(() => {
    if (!layout) return [];
    return layout.links.map((l, i) => ({
      d: (() => {
         const y0 = (l as { y0: number }).y0;
         const y1 = (l as { y1: number }).y1;
         const sx = (l.source as { x1: number }).x1;
         const tx = (l.target as { x0: number }).x0;
        return `M${sx},${y0}C${(sx + tx) / 2},${y0} ${(sx + tx) / 2},${y1} ${tx},${y1}`;
      })(),
       w: Math.max(1, (l as { width: number }).width || 0),
      sc: raw.links[i].sc,
      tc: raw.links[i].tc,
      sn: raw.nodes.find((n) => n.id === raw.links[i].source)?.name || "",
      tn: raw.nodes.find((n) => n.id === raw.links[i].target)?.name || "",
      v: l.value || 0,
      pct: raw.links[i].pct,
      si: raw.links[i].source,
      ti: raw.links[i].target,
       sx: (l.source as { x1: number }).x1,
       tx: (l.target as { x0: number }).x0,
    }));
  }, [layout, raw]);

  if (!layout || ln.length === 0) {
    return <p className="text-sm text-muted-foreground">No data this month</p>;
  }

  const nds = layout.nodes as Array<{
    id: string;
    name: string;
    value: number;
    pct: number;
    color: string;
    side: string;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }>;

  const linkHovered = (p: (typeof ln)[number]) => hoveredId === p.si + p.ti;
  const nodeConnected = (id: string) =>
    hoveredId === null ||
    hoveredId === id ||
    ln.some((p) => p.si === id || p.ti === id) ||
    ln.some((p) => p.si + p.ti === hoveredId && (p.si === id || p.ti === id));
  const linkActive = (p: (typeof ln)[number]) =>
    hoveredId === null ||
    hoveredId === p.si + p.ti ||
    hoveredId === p.si ||
    hoveredId === p.ti;

  return (
    <div
      className="w-full relative select-none"
      onMouseLeave={() => {
        setHoveredId(null);
        setTooltip(null);
      }}
    >
      <svg
        viewBox="0 0 600 280"
        className="w-full h-auto"
        style={{ maxHeight: 280 }}
      >
        <defs>
          {ln.map((p, i) => (
            <linearGradient
              key={i}
              id={`lg-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={p.sx}
              x2={p.tx}
            >
              <stop offset="0%" stopColor={p.sc} />
              <stop offset="100%" stopColor={p.tc} />
            </linearGradient>
          ))}
        </defs>

        {ln.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={`url(#lg-${i})`}
            strokeWidth={p.w}
            strokeOpacity={linkActive(p) ? 0.55 : 0.12}
            style={
              linkHovered(p)
                ? { filter: "saturate(1.3) brightness(1.1)" }
                : undefined
            }
            onMouseEnter={(e) => {
              setHoveredId(p.si + p.ti);
              const rect = e.currentTarget
                .closest("svg")!
                .getBoundingClientRect();
              setTooltip({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 8,
                text: `${p.sn} → ${p.tn}: ¥${p.v.toLocaleString()} (${p.pct}%)`,
              });
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget
                .closest("svg")!
                .getBoundingClientRect();
              setTooltip((prev) =>
                prev
                  ? {
                      ...prev,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 8,
                    }
                  : null,
              );
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              setTooltip(null);
            }}
            className="transition-all duration-200 cursor-pointer"
          />
        ))}

        {nds.map((nd) => {
          const h = nd.y1 - nd.y0;
          const r = Math.min(6, h / 2);
           const isLeft = nd.side === "left";
           // const _isRight = nd.side === "right"; // unused

          let p: string;
          if (nd.side === "center") {
            p = `M${nd.x0 + r},${nd.y0}L${nd.x1 - r},${nd.y0}Q${nd.x1},${nd.y0} ${nd.x1},${nd.y0 + r}L${nd.x1},${nd.y1 - r}Q${nd.x1},${nd.y1} ${nd.x1 - r},${nd.y1}L${nd.x0 + r},${nd.y1}Q${nd.x0},${nd.y1} ${nd.x0},${nd.y1 - r}L${nd.x0},${nd.y0 + r}Q${nd.x0},${nd.y0} ${nd.x0 + r},${nd.y0}Z`;
          } else if (isLeft) {
            p = `M${nd.x0 + r},${nd.y0}L${nd.x1},${nd.y0}L${nd.x1},${nd.y1}L${nd.x0 + r},${nd.y1}Q${nd.x0},${nd.y1} ${nd.x0},${nd.y1 - r}L${nd.x0},${nd.y0 + r}Q${nd.x0},${nd.y0} ${nd.x0 + r},${nd.y0}Z`;
          } else {
            p = `M${nd.x0},${nd.y0}L${nd.x1 - r},${nd.y0}Q${nd.x1},${nd.y0} ${nd.x1},${nd.y0 + r}L${nd.x1},${nd.y1 - r}Q${nd.x1},${nd.y1} ${nd.x1 - r},${nd.y1}L${nd.x0},${nd.y1}Z`;
          }

          const dim = hoveredId !== null && !nodeConnected(nd.id);

          return (
            <g
              key={nd.id}
              onMouseEnter={() => setHoveredId(nd.id)}
              onMouseLeave={() => {
                if (hoveredId === nd.id) {
                  setHoveredId(null);
                  setTooltip(null);
                }
              }}
            >
              <path
                d={p}
                fill={nd.color}
                fillOpacity={dim ? 0.2 : 0.7}
                className="transition-all duration-200"
              />
              <text
                x={isLeft ? nd.x0 - 6 : nd.x1 + 6}
                y={(nd.y0 + nd.y1) / 2}
                dy="-0.3em"
                textAnchor={isLeft ? "end" : "start"}
                fill="currentColor"
                fillOpacity={dim ? 0.2 : 0.8}
                className="text-[11px] transition-all duration-200"
              >
                {nd.name}
              </text>
              <text
                x={isLeft ? nd.x0 - 6 : nd.x1 + 6}
                y={(nd.y0 + nd.y1) / 2}
                dy="0.7em"
                textAnchor={isLeft ? "end" : "start"}
                fill="currentColor"
                fillOpacity={dim ? 0.2 : 0.5}
                className="text-[10px] font-mono transition-all duration-200"
              >
                ¥{nd.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none text-xs bg-white text-gray-900 px-2.5 py-1.5 rounded-md whitespace-nowrap z-10 shadow-lg border"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
