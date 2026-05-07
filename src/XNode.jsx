import { Handle, Position } from '@xyflow/react';

function XNode({ data }) {
  const handles = data.handles || [];

  return (
    <div style={{
      background: 'white',
      border: '1px solid #555',
      borderRadius: '8px',
      padding: '8px 8px',
      minWidth: '50px',
      color: 'black',
      fontFamily: 'monospace',
      fontSize: '10px',
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '10px', 
        borderBottom: '1px solid #555', 
        paddingBottom: '8px',
        textAlign: 'center',
      }}>
        {data.connectorName}
      </div>
      <div style={{   
        borderBottom: '1px solid #555', 
        paddingBottom: '10px',
        textAlign: 'center',
        fontSize: '6px',
      }}>
        {data.MFPM}
      </div>

      {handles.map((id) => (
        <div key={id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #555',
          padding: '4px 0',
          position: 'relative',
        }}>
          <Handle
            type="target"
            position={Position.Left}
            id={`${id}-input`}
            style={{ position: 'static', transform: 'none', background: '#888' }}
          />
          <span style={{ margin: '0 8px' }}>{id}</span>
          <Handle
            type="source"
            position={Position.Right}
            id={`${id}-output`}
            style={{ position: 'static', transform: 'none', background: '#888' }}
          />
        </div>
      ))}
    </div>
  );
}

export default XNode;