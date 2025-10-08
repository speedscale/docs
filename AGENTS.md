# Agent Guidelines

This document orients any AI coding agent working in this repository. Follow the workflow expectations below before making changes or running commands.

## Workflow Expectations
- Create a brief plan (via the planning tool) for multi-step tasks; skip only when the change is truly simple.
- Prefer `rg`/`rg --files` when searching; avoid slower fallbacks unless necessary.
- Keep edits ASCII unless the file already relies on other character sets; add comments only when they aid future readers.
- Never revert user-authored changes; ask for guidance if you encounter unexpected edits you did not make.
- Request approval before destructive operations or commands that need broader filesystem/network access.
- Run relevant tests or linters when feasible; mention any steps you could not perform.

## Project Overview
This is Speedscale's documentation website built with Docusaurus 3 (currently 3.8.1). Speedscale is an API testing platform that uses traffic capture and replay for stress testing APIs with real-world scenarios. The documentation covers two main products:
- **Speedscale Platform**: Full enterprise API testing platform  
- **ProxyMock**: Local development tool for mocking APIs

## Development Commands

### Essential Commands
```bash
# Install dependencies
yarn

# Start local development server (auto-reload enabled)
yarn start

# Build the site for production
yarn build

# Serve built site locally
yarn serve

# Clear Docusaurus cache
yarn clear
```

### Deployment
```bash
# Deploy via SSH
USE_SSH=true yarn deploy

# Deploy without SSH  
GIT_USER=<username> yarn deploy
```

## Architecture & Structure

### Documentation Organization
The site uses a hierarchical structure organized in `/docs/` with these main sections:

- **proxymock/**: Local development tool documentation
- **setup/**: Installation and configuration guides
- **observe/**: Traffic monitoring and analysis
- **transform/**: Data transformation and filtering
- **mocks/**: Service virtualization features
- **integration/**: Third-party integrations
- **guides/**: Step-by-step tutorials
- **reference/**: Technical specifications
- **security/**: Security and compliance information

### Key Configuration Files

- `docusaurus.config.js`: Main Docusaurus configuration with extensive redirect mappings
- `sidebars.js`: Navigation structure configuration
- `package.json`: Dependencies and npm scripts
- Content is organized using Docusaurus categories that auto-generate from directory structure

### Special Files

- **Partials**: `.mdx` files starting with `_` are reusable content components
- **Redirects**: Extensive redirect configuration in `docusaurus.config.js` maintains backward compatibility when pages are moved
- **Images**: Stored alongside documentation files in topic-specific directories

### Content Management

When deleting pages, always add redirects to `docusaurus.config.js` to prevent broken links. The site uses:
- Algolia for search functionality
- HubSpot integration for lead tracking  
- Google Tag Manager for analytics
- Mermaid for diagram rendering

### Technical Stack

- **Framework**: Docusaurus 3.8.1
- **React**: 19.0.0  
- **Node**: >=18.0 required
- **Search**: Algolia DocSearch
- **Analytics**: Google Tag Manager, HubSpot

## Documentation Improvement Plan

*Last updated: 2025-10-08*

### Completed Immediate Fixes
✅ **Fixed broken redirects** in `docusaurus.config.js` (lines 128, 382, 454, 466)
✅ **Removed orphaned file** `docs/reference/transform-traffic/common-patterns/login-`
✅ **Created end-to-end documentation** with proper navigation and content for existing screenshots

### Priority Improvements Needed

#### **Phase 1: Critical Content Gaps**
- **Setup/Upgrade Documentation**: Expand beyond operator upgrades to include CLI/Docker procedures, rollback guides
- **ProxyMock Guides**: Currently minimal (4 files) - needs comprehensive getting started guides, troubleshooting, integration examples
- **Transform Documentation Consolidation**: Content split between `/transform/` and `/reference/transform-traffic/` - consolidate for clarity

#### **Phase 2: Information Architecture**
- **User Journey Optimization**: Create clear beginner → intermediate → advanced progression paths
- **Platform-Specific Quick Starts**: Add AWS, GCP, Azure specific guides beyond basic installation
- **Cross-Reference Improvements**: Better linking between related concepts across sections

#### **Phase 3: Content Development**
- **Transform Best Practices**: Expand beyond JWT to cover performance optimization, common pitfalls, industry use cases
- **Troubleshooting Workflows**: Add platform-specific troubleshooting guides
- **Integration Examples**: More detailed, real-world integration scenarios

### Technical Maintenance Notes
- **Naming Standardization**: Implement consistent file/directory naming conventions
- **Image Organization**: Move loose images to topic-specific directories
- **Link Validation**: Consider automated checking for future maintenance
- **Search Optimization**: Ensure Algolia indexing covers all content areas

### Implementation Guidelines
When working on these improvements:
1. Always add redirects when moving/deleting pages
2. Follow existing markdown patterns and directory structure
3. Use the autogenerated sidebar structure where possible
4. Include proper `_category_.json` files for new sections
5. Cross-reference related documentation sections
