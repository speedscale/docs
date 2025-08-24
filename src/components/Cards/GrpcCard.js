import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const GrpcCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>⚡ gRPC Support</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn how to use <strong>proxymock</strong> with gRPC services. 
        Record, replay, and mock gRPC calls with full protocol buffer support.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./grpc" className="button button--primary">Learn gRPC</a>
      </CardFooter>
    </Card>
  );
};

export default GrpcCard;