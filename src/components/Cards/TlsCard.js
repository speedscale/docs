import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const TlsCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔐 TLS Configuration</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Configure TLS settings for secure traffic capture and replay. 
        Handle encrypted connections and certificate management.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./tls" className="button button--primary">Configure TLS</a>
      </CardFooter>
    </Card>
  );
};

export default TlsCard;