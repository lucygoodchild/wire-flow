import { useState, useCallback, useRef } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Controls } from '@xyflow/react';
import XNode from './XNode';
import WNode from './WNode';
import Toolbar from './Toolbar';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  x1: XNode,
  x2: XNode,
  w1: WNode,
};

const nodesData = [
  {
    id: 'x1-node',
    type: 'x1',
    position: { x: 0, y: 0 },
    data: {
      connectorName: 'X1',
      MFPM: 'D-sub | female | 9 pin',
      handles: ['DCD', 'RX', 'TX', 'DTR', 'GND', 'DSR', 'RTS', 'CTS', 'RI']
    }
  },
  {
    id: 'x2-node',
    type: 'x2',
    position: { x: 200, y: 0 },
    data: {
      connectorName: 'X2',
      MFPM: 'Molex KK 254 | female | 3 pin',
      handles: ['VCC', 'GND', 'SCL']
    }
  },
  {
    id: 'w1-node',
    type: 'w1',
    position: { x: 100, y: 0 },
    data: {
      connectorName: 'W1',
      MFPM: '3x | 0.25mm^2 | + S | 0.2m',
      handles: ['1', '2', '3', '4']
    }
  },
];

const makeWNodeData = (handles) => ({
  originalHandles: [...handles],
  handles: [...handles],
  leftSideLabels: [...handles],
  rightSideLabels: [...handles],
  leftConnections: {},
  rightConnections: {},
});

const initialNodes = [
  {
    id: 'x1-node',
    type: 'x1',
    position: { x: -250, y: 0 },
    data: {
      connectorName: 'X1',
      MFPM: 'D-sub | female | 9 pin',
      handles: ['DCD', 'RX', 'TX', 'DTR', 'GND', 'DSR', 'RTS', 'CTS', 'RI']
    }
  },
  {
    id: 'w1-node',
    type: 'w1',
    position: { x: 100, y: 0 },
    data: {
      connectorName: 'W1',
      MFPM: '3x | 0.25mm^2 | + S | 0.2m',
      ...makeWNodeData(['1', '2', '3', '4']),
    }
  },
];

const generateWNodeInternalEdges = (nodeId, handles) => {
  const colors = ['black', 'red', 'yellow', 'green'];
  return handles.map((handleId, index) => ({
    id: `${nodeId}-${handleId}-${index}-internal`,
    source: nodeId,
    sourceHandle: `${handleId}-output`,
    target: nodeId,
    targetHandle: `${handleId}-input`,
    type: 'straight',
    deletable: false,
    selectable: false,
    style: {
      stroke: colors[index % colors.length],
      strokeWidth: 1,
    },
    data: { isInternal: true },
  }));
};

const initialEdges = initialNodes
  .filter(n => n.type === 'w1')
  .flatMap(n => generateWNodeInternalEdges(n.id, n.data.originalHandles || n.data.handles));

// Rebuild a WNode's label state purely from the current edge list
function recomputeWNodeFromEdges(wNode, allEdges) {
  const original = wNode.data.originalHandles;
  if (!original) return wNode;

  const leftConnections = {};
  const rightConnections = {};

  for (const edge of allEdges) {
    if (edge.data?.isInternal) continue;

    // Edge coming IN to wNode → left side (target handle has -input suffix)
    if (edge.target === wNode.id && edge.targetHandle) {
      const cleanW = edge.targetHandle.replace(/-input$/, '');
      const cleanX = edge.sourceHandle
        ? edge.sourceHandle.replace(/-input|-output$/, '')
        : null;
      if (original.includes(cleanW) && cleanX) {
        if (!leftConnections[cleanW]) leftConnections[cleanW] = [];
        if (!leftConnections[cleanW].includes(cleanX)) leftConnections[cleanW].push(cleanX);
      }
    }

    // Edge going OUT from wNode → right side (source handle has -output suffix)
    if (edge.source === wNode.id && edge.sourceHandle) {
      const cleanW = edge.sourceHandle.replace(/-output$/, '');
      const cleanX = edge.targetHandle
        ? edge.targetHandle.replace(/-input|-output$/, '')
        : null;
      if (original.includes(cleanW) && cleanX) {
        if (!rightConnections[cleanW]) rightConnections[cleanW] = [];
        if (!rightConnections[cleanW].includes(cleanX)) rightConnections[cleanW].push(cleanX);
      }
    }
  }

  const leftSideLabels = original.map(h =>
    leftConnections[h]?.length ? leftConnections[h].join(', ') : h
  );
  const rightSideLabels = original.map(h =>
    rightConnections[h]?.length ? rightConnections[h].join(', ') : h
  );

  return {
    ...wNode,
    data: {
      ...wNode.data,
      handles: [...original],
      leftSideLabels,
      rightSideLabels,
      leftConnections,
      rightConnections,
    }
  };
}

const WIRE_COLORS = ['black', 'red', 'yellow', 'green'];

function getWNodeHandleColor(wNodeId, cleanHandleId, allNodes) {
  const wNode = allNodes.find(n => n.id === wNodeId);
  if (!wNode) return 'black';
  const idx = (wNode.data.originalHandles || wNode.data.handles).indexOf(cleanHandleId);
  return WIRE_COLORS[idx % WIRE_COLORS.length] ?? 'black';
}

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Ref so edge callbacks can read current nodes without stale closures
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const onNodesChange = useCallback(
    (changes) => setNodes(nds => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback((changes) => {
    const hasRemovals = changes.some(c => c.type === 'remove');

    setEdges(currentEdges => {
      const nextEdges = applyEdgeChanges(changes, currentEdges);

      if (hasRemovals) {
        setNodes(currentNodes =>
          currentNodes.map(node =>
            node.type === 'w1' ? recomputeWNodeFromEdges(node, nextEdges) : node
          )
        );
      }

      return nextEdges;
    });
  }, []);

  const isValidConnection = useCallback((connection) => {
    const { source, sourceHandle, target, targetHandle } = connection;
    // Block self-connections except internal WNode wires
    if (source === target) {
      return sourceHandle?.includes('-output') && targetHandle?.includes('-input');
    }
    return true;
  }, []);

  const onConnect = useCallback((params) => {
    const { source, sourceHandle, target, targetHandle } = params;

    setEdges(currentEdges => {
      const currentNodes = nodesRef.current;

      // Determine wire color from WNode handle
      const newEdge = { ...params, style: {} };
      const sourceNode = currentNodes.find(n => n.id === source);
      const targetNode = currentNodes.find(n => n.id === target);

      if (sourceNode?.type === 'w1') {
        const cleanHandle = sourceHandle?.replace(/-output$/, '');
        newEdge.style = {
          stroke: getWNodeHandleColor(source, cleanHandle, currentNodes),
          strokeWidth: 2,
        };
      } else if (targetNode?.type === 'w1') {
        const cleanHandle = targetHandle?.replace(/-input$/, '');
        newEdge.style = {
          stroke: getWNodeHandleColor(target, cleanHandle, currentNodes),
          strokeWidth: 2,
        };
      }

      const nextEdges = addEdge(newEdge, currentEdges);

      // Recompute all WNode labels from updated edge list
      setNodes(currentNodes =>
        currentNodes.map(node =>
          node.type === 'w1' ? recomputeWNodeFromEdges(node, nextEdges) : node
        )
      );

      return nextEdges;
    });
  }, []);

  const addNode = useCallback((nodeData) => {
    const newNode = {
      ...nodeData,
      id: `${nodeData.type}-${Date.now()}`,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };

    if (newNode.type === 'w1') {
      newNode.data = {
        connectorName: newNode.data.connectorName,
        MFPM: newNode.data.MFPM,
        ...makeWNodeData(newNode.data.handles),
      };
    }

    setNodes(nds => [...nds, newNode]);

    if (newNode.type === 'w1') {
      const internalEdges = generateWNodeInternalEdges(newNode.id, newNode.data.originalHandles);
      setEdges(eds => [...eds, ...internalEdges]);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Toolbar nodesData={nodesData} onAddNode={addNode} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        defaultEdgeOptions={{ zIndex: 100 }}
        elevateEdgesOnSelect
        fitView
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}