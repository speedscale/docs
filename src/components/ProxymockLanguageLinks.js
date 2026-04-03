import React from 'react';

const languageLinks = [
  {
    label: 'Java',
    href: '/reference/languages/java#proxymock',
    description: 'Spring Boot demo, JVM proxy flags, and the exported production trace.',
  },
  {
    label: '.NET',
    href: '/reference/languages/dotnet#proxymock',
    description: 'Minimal API demo with HTTP_PROXY/HTTPS_PROXY and local replay.',
  },
  {
    label: 'Node.js',
    href: '/reference/languages/nodejs#proxymock',
    description: 'Express demo with client-specific proxy handling guidance.',
  },
  {
    label: 'Go',
    href: '/reference/languages/golang#proxymock',
    description: 'outerspace-go demo with Go-native record, mock, and replay steps.',
  },
  {
    label: 'Python',
    href: '/reference/languages/python#proxymock',
    description: 'Flask SpaceX demo with a lightweight Makefile-backed capture flow.',
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
