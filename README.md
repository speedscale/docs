[![Build](https://github.com/speedscale/docs/actions/workflows/main.yaml/badge.svg)](https://github.com/speedscale/docs/actions/workflows/main.yaml)

# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Partials

`.mdx` files beginning with a `_` character are partials. These are useful for including a piece of content in multiple locations, such as tables of annotations that can be inserted both in their relevant section, as well as stored in a single reference location.

### Dead Links

If you delete a page you should create a redirect for it so that it doesn't break links.  This configuration is located in the [docusaurus config](./docusaurus.config.js)

