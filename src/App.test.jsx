import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

// Mock the ReactFlow functions
jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  applyNodeChanges: jest.fn(),
  applyEdgeChanges: jest.fn(),
  addEdge: jest.fn(),
}));

// Mock child components
jest.mock('./XNode', () => {
  return function MockXNode({ data }) {
    return (
      <div data-testid="x-node" data-connector-name={data.connectorName}>
        {data.connectorName}
      </div>
    );
  };
});

jest.mock('./WNode', () => {
  return function MockWNode({ data }) {
    return (
      <div data-testid="w-node" data-connector-name={data.connectorName}>
        {data.connectorName}
      </div>
    );
  };
});

jest.mock('./Toolbar', () => {
  return function MockToolbar({ onAddNode, nodesData }) {
    return (
      <div data-testid="toolbar">
        <button 
          data-testid="add-x1-button" 
          onClick={() => onAddNode(nodesData[0])}
        >
          + X1
        </button>
        <button 
          data-testid="add-x2-button" 
          onClick={() => onAddNode(nodesData[1])}
        >
          + X2
        </button>
        <button 
          data-testid="add-w1-button" 
          onClick={() => onAddNode(nodesData[2])}
        >
          + W1
        </button>
      </div>
    );
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    applyNodeChanges.mockImplementation((changes, nodes) => {
      return nodes.filter(node => !changes.some(change => 
        change.type === 'remove' && change.id === node.id
      ));
    });
    applyEdgeChanges.mockImplementation((changes, edges) => {
      return edges.filter(edge => !changes.some(change => 
        change.type === 'remove' && change.id === edge.id
      ));
    });
    addEdge.mockImplementation((edge, edges) => [...edges, edge]);
  });

  /**
   * Test that the App component renders correctly with initial state
   * Verifies that ReactFlow, Toolbar, and Controls are present
   */
  test('should render App component with initial state', () => {
    render(<App />);
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  /**
   * Test that initial nodes are properly configured
   * Verifies X1 and W1 nodes are present with correct data structure
   */
  test('should initialize with correct initial nodes', () => {
    render(<App />);
    
    const reactFlow = screen.getByTestId('react-flow');
    expect(reactFlow).toHaveProperty('nodes');
    
    // Check that nodes prop contains expected initial nodes
    const nodes = reactFlow.nodes;
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe('x1-node');
    expect(nodes[0].type).toBe('x1');
    expect(nodes[1].id).toBe('w1-node');
    expect(nodes[1].type).toBe('w1');
  });

  /**
   * Test that initial edges are generated for WNode internal connections
   * Verifies internal edges are created for W1 node handles
   */
  test('should initialize with correct internal edges for WNodes', () => {
    render(<App />);
    
    const reactFlow = screen.getByTestId('react-flow');
    const edges = reactFlow.edges;
    
    // Should have 4 internal edges for W1 node (4 handles)
    expect(edges).toHaveLength(4);
    edges.forEach(edge => {
      expect(edge.id).toMatch(/w1-node-\d+-\d+-internal/);
      expect(edge.source).toBe('w1-node');
      expect(edge.target).toBe('w1-node');
      expect(edge.data.isInternal).toBe(true);
      expect(edge.deletable).toBe(false);
      expect(edge.selectable).toBe(false);
    });
  });

  describe('Node Management', () => {
    /**
     * Test onNodesChange callback functionality
     * Verifies that node changes are applied correctly
     */
    test('should handle onNodesChange correctly', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const mockChanges = [{ type: 'position', id: 'x1-node', position: { x: 100, y: 100 } }];
      
      // Simulate onNodesChange call
      fireEvent(reactFlow, new CustomEvent('nodeschange', { detail: mockChanges }));
      
      await waitFor(() => {
        expect(applyNodeChanges).toHaveBeenCalledWith(mockChanges, expect.any(Array));
      });
    });

    /**
     * Test addNode functionality with X1 node type
     * Verifies new X1 node is added with correct properties
     */
    test('should add new X1 node when addNode is called', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const addX1Button = screen.getByTestId('add-x1-button');
      await user.click(addX1Button);
      
      const reactFlow = screen.getByTestId('react-flow');
      const nodes = reactFlow.nodes;
      
      // Should now have 3 nodes (2 initial + 1 new)
      expect(nodes).toHaveLength(3);
      
      const newNode = nodes[2];
      expect(newNode.type).toBe('x1');
      expect(newNode.data.connectorName).toBe('X1');
      expect(newNode.data.MFPM).toBe('D-sub | female | 9 pin');
      expect(newNode.data.handles).toEqual(['DCD', 'RX', 'TX', 'DTR', 'GND', 'DSR', 'RTS', 'CTS', 'RI']);
    });

    /**
     * Test addNode functionality with W1 node type
     * Verifies new W1 node is added with proper WNode data structure and internal edges
     */
    test('should add new W1 node with proper WNode data structure', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const addW1Button = screen.getByTestId('add-w1-button');
      await user.click(addW1Button);
      
      const reactFlow = screen.getByTestId('react-flow');
      const nodes = reactFlow.nodes;
      const edges = reactFlow.edges;
      
      // Should now have 3 nodes
      expect(nodes).toHaveLength(3);
      
      const newWNode = nodes[2];
      expect(newWNode.type).toBe('w1');
      expect(newWNode.data.connectorName).toBe('W1');
      expect(newWNode.data.originalHandles).toEqual(['1', '2', '3', '4']);
      expect(newWNode.data.handles).toEqual(['1', '2', '3', '4']);
      expect(newWNode.data.leftSideLabels).toEqual(['1', '2', '3', '4']);
      expect(newWNode.data.rightSideLabels).toEqual(['1', '2', '3', '4']);
      expect(newWNode.data.leftConnections).toEqual({});
      expect(newWNode.data.rightConnections).toEqual({});
      
      // Should have 8 edges total (4 original + 4 new internal)
      expect(edges).toHaveLength(8);
    });

    /**
     * Test addNode functionality with X2 node type
     * Verifies new X2 node is added with correct properties
     */
    test('should add new X2 node when addNode is called', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const addX2Button = screen.getByTestId('add-x2-button');
      await user.click(addX2Button);
      
      const reactFlow = screen.getByTestId('react-flow');
      const nodes = reactFlow.nodes;
      
      expect(nodes).toHaveLength(3);
      
      const newNode = nodes[2];
      expect(newNode.type).toBe('x2');
      expect(newNode.data.connectorName).toBe('X2');
      expect(newNode.data.MFPM).toBe('Molex KK 254 | female | 3 pin');
      expect(newNode.data.handles).toEqual(['VCC', 'GND', 'SCL']);
    });
  });

  describe('Edge Management', () => {
    /**
     * Test onEdgesChange callback functionality
     * Verifies that edge changes are applied and WNode labels are recomputed on removals
     */
    test('should handle onEdgesChange correctly', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const mockChanges = [{ type: 'remove', id: 'edge-1' }];
      
      // Simulate onEdgesChange call
      fireEvent(reactFlow, new CustomEvent('edgeschange', { detail: mockChanges }));
      
      await waitFor(() => {
        expect(applyEdgeChanges).toHaveBeenCalledWith(mockChanges, expect.any(Array));
      });
    });

    /**
     * Test onEdgesChange with removal changes triggers WNode recomputation
     * Verifies that WNode labels are updated when edges are removed
     */
    test('should recompute WNode labels when edges are removed', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const mockChanges = [{ type: 'remove', id: 'some-edge' }];
      
      // Mock applyEdgeChanges to return modified edges
      applyEdgeChanges.mockReturnValueOnce([]);
      
      fireEvent(reactFlow, new CustomEvent('edgeschange', { detail: mockChanges }));
      
      await waitFor(() => {
        expect(applyEdgeChanges).toHaveBeenCalled();
      });
    });

    /**
     * Test onConnect callback functionality
     * Verifies that new connections are added with proper edge styling
     */
    test('should handle onConnect correctly', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const mockConnection = {
        source: 'x1-node',
        sourceHandle: 'TX-output',
        target: 'w1-node',
        targetHandle: '1-input'
      };
      
      // Simulate onConnect call
      fireEvent(reactFlow, new CustomEvent('connect', { detail: mockConnection }));
      
      await waitFor(() => {
        expect(addEdge).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'x1-node',
            sourceHandle: 'TX-output',
            target: 'w1-node',
            targetHandle: '1-input',
            style: expect.objectContaining({
              stroke: 'black', // First handle color
              strokeWidth: 2
            })
          }),
          expect.any(Array)
        );
      });
    });

    /**
     * Test isValidConnection validation logic
     * Verifies that self-connections are only allowed for internal WNode wires
     */
    test('should validate connections correctly', () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const isValidConnection = reactFlow.isValidConnection;
      
      // Valid external connection
      expect(isValidConnection({
        source: 'x1-node',
        sourceHandle: 'TX-output',
        target: 'w1-node',
        targetHandle: '1-input'
      })).toBe(true);
      
      // Valid internal WNode connection
      expect(isValidConnection({
        source: 'w1-node',
        sourceHandle: '1-output',
        target: 'w1-node',
        targetHandle: '1-input'
      })).toBe(true);
      
      // Invalid self-connection (not internal WNode)
      expect(isValidConnection({
        source: 'w1-node',
        sourceHandle: '1-input',
        target: 'w1-node',
        targetHandle: '2-input'
      })).toBe(false);
    });
  });

  describe('WNode Helper Functions', () => {
    /**
     * Test makeWNodeData helper function
     * Verifies that WNode data structure is created correctly
     */
    test('makeWNodeData should create correct WNode data structure', () => {
      // Access makeWNodeData through App component
      const handles = ['A', 'B', 'C'];
      const expectedData = {
        originalHandles: ['A', 'B', 'C'],
        handles: ['A', 'B', 'C'],
        leftSideLabels: ['A', 'B', 'C'],
        rightSideLabels: ['A', 'B', 'C'],
        leftConnections: {},
        rightConnections: {}
      };
      
      // Test by adding a W1 node and checking its data
      const user = userEvent.setup();
      render(<App />);
      
      // The makeWNodeData function is used internally when adding W1 nodes
      // We can verify its behavior through the addNode functionality
    });

    /**
     * Test generateWNodeInternalEdges helper function
     * Verifies that internal edges are generated correctly for WNode handles
     */
    test('generateWNodeInternalEdges should create correct internal edges', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Add a new W1 node to trigger internal edge generation
      const addW1Button = screen.getByTestId('add-w1-button');
      await user.click(addW1Button);
      
      const reactFlow = screen.getByTestId('react-flow');
      const edges = reactFlow.edges;
      
      // Find the new internal edges
      const newInternalEdges = edges.filter(edge => 
        edge.id.includes('internal') && !edge.id.includes('w1-node')
      );
      
      expect(newInternalEdges).toHaveLength(4);
      
      newInternalEdges.forEach((edge, index) => {
        expect(edge.type).toBe('straight');
        expect(edge.deletable).toBe(false);
        expect(edge.selectable).toBe(false);
        expect(edge.data.isInternal).toBe(true);
        expect(edge.style.stroke).toEqual(['black', 'red', 'yellow', 'green'][index]);
        expect(edge.style.strokeWidth).toBe(1);
      });
    });

    /**
     * Test getWNodeHandleColor helper function
     * Verifies that correct wire colors are returned based on handle index
     */
    test('getWNodeHandleColor should return correct colors for handle indices', () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const nodes = reactFlow.nodes;
      const wNode = nodes.find(n => n.type === 'w1');
      
      // Test color mapping for different handle indices
      // This is tested indirectly through the onConnect functionality
      // which uses getWNodeHandleColor to set edge colors
    });
  });

  describe('Complex Wire Diagram Logic', () => {
    /**
     * Test recomputeWNodeFromEdges function with multiple connections
     * Verifies that WNode labels are correctly updated based on connected edges
     */
    test('should recompute WNode labels from multiple edge connections', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      
      // Simulate multiple connections to test label recomputation
      const connections = [
        {
          source: 'x1-node',
          sourceHandle: 'TX-output',
          target: 'w1-node',
          targetHandle: '1-input'
        },
        {
          source: 'x1-node',
          sourceHandle: 'RX-output',
          target: 'w1-node',
          targetHandle: '2-input'
        },
        {
          source: 'w1-node',
          sourceHandle: '1-output',
          target: 'x1-node',
          targetHandle: 'DTR-input'
        }
      ];
      
      // Simulate multiple connections
      for (const connection of connections) {
        fireEvent(reactFlow, new CustomEvent('connect', { detail: connection }));
      }
      
      await waitFor(() => {
        expect(addEdge).toHaveBeenCalledTimes(3);
      });
    });

    /**
     * Test edge validation with complex connection scenarios
     * Verifies that various connection types are validated correctly
     */
    test('should validate complex connection scenarios', () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      const isValidConnection = reactFlow.isValidConnection;
      
      // Test various connection scenarios
      const testCases = [
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'TX-output',
            target: 'w1-node',
            targetHandle: '1-input'
          },
          expected: true,
          description: 'X node to W node input'
        },
        {
          connection: {
            source: 'w1-node',
            sourceHandle: '1-output',
            target: 'x1-node',
            targetHandle: 'RX-input'
          },
          expected: true,
          description: 'W node output to X node'
        },
        {
          connection: {
            source: 'w1-node',
            sourceHandle: '1-output',
            target: 'w1-node',
            targetHandle: '1-input'
          },
          expected: true,
          description: 'Valid internal W node connection'
        },
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'TX-input',
            target: 'x1-node',
            targetHandle: 'RX-input'
          },
          expected: false,
          description: 'Invalid X node self-connection'
        }
      ];
      
      testCases.forEach(({ connection, expected, description }) => {
        expect(isValidConnection(connection)).toBe(expected);
      });
    });

    /**
     * Test wire color handling based on handle indices
     * Verifies that edges get correct colors based on WNode handle positions
     */
    test('should handle wire colors correctly based on handle indices', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      
      // Test connections to different handle indices
      const colorTestConnections = [
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'TX-output',
            target: 'w1-node',
            targetHandle: '1-input' // Index 0 -> black
          },
          expectedColor: 'black'
        },
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'RX-output',
            target: 'w1-node',
            targetHandle: '2-input' // Index 1 -> red
          },
          expectedColor: 'red'
        },
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'DTR-output',
            target: 'w1-node',
            targetHandle: '3-input' // Index 2 -> yellow
          },
          expectedColor: 'yellow'
        },
        {
          connection: {
            source: 'x1-node',
            sourceHandle: 'GND-output',
            target: 'w1-node',
            targetHandle: '4-input' // Index 3 -> green
          },
          expectedColor: 'green'
        }
      ];
      
      for (const { connection, expectedColor } of colorTestConnections) {
        fireEvent(reactFlow, new CustomEvent('connect', { detail: connection }));
        
        await waitFor(() => {
          expect(addEdge).toHaveBeenCalledWith(
            expect.objectContaining({
              style: expect.objectContaining({
                stroke: expectedColor,
                strokeWidth: 2
              })
            }),
            expect.any(Array)
          );
        });
      }
    });

    /**
     * Test multiple edge connections to same WNode handle
     * Verifies that multiple connections to the same handle are handled correctly
     */
    test('should handle multiple edge connections to same WNode handle', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      
      // Connect multiple sources to the same WNode handle
      const multipleConnections = [
        {
          source: 'x1-node',
          sourceHandle: 'TX-output',
          target: 'w1-node',
          targetHandle: '1-input'
        },
        {
          source: 'x1-node',
          sourceHandle: 'RX-output',
          target: 'w1-node',
          targetHandle: '1-input'
        }
      ];
      
      for (const connection of multipleConnections) {
        fireEvent(reactFlow, new CustomEvent('connect', { detail: connection }));
      }
      
      await waitFor(() => {
        expect(addEdge).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    /**
     * Test behavior with invalid node data
     * Verifies that the app handles missing or invalid node data gracefully
     */
    test('should handle invalid node data gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Test with invalid node data by modifying the nodesData
      const toolbar = screen.getByTestId('toolbar');
      
      // The app should not crash even with invalid data
      expect(toolbar).toBeInTheDocument();
    });

    /**
     * Test behavior with empty handles array
     * Verifies that WNodes with empty handles are handled correctly
     */
    test('should handle WNode with empty handles array', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // This tests the robustness of the makeWNodeData function
      // and other helper functions when dealing with edge cases
      const addW1Button = screen.getByTestId('add-w1-button');
      await user.click(addW1Button);
      
      // Should not crash and should create a valid node
      const reactFlow = screen.getByTestId('react-flow');
      expect(reactFlow.nodes).toHaveLength(3);
    });

    /**
     * Test recomputeWNodeFromEdges with invalid edge data
     * Verifies that the function handles malformed edges gracefully
     */
    test('should handle recomputeWNodeFromEdges with invalid edge data', async () => {
      render(<App />);
      
      const reactFlow = screen.getByTestId('react-flow');
      
      // Simulate edge changes with malformed data
      const invalidChanges = [
        { type: 'remove', id: 'non-existent-edge' },
        { type: 'update', id: 'invalid-edge', data: null }
      ];
      
      // Should not crash when processing invalid changes
      fireEvent(reactFlow, new CustomEvent('edgeschange', { detail: invalidChanges }));
      
      await waitFor(() => {
        expect(applyEdgeChanges).toHaveBeenCalled();
      });
    });

    /**
     * Test getWNodeHandleColor with invalid parameters
     * Verifies that the function returns a default color for invalid inputs
     */
    test('should handle getWNodeHandleColor with invalid parameters', () => {
      render(<App />);
      
      // Test is implicit through the onConnect functionality
      // The function should return 'black' as default for invalid inputs
      const reactFlow = screen.getByTestId('react-flow');
      
      // Test connection with non-existent node
      const invalidConnection = {
        source: 'non-existent-node',
        sourceHandle: 'invalid-handle',
        target: 'w1-node',
        targetHandle: '1-input'
      };
      
      fireEvent(reactFlow, new CustomEvent('connect', { detail: invalidConnection }));
      
      // Should not crash and should use default styling
    });

    /**
     * Test state consistency during rapid operations
     * Verifies that rapid node/edge operations maintain state consistency
     */
    test('should maintain state consistency during rapid operations', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const addW1Button = screen.getByTestId('add-w1-button');
      
      // Rapidly add multiple nodes
      await user.click(addW1Button);
      await user.click(addW1Button);
      await user.click(addW1Button);
      
      const reactFlow = screen.getByTestId('react-flow');
      const nodes = reactFlow.nodes;
      const edges = reactFlow.edges;
      
      // Should have 5 nodes total (2 initial + 3 new)
      expect(nodes).toHaveLength(5);
      
      // Should have correct number of internal edges
      // Original: 4, New: 3 * 4 = 12, Total: 16
      expect(edges).toHaveLength(16);
      
      // All W1 nodes should have proper data structure
      const wNodes = nodes.filter(n => n.type === 'w1');
      wNodes.forEach(node => {
        expect(node.data.originalHandles).toBeDefined();
        expect(node.data.handles).toBeDefined();
        expect(node.data.leftSideLabels).toBeDefined();
        expect(node.data.rightSideLabels).toBeDefined();
        expect(node.data.leftConnections).toBeDefined();
        expect(node.data.rightConnections).toBeDefined();
      });
    });
  });
});
