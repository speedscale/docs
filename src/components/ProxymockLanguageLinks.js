import React from 'react';

const languageLinks = [
  {
    label: 'Java',
    href: '/reference/languages/java#proxymock',
    description: 'Java demo app',
  },
  {
    label: '.NET',
    href: '/reference/languages/dotnet#proxymock',
    description: '.NET demo app',
  },
  {
    label: 'Node.js',
    href: '/reference/languages/nodejs#proxymock',
    description: 'Node.js demo app',
  },
  {
    label: 'Go',
    href: '/reference/languages/golang#proxymock',
    description: 'Go demo app',
  },
  {
    label: 'Python',
    href: '/reference/languages/python#proxymock',
    description: 'Python demo app',
  },
  {
    label: 'Ruby',
    href: '/reference/languages/ruby#proxymock',
    description: 'Ruby demo app',
  },
  {
    label: 'C++',
    href: '/reference/languages/cpp#proxymock',
    description: 'C++ demo app',
  },
];

const ProxymockLanguageLinks = ({ className = '' }) => {
  return (
    <ul className={className}>
      {languageLinks.map((item) => (
        <li key={item.label}>
          <a href={item.href}>{item.label}</a> — {item.description}
        </li>
      ))}
    </ul>
  );
};

export default ProxymockLanguageLinks;
