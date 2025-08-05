import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const EditingTestsCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>✏️ Editing Tests and Mocks</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn how to <a href="./replay/mocks/edit-sig">edit and customize</a> your recorded tests and mocks to fit your specific testing needs.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./replay/mocks/edit-sig" className="button button--secondary">Edit Mocks</a>
      </CardFooter>
    </Card>
  );
};

export default EditingTestsCard; 