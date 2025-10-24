import React from 'react';
import Link from '@docusaurus/Link';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const CICDIntegrationCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>🔄 CI/CD Integration</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Integrate proxymock into your <Link to="/proxymock/guides/cicd">CI/CD pipeline</Link> to automate testing and ensure API reliability in your deployment process.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="https://proxymock.io/blog/automating-api-mocks-in-your-ci-pipeline-with-proxymock/" className="button button--secondary">Learn CI/CD</a>
      </CardFooter>
    </Card>
  );
};

export default CICDIntegrationCard; 
