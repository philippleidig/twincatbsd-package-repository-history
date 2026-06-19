import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PackageSite } from '../types/package';

interface DependencyGraphProps {
  rootPackage: string;
  packages: PackageSite;
  reverseIndex: Map<string, string[]>;
  onOpenPackageTab?: (packageName: string) => void;
}

type NodeKind = 'focus' | 'dependency' | 'dependent';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  version: string;
  kind: NodeKind;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const MAX_PER_SIDE = 40;

const COLORS = {
  focus: '#ef0000',
  dependency: '#2563eb',
  dependent: '#059669',
};

export function DependencyGraph({ rootPackage, packages, reverseIndex, onOpenPackageTab }: DependencyGraphProps) {
  const [focus, setFocus] = useState(rootPackage);
  const [history, setHistory] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // Keep the latest navigate/open handlers available to D3 event callbacks.
  const onOpenRef = useRef(onOpenPackageTab);
  onOpenRef.current = onOpenPackageTab;

  const navigateTo = useCallback((name: string) => {
    setFocus(prev => {
      if (name === prev || !packages[name]) return prev;
      setHistory(h => [...h, prev]);
      return name;
    });
  }, [packages]);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setFocus(last);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setHistory([]);
    setFocus(rootPackage);
  }, [rootPackage]);

  // Watch dark-mode class so node/link colours stay in sync with the theme.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const focusPkg = packages[focus];
    const deps = focusPkg?.deps ? Object.keys(focusPkg.deps).sort((a, b) => a.localeCompare(b)) : [];
    const dependents = reverseIndex.get(focus) || [];

    const depsShown = deps.slice(0, MAX_PER_SIDE);
    const dependentsShown = dependents.slice(0, MAX_PER_SIDE);

    const nodes: GraphNode[] = [{ id: focus, version: focusPkg?.version || '', kind: 'focus' }];
    const links: GraphLink[] = [];
    const seen = new Set<string>([focus]);

    for (const name of depsShown) {
      if (!seen.has(name)) {
        nodes.push({ id: name, version: packages[name]?.version || focusPkg?.deps?.[name]?.version || '', kind: 'dependency' });
        seen.add(name);
      }
      // focus depends on `name`
      links.push({ source: focus, target: name });
    }

    for (const name of dependentsShown) {
      if (!seen.has(name)) {
        nodes.push({ id: name, version: packages[name]?.version || '', kind: 'dependent' });
        seen.add(name);
      }
      // `name` depends on focus
      links.push({ source: name, target: focus });
    }

    return {
      nodes,
      links,
      depsTotal: deps.length,
      dependentsTotal: dependents.length,
      depsHidden: deps.length - depsShown.length,
      dependentsHidden: dependents.length - dependentsShown.length,
    };
  }, [focus, packages, reverseIndex]);

  // Build / rebuild the D3 force graph whenever the focus, theme or data changes.
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const linkColor = isDark ? '#475569' : '#cbd5e1';
    const labelColor = isDark ? '#cbd5e1' : '#334155';
    const nodeStroke = isDark ? '#0f172a' : '#ffffff';

    // Clone data so the simulation can mutate node positions freely.
    const nodes: GraphNode[] = graphData.nodes.map(n => ({ ...n }));
    const links: GraphLink[] = graphData.links.map(l => ({ ...l }));

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Arrow marker for link direction (depender -> dependency).
    svg.append('defs')
      .append('marker')
      .attr('id', 'dg-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', linkColor);

    const zoomLayer = svg.append('g');

    const link = zoomLayer.append('g')
      .attr('stroke', linkColor)
      .attr('stroke-opacity', 0.7)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#dg-arrow)');

    const node = zoomLayer.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer');

    node.append('circle')
      .attr('r', d => (d.kind === 'focus' ? 13 : 8))
      .attr('fill', d => COLORS[d.kind])
      .attr('stroke', nodeStroke)
      .attr('stroke-width', 2);

    node.append('title')
      .text(d => `${d.id} ${d.version}\nClick to focus · Double-click to open`);

    node.append('text')
      .text(d => truncate(d.id, 26))
      .attr('x', 0)
      .attr('y', d => (d.kind === 'focus' ? 26 : 20))
      .attr('text-anchor', 'middle')
      .attr('font-size', d => (d.kind === 'focus' ? 13 : 11))
      .attr('font-weight', d => (d.kind === 'focus' ? 700 : 500))
      .attr('fill', d => (d.kind === 'focus' ? COLORS.focus : labelColor))
      .attr('paint-order', 'stroke')
      .attr('stroke', isDark ? '#0f172a' : '#f8fafc')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round');

    node.on('click', (event, d) => {
      event.stopPropagation();
      if (d.kind !== 'focus') navigateTo(d.id);
    });
    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      onOpenRef.current?.(d.id);
    });

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(110).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(40));

    // Pin the focus node near the centre so the layout stays oriented.
    const focusNode = nodes.find(n => n.kind === 'focus');
    if (focusNode) {
      focusNode.fx = width / 2;
      focusNode.fy = height / 2;
    }

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (d.kind !== 'focus') {
          d.fx = null;
          d.fy = null;
        }
      });
    node.call(drag);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    return () => {
      simulation.stop();
    };
  }, [graphData, isDark, navigateTo]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1 break-all">
          Dependency Graph
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse dependencies and dependents around <span className="font-semibold text-twincat-red">{focus}</span>.
          Drag to rearrange, scroll to zoom, click a node to re-center, double-click to open it.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={goBack}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            onClick={reset}
            disabled={focus === rootPackage && history.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to {truncate(rootPackage, 18)}
          </button>
          {onOpenPackageTab && (
            <button
              onClick={() => onOpenPackageTab(focus)}
              className="px-3 py-1.5 rounded-lg bg-twincat-red text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Open {truncate(focus, 18)}
            </button>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 ml-auto text-xs text-slate-500 dark:text-slate-400">
            <LegendDot color={COLORS.dependent} label={`Dependents (${graphData.dependentsTotal})`} />
            <LegendDot color={COLORS.focus} label="Focused" />
            <LegendDot color={COLORS.dependency} label={`Dependencies (${graphData.depsTotal})`} />
          </div>
        </div>

        {/* Graph canvas */}
        <div
          ref={containerRef}
          className="flex-1 min-h-[420px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {graphData.depsTotal === 0 && graphData.dependentsTotal === 0 ? (
            <div className="h-full flex items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400">
              <p className="font-medium">{focus} has no dependencies and no dependents.</p>
            </div>
          ) : (
            <svg ref={svgRef} className="w-full h-full" />
          )}
        </div>

        {(graphData.depsHidden > 0 || graphData.dependentsHidden > 0) && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            {graphData.dependentsHidden > 0 && `${graphData.dependentsHidden} more dependent(s) hidden. `}
            {graphData.depsHidden > 0 && `${graphData.depsHidden} more dependency(ies) hidden. `}
            Showing up to {MAX_PER_SIDE} per side — re-center on a node to explore further.
          </p>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}
