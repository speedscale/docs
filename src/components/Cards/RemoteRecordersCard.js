import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const RemoteRecordersCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🌐 Remote Recorders</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Deploy <a href="/quick-start">remote recorders</a> in your infrastructure to capture traffic from production environments and distributed systems.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="/quick-start" className="button button--secondary">Install Recorders</a>
      </CardFooter>
    </Card>
  );
};

export default RemoteRecordersCard; 