#!/usr/bin/env node
"use strict"

const WebSockProxyClient = require("karmen_ws/client/client")
    .WebSockProxyClient,
  config = require("karmen_ws/config"),
  cuid = require("cuid"),
  consola = require("consola"),
  colors = require('colors')
const { program } = require("commander")
const pkg = require("./package")

function generateKey() {
  const token = cuid()
  return `octoprint/${token}`
}

function openConnection({ serverUrl, key, forward, verbosityLevel }) {
  const wsProxy = new WebSockProxyClient(key)

  // Unfortunately cannot find a better way to override.
  config.logVerbosity = verbosityLevel;

  return new Promise((resolve, reject) => {
    const connection = wsProxy.connect(serverUrl, { forwardTo: forward })

    connection
      .on("error", function(err) {
        consola.error(
          `An error occurred while connecting to ${serverUrl}. Is it running?`,
          err
        )
      })
      .on("open", function() {
        consola.success(
          `Websocket tunnel`, colors.green(serverUrl), `-> OctoPrint box on`, colors.green(forward), `has been opened.`
        )
        consola.info(`Use following to register your device with Karmen:`, colors.cyan(key))
      })
      .on("close", function() {
        consola.info("Connection closed, exitting.")
        process.exit(1)
      })
      .on("error", reject)
      .on("open", () => {
        connection.off("error", reject)
        resolve(wsProxy)
      })
  })
}

function parseVerbosity(verbosityString) {
  switch (verbosityString) {
    case 'SILENT':
      return 0
    case 'ERROR':
      return 1
    case 'WARNING':
      return 3
    case 'INFO':
      return 5
    case 'DEBUG':
      return 10
    default:
      return 3
  }
}


if (require.main == module) {
  program.version(pkg.version)

  program
    .command("generate-key")
    .description("Generate a new token for linking with Karmen.")
    .option("-r, --raw", "Just output the key without info message")
    .action((options) => {
      const key = generateKey()
      if (options.raw) {
        console.log(key)
      } else {
        consola.log(`Your Karmen connection key is:`, colors.cyan(key))
      }
    })

  program
    .command("connect <key>")
    .description("Open the websocket proxy tunnel to Karmen")
    .option(
      "-u, --url <serverUrl>",
      "Karmen websocket proxy server URL to use",
      "https://cloud.karmen.tech"
    )
    .option("-f, --forward <address>", "What should be forwarded", "http://localhost")
    .option('-v, --verbosity <verbosityLevel>', 'verbosity level (SILENT, ERROR, WARNING, INFO, DEBUG)', parseVerbosity, 'INFO')
    .action((key, { url, forward, verbosity }) => {
      openConnection({ serverUrl: url, key, forward, verbosityLevel: verbosity })
    })

  program.parse(process.argv)
}
