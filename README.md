> ## 🚨 Important Notice
>
> This repository is a clone of the
> [MCP UI](https://www.epicai.pro/workshops/day-5-6-mcp-ui)
> by EpicAI. It has been published solely to document my GitHub activity
> and for personal educational purposes.
>
> **Note:** This is not an official fork or a maintained derivative of the
> original project.
<div>
  <h1 align="center"><a href="https://www.epicweb.dev/workshops">MCP UI 🪟</a></h1>
  <strong>
    Go beyond text interaction in AI Chat
  </strong>
  <p>
    MCP UI is a sub-spec of the MCP protocol that allows servers to send UI along with their responses enabling supporting clients to offer even better user experiences.
  </p>
</div>

<hr />

<div align="center">
  <a
    alt="Epic Web logo with the words Deployed Version"
    href="https://epicweb-dev-mcp-ui.fly.dev/"
  >
    <img
      width="300px"
      src="https://github-production-user-asset-6210df.s3.amazonaws.com/1500684/254000390-447a3559-e7b9-4918-947a-1b326d239771.png"
    />
  </a>
</div>

<hr />

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![GPL 3.0 License][license-badge]][license]
[![Code of Conduct][coc-badge]][coc]
<!-- prettier-ignore-end -->

## Prerequisites

- JavaScript/TypeScript experience
- Node.js experience
- [Advanced MCP Features](https://www.epicai.pro/advanced-mcp-features) or
  equivalent experience.

## Pre-workshop Resources

Here are some resources you can read before taking the workshop to get you up to
speed on some of the tools and concepts we'll be covering:

- [Letting AI Interface with Your App with MCPs](https://www.epicai.pro/letting-ai-interface-with-your-app-with-mcps-talk)
- [MCP Introduction](https://modelcontextprotocol.io/introduction)
- [Your AI Assistant Instructor: The EpicShop MCP Server](https://www.epicai.pro/your-ai-assistant-instructor-the-epicshop-mcp-server-0eazr)
- [How to Debug Your MCP Server](https://www.epicai.pro/how-to-debug-your-mcp-server-38qyl)

## System Requirements

- [git][git] v2.18 or greater
- [NodeJS][node] v18 or greater
- [npm][npm] v8 or greater

All of these must be available in your `PATH`. To verify things are set up
properly, you can run this:

```shell
git --version
node --version
npm --version
```

If you have trouble with any of these, learn more about the PATH environment
variable and how to fix it here for [windows][win-path] or
[mac/linux][mac-path].

## Setup

This is a pretty large project (it's actually many apps in one) so it can take
several minutes to get everything set up the first time. Please have a strong
network connection before running the setup and grab a snack.

> **Warning**: This repo is _very_ large. Make sure you have a good internet
> connection before you start the setup process. The instructions below use
> `--depth` to limit the amount you download, but if you have a slow connection,
> or you pay for bandwidth, you may want to find a place with a better
> connection.

Follow these steps to get this set up:

```sh nonumber
git clone --depth 1 https://github.com/epicweb-dev/mcp-ui.git
cd mcp-ui
npm run setup
```

If you experience errors here, please open [an issue][issue] with as many
details as you can offer.

## The Workshop App

Learn all about the workshop app on the
[Epic Web Getting Started Guide](https://www.epicweb.dev/get-started).

[![Kent with the workshop app in the background](https://github-production-user-asset-6210df.s3.amazonaws.com/1500684/280407082-0e012138-e01d-45d5-abf2-86ffe5d03c69.png)](https://www.epicweb.dev/get-started)

<!-- prettier-ignore-start -->
[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[git]: https://git-scm.com/
[build-badge]: https://img.shields.io/github/actions/workflow/status/epicweb-dev/mcp-ui/validate.yml?branch=main&logo=github&style=flat-square
[build]: https://github.com/epicweb-dev/mcp-ui/actions?query=workflow%3Avalidate
[license-badge]: https://img.shields.io/badge/license-GPL%203.0%20License-blue.svg?style=flat-square
[license]: https://github.com/epicweb-dev/mcp-ui/blob/main/LICENSE
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://kentcdodds.com/conduct
[win-path]: https://www.howtogeek.com/118594/how-to-edit-your-system-path-for-easy-command-line-access/
[mac-path]: http://stackoverflow.com/a/24322978/971592
[issue]: https://github.com/epicweb-dev/mcp-ui/issues/new
<!-- prettier-ignore-end -->
