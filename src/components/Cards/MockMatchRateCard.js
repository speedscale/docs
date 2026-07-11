import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const MockMatchRateCard = () => {
  return (
    <Card shadow="md">
      <CardHeader
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>Mock Match Rate</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Let an AI agent find why replayed requests miss their mocks and accept
        filter-scoped fixes until the match rate is 100%.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="/proxymock/guides/mock-match-rate" className="button button--primary">Improve Match Rate</a>
      </CardFooter>
    </Card>
  );
};

export default MockMatchRateCard;
