import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const SessionCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔑 Session Handling</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn to identify and manage user sessions in your traffic. 
        Handle authentication flows and session-based testing scenarios.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./identify-session" className="button button--primary">Manage Sessions</a>
      </CardFooter>
    </Card>
  );
};

export default SessionCard;