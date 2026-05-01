import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const DatadogSyntheticsCard = () => {
  return (
    <Card shadow="md">
      <CardHeader
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>Datadog Synthetics</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Export recorded proxymock traffic into Datadog Synthetics tests with automatic
        auth redaction and step chaining.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="/proxymock/guides/datadog-synthetics/" className="button button--primary">Open Guide</a>
      </CardFooter>
    </Card>
  );
};

export default DatadogSyntheticsCard;
