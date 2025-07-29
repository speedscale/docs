import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const EnterpriseCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🏢 Speedscale Enterprise</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        <a href="https://speedscale.com/pricing">Speedscale Pro or Enterprise</a> allows you to deploy your mocks and tests in the cloud or record them using production-grade agents. Learn more <a href="https://speedscale.com">here</a>. This is not science fiction and no aliens were harmed in its creation.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://speedscale.com" className="button button--secondary">Learn More</a>
      </CardFooter>
    </Card>
  );
};

export default EnterpriseCard; 