import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const SnapshotCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>📸 Creating Snapshots</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn how to create traffic snapshots to capture API interactions. 
        Set up recording sessions and capture real traffic patterns.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./creating-a-snapshot" className="button button--primary">Create Snapshots</a>
      </CardFooter>
    </Card>
  );
};

export default SnapshotCard;