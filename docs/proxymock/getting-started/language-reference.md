---
sidebar_position: 3
title: Language Configuration
---

Some language-specific environment configuration may be necessary but you should not need to modify your application code to use **proxymock**.

### Decrypting TLS

**proxymock** attempts to automatically configure TLS on the desktop so manual configuration is only necessary in special environments like CI/CD or when TLS decryption does not work out of the box.

Commands and flags should be run in the environment where your application is running.

import LanguageSpecificTLSConfiguration from '../../setup/sidecar/\_language_specific_tls_config.mdx';

<LanguageSpecificTLSConfiguration />
