import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const QuickstartCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🚀 Quickstart</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Get started with <strong>proxymock</strong> by following the{' '}
        <a href="./getting-started/quickstart-cli">quickstart guide</a>. 
        You will learn how to create mocks and tests using a demo application.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./getting-started/quickstart-cli" className="button button--primary">Get Started</a>
      </CardFooter>
    </Card>
  );
};

export default QuickstartCard; 