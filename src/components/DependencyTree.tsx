import { useState } from 'react';
import { DependencyNode } from '../types/package';

interface DependencyTreeProps {
  nodes: DependencyNode[];
  level?: number;
  onOpenPackage?: (packageName: string) => void;
}

function DependencyItem({ node, level = 0, onOpenPackage }: { node: DependencyNode; level?: number; onOpenPackage?: (packageName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDoubleClick = () => {
    if (onOpenPackage) {
      onOpenPackage(node.name);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {hasChildren ? (
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-slate-300 dark:text-slate-600">
            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
          </span>
        )}

        <span className={`font-medium ${node.isCircular ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {node.name}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {node.version}
        </span>
        {node.isCircular && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            (circular)
          </span>
        )}
        {hasChildren && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ({node.children.length})
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <DependencyItem key={child.name} node={child} level={level + 1} onOpenPackage={onOpenPackage} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DependencyTree({ nodes, onOpenPackage }: DependencyTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400 italic py-2">
        No dependencies
      </div>
    );
  }

  return (
    <div className="text-sm">
      {nodes.map((node) => (
        <DependencyItem key={node.name} node={node} onOpenPackage={onOpenPackage} />
      ))}
    </div>
  );
}
