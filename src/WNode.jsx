import { Handle, Position } from '@xyflow/react';

function WNode({ data }) {
  const originalHandles = data.originalHandles || data.handles || [];
  const leftSideLabels = data.leftSideLabels || originalHandles;
  const rightSideLabels = data.rightSideLabels || originalHandles;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #555',
      borderRadius: '8px',
      padding: '8px 8px',
      display: 'inline-block',
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
        whiteSpace: 'nowrap',
      }}>
        {data.connectorName}
      </div>
      <div style={{
        paddingBottom: '10px',
        textAlign: 'center',
        fontSize: '6px',
        whiteSpace: 'nowrap',
      }}>
        {data.MFPM}
      </div>

      {originalHandles.map((handleId, index) => {
        const leftLabel = leftSideLabels[index] ?? handleId;
        const rightLabel = rightSideLabels[index] ?? handleId;

        return (
          <div key={handleId} style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '6px',
          }}>
            {/* Labels row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              paddingLeft: '6px',
              paddingRight: '6px',
              marginBottom: '2px',
            }}>
              <span style={{ fontSize: '8px', whiteSpace: 'nowrap' }}>{leftLabel}</span>
              <span style={{ fontSize: '8px', whiteSpace: 'nowrap' }}>{rightLabel}</span>
            </div>

            {/* Handles row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}>
              <Handle
                type="target"
                position={Position.Left}
                id={`${handleId}-input`}
                style={{
                  background: '#888',
                  position: 'relative',
                  left: 'unset',
                  top: 'unset',
                  transform: 'none',
                  flexShrink: 0,
                }}
                isConnectable
              />
              {/* Connecting line between handles */}
              <div style={{
                flex: 1,
                height: '1px',
                background: '#aaa',
              }} />
              <Handle
                type="source"
                position={Position.Right}
                id={`${handleId}-output`}
                style={{
                  background: '#888',
                  position: 'relative',
                  right: 'unset',
                  top: 'unset',
                  transform: 'none',
                  flexShrink: 0,
                }}
                isConnectable
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WNode;