import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const LocalCaptureCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>💻 Local Recording</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Set up traffic recording from your local development environment. 
        Capture desktop application traffic for testing and analysis.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./local-capture" className="button button--primary">Record Locally</a>
      </CardFooter>
    </Card>
  );
};

export default LocalCaptureCard;