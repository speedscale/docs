import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const ReferenceCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>📚 Reference</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        See the <a href="./how-it-works/index">reference</a> for details on more advanced features.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./how-it-works/index" className="button button--secondary">View Reference</a>
      </CardFooter>
    </Card>
  );
};

export default ReferenceCard; 