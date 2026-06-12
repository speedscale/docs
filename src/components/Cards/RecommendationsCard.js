import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const RecommendationsCard = () => {
  return (
    <Card shadow="md">
      <CardHeader
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔑 Fix Auth Errors on Replay</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Expired bearer/OAuth tokens turn replays into a wall of 403s. Let proxymock
        detect the token handshake and generate a smart_replace blueprint that
        re-uses the freshly minted token on every protected request.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="/proxymock/guides/recommendations" className="button button--primary">Fix Auth on Replay</a>
      </CardFooter>
    </Card>
  );
};

export default RecommendationsCard;
