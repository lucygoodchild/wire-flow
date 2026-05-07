function Toolbar( { nodesData, onAddNode } ) {
  const addNode = (nodeTemplate) => {
    onAddNode(nodeTemplate);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: 9999, 
      display: 'flex',
      gap: '8px',
      background: '#ffffff',
      border: '1px solid #9a9595',
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    }}>
      <button onClick={() => addNode(nodesData[0])}>+ X1</button>
      <button onClick={() => addNode(nodesData[1])}>+ X2</button>
      <button onClick={() => addNode(nodesData[2])}>+ W1</button>
    </div>
  );
}

export default Toolbar;