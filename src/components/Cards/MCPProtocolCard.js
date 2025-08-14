import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const MCPProtocolCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔗 MCP & Protocol Information</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Official MCP specification, documentation, and community resources for the Model Context Protocol.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://modelcontextprotocol.io" className="button button--primary">MCP Spec</a>
        <a href="https://github.com/modelcontextprotocol" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>GitHub</a>
        <a href="https://github.com/modelcontextprotocol/servers" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Registry</a>
      </CardFooter>
    </Card>
  );
};

export default MCPProtocolCard;
