import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const LearningResourcesCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>📚 Learning Resources</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Comprehensive guides for MCP integration, AI-assisted development best practices, and proxymock documentation.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://modelcontextprotocol.io/docs/integrations" className="button button--primary">MCP Guide</a>
        <a href="https://github.com/features/copilot#best-practices" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Best Practices</a>
        <a href="https://docs.speedscale.com/proxymock/" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Proxymock Docs</a>
      </CardFooter>
    </Card>
  );
};

export default LearningResourcesCard;
