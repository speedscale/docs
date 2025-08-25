import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const TroubleshootingCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔧 Troubleshooting</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Diagnose and fix common issues with traffic capture and replay. 
        Resolve pod problems and configuration errors.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./troubleshooting" className="button button--primary">Fix Issues</a>
      </CardFooter>
    </Card>
  );
};

export default TroubleshootingCard;