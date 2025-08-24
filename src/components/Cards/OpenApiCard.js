import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const OpenApiCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>📋 OpenAPI Support</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Learn how to use <strong>proxymock</strong> with OpenAPI specifications. 
        Generate tests and mocks from your API schemas and validate responses.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./openapi" className="button button--primary">Learn OpenAPI</a>
      </CardFooter>
    </Card>
  );
};

export default OpenApiCard;