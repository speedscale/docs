import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const AICodeGenerationCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🤖 AI Code Generation & Development</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Leading AI-powered development tools that integrate with MCP for enhanced coding productivity.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://github.com/features/copilot" className="button button--secondary">GitHub Copilot</a>
        <a href="https://cursor.com" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Cursor</a>
        <a href="https://claude.ai/download" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Claude</a>
        <a href="https://openai.com/blog/openai-codex" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>OpenAI Codex</a>
      </CardFooter>
    </Card>
  );
};

export default AICodeGenerationCard;
