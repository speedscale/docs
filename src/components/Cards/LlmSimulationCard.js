import React from 'react';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';

const LlmSimulationCard = () => {
  return (
    <Card shadow="md">
      <CardHeader 
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}
        textAlign="center"
        weight="Bold"
      >
        <h3 style={{ margin: 0, marginBottom: '1rem' }}>LLM Simulation</h3>
      </CardHeader>
      <CardBody className="padding-vert--md">
        Record and mock LLM API calls from OpenAI, Anthropic, Gemini, and other providers.
        Eliminate AI spend in development and CI.
      </CardBody>
      <CardFooter style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
        <a href="./llm-simulation" className="button button--primary">Mock LLM APIs</a>
      </CardFooter>
    </Card>
  );
};

export default LlmSimulationCard;
