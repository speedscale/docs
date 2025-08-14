import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const CommunitySupportCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>👥 Community & Support</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Join the MCP or Speedscale community, learn about AI developement, and get support for your development needs.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://discord.com/invite/model-context-protocol-1312302100125843476" className="button button--secondary">MCP Discord</a>
        <a href="https://slack.speedscale.com" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Slack</a>
        <a href="https://github.com/EnzeD/vibe-coding" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Vibe Coding</a>
        <a href="https://github.com/davidkimai/Context-Engineering" className="button button--secondary" style={{ marginLeft: '0.5rem' }}>Context Engineering</a>
      </CardFooter>
    </Card>
  );
};

export default CommunitySupportCard;
