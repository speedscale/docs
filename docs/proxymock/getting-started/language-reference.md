---
sidebar_position: 3
title: Language Configuration
---

Some language-specific environment configuration may be necessary but you should not need to modify your application code to use **proxymock**.

### Trusting TLS Certificates

**proxymock** can automatically decrypt outbound TLS requests from your app allowing you to view, mock, and modify request details. This can feel magical but requires that your system trusts an intermediate cert used by **proxymock**. Know that your [data and privacy](../reference/data_and_privacy.md) are very important to us.

import LanguageSpecificTLSConfiguration from '../../setup/sidecar/\_language_specific_tls_config.mdx';

<LanguageSpecificTLSConfiguration />
