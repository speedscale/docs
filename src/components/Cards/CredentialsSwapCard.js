import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const CredentialsSwapCard = () => {
  return (
    <Card shadow="md">
      <CardHeader
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔐 Basic Auth Credentials Swap</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Replace recorded HTTP Basic auth credentials with replay-target credentials
        in one click. Includes the full S3 push/pull workflow for staging recordings
        across machines.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="/proxymock/guides/credentials-swap" className="button button--primary">Swap Credentials</a>
      </CardFooter>
    </Card>
  );
};

export default CredentialsSwapCard;
