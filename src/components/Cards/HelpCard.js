import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const HelpCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🆘 Help</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Computers are hard, but we're here to <a href="./getting-started/help">help</a> with details both free and paid support options.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./getting-started/help" className="button button--secondary">Get Help</a>
      </CardFooter>
    </Card>
  );
};

export default HelpCard; 