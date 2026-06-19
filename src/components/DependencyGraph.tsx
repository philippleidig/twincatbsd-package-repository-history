import { useState, useMemo, useCallback } from 'react';
import { PackageSite } from '../types/package';

interface DependencyGraphProps {
  rootPackage: string;
  packages: PackageSite;
  reverseIndex: Map<string, string[]>;
  onOpenPackageTab?: (packageName: string) => void;
}

interface GraphNode {
  name: string;
  version: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 168;
const NODE_HEIGHT = 40;
const COL_GAP = 220;
const ROW_GAP = 12;
const MAX_PER_COLUMN = 14;

export function DependencyGraph({ rootPackage, packages, reverseIndex, onOpenPackageTab }: DependencyGraphProps) {
  const [focus, setFocus] = useState(rootPackage);
  const [history, setHistory] = useState<string[]>([]);

  const navigateTo = useCallback((name: string) => {
    if (name === focus || !packages[name]) return;
    setHistory(prev => [...prev, focus]);
    setFocus(name);
  }, [focus, packages]);

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

  const layout = useMemo(() => {
    const focusPkg = packages[focus];
    const deps = focusPkg?.deps ? Object.keys(focusPkg.deps).sort((a, b) => a.localeCompare(b)) : [];
    const dependents = (reverseIndex.get(focus) || []);

    const depsShown = deps.slice(0, MAX_PER_COLUMN);
    const dependentsShown = dependents.slice(0, MAX_PER_COLUMN);

    const columnHeight = (count: number) => count * (NODE_HEIGHT + ROW_GAP);
    const maxRows = Math.max(depsShown.length, dependentsShown.length, 1);
    const totalHeight = Math.max(columnHeight(maxRows), NODE_HEIGHT) + 40;
    const centerY = totalHeight / 2;

    const colX = { left: 20, center: 20 + COL_GAP, right: 20 + COL_GAP * 2 };
    const totalWidth = colX.right + NODE_WIDTH + 20;

    const makeColumn = (names: string[], x: number): GraphNode[] => {
      const h = columnHeight(names.length);
      const startY = centerY - h / 2;
      return names.map((name, i) => ({
        name,
        version: packages[name]?.version || (focusPkg?.deps?.[name]?.version ?? ''),
        x,
        y: startY + i * (NODE_HEIGHT + ROW_GAP) + ROW_GAP / 2,
      }));
    };

    const dependentNodes = makeColumn(dependentsShown, colX.left);
    const depNodes = makeColumn(depsShown, colX.right);
    const focusNode: GraphNode = {
      name: focus,
      version: focusPkg?.version || '',
      x: colX.center,
      y: centerY - NODE_HEIGHT / 2,
    };

    return {
      dependentNodes,
      depNodes,
      focusNode,
      totalWidth,
      totalHeight,
      depsTotal: deps.length,
      dependentsTotal: dependents.length,
      depsHidden: deps.length - depsShown.length,
      dependentsHidden: dependents.length - dependentsShown.length,
    };
  }, [focus, packages, reverseIndex]);

  const edgePath = (fromX: number, fromY: number, toX: number, toY: number) => {
    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  const renderNode = (node: GraphNode, kind: 'focus' | 'dep' | 'dependent') => {
    const isFocus = kind === 'focus';
    const fill = isFocus
      ? 'fill-twincat-red'
      : 'fill-white dark:fill-slate-800';
    const stroke = isFocus
      ? 'stroke-twincat-red'
      : 'stroke-slate-300 dark:stroke-slate-600';
    const textColor = isFocus ? 'fill-white' : 'fill-slate-800 dark:fill-slate-200';
    const versionColor = isFocus ? 'fill-red-100' : 'fill-slate-400 dark:fill-slate-500';

    return (
      <g
        key={`${kind}-${node.name}`}
        className="cursor-pointer"
        onClick={() => !isFocus && navigateTo(node.name)}
        onDoubleClick={() => onOpenPackageTab?.(node.name)}
      >
        <title>{`${node.name} ${node.version}\nClick to focus · Double-click to open`}</title>
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={8}
          className={`${fill} ${stroke} transition-colors ${isFocus ? '' : 'hover:fill-slate-50 dark:hover:fill-slate-700'}`}
          strokeWidth={isFocus ? 2 : 1.5}
        />
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + (node.version ? 16 : 24)}
          textAnchor="middle"
          className={`text-[12px] font-medium ${textColor}`}
        >
          {truncate(node.name, 22)}
        </text>
        {node.version && (
          <text
            x={node.x + NODE_WIDTH / 2}
            y={node.y + 30}
            textAnchor="middle"
            className={`text-[10px] ${versionColor}`}
          >
            {truncate(node.version, 24)}
          </text>
        )}
      </g>
    );
  };

  const { focusNode, depNodes, dependentNodes, totalWidth, totalHeight } = layout;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1 break-all">
          Dependency Graph
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse dependencies and dependents around <span className="font-semibold text-twincat-red">{focus}</span>.
          Click a node to re-center, double-click to open it.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
        </div>

        {/* Column legend */}
        <div className="grid grid-cols-3 gap-2 mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <div className="text-left">
            Dependents ({layout.dependentsTotal})
            <div className="normal-case font-normal text-slate-400 dark:text-slate-500">depend on this</div>
          </div>
          <div className="text-center">Focused package</div>
          <div className="text-right">
            Dependencies ({layout.depsTotal})
            <div className="normal-case font-normal text-slate-400 dark:text-slate-500">this depends on</div>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto">
          {layout.depsTotal === 0 && layout.dependentsTotal === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <p className="font-medium">{focus} has no dependencies and no dependents.</p>
            </div>
          ) : (
            <svg
              width={totalWidth}
              height={totalHeight}
              viewBox={`0 0 ${totalWidth} ${totalHeight}`}
              className="min-w-full"
            >
              {/* edges: dependents -> focus */}
              {dependentNodes.map(n => (
                <path
                  key={`e-dep-${n.name}`}
                  d={edgePath(n.x + NODE_WIDTH, n.y + NODE_HEIGHT / 2, focusNode.x, focusNode.y + NODE_HEIGHT / 2)}
                  className="stroke-slate-300 dark:stroke-slate-600"
                  strokeWidth={1.5}
                  fill="none"
                />
              ))}
              {/* edges: focus -> dependencies */}
              {depNodes.map(n => (
                <path
                  key={`e-d-${n.name}`}
                  d={edgePath(focusNode.x + NODE_WIDTH, focusNode.y + NODE_HEIGHT / 2, n.x, n.y + NODE_HEIGHT / 2)}
                  className="stroke-slate-300 dark:stroke-slate-600"
                  strokeWidth={1.5}
                  fill="none"
                />
              ))}

              {dependentNodes.map(n => renderNode(n, 'dependent'))}
              {depNodes.map(n => renderNode(n, 'dep'))}
              {renderNode(focusNode, 'focus')}
            </svg>
          )}
        </div>

        {(layout.depsHidden > 0 || layout.dependentsHidden > 0) && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            {layout.dependentsHidden > 0 && `${layout.dependentsHidden} more dependent(s) hidden. `}
            {layout.depsHidden > 0 && `${layout.depsHidden} more dependency(ies) hidden. `}
            Showing up to {MAX_PER_COLUMN} per side — re-center on a node to explore further.
          </p>
        )}
      </div>
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}
