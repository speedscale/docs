import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const FAQCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>❓ FAQ</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Find <a href="./getting-started/faq">answers</a> to common questions about <strong>proxymock</strong>.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./getting-started/faq" className="button button--secondary">View FAQ</a>
      </CardFooter>
    </Card>
  );
};

export default FAQCard; 