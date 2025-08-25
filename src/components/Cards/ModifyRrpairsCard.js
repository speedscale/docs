import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const ModifyRrpairsCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔧 Modify RRPairs</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn how to modify and customize recorded request/response pairs. 
        Transform data, update headers, and adapt traffic for different environments.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./modify-rrpairs" className="button button--primary">Learn Modifications</a>
      </CardFooter>
    </Card>
  );
};

export default ModifyRrpairsCard;