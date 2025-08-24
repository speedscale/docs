import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const ReplayGuideCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔄 Replay Traffic</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Master traffic replay techniques including load testing, mocks, 
        and multi-service replays for comprehensive API testing.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./replay/" className="button button--primary">Learn Replay</a>
      </CardFooter>
    </Card>
  );
};

export default ReplayGuideCard;