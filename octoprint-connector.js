#!/usr/bin/env node
"use strict"

const WebSockProxyClient = require("karmen_ws/client/client")
    .WebSockProxyClient,
  config = require("karmen_ws/config"),
  cuid = require("cuid"),
  consola = require("consola"),
  colors = require("colors")
const { program } = require("commander")
const pkg = require("./package")

function generateKey() {
  const token = cuid()
  return `octoprint-${token}`
}

/**
 * Open connection to the websocket proxy server.
 */
function openConnection(
  { serverUrl, key, forward, verbosityLevel },
  reportConnectionInit
) {
  // Unfortunately cannot find a better way to override.
  config.logVerbosity = verbosityLevel

  const wsProxy = new WebSockProxyClient(key)
  const connection = wsProxy.connect(serverUrl, { forwardTo: forward })

  connection
    .on("error", err => {
      consola.error(
        `An error occurred while connecting to ${serverUrl}. Is it running?`,
        err
      )
    })
    .on("open", () => {
      if (reportConnectionInit) {
        consola.success(
          `Websocket tunnel`,
          colors.green(serverUrl),
          `-> OctoPrint box on`,
          colors.green(forward),
          `has been opened.`
        )
        consola.info(
          `Use following key to register your device with Karmen:`,
          colors.cyan(key)
        )
      } else {
        console.log(`Connection has been re-opened.`)
      }
    })
    .on("close", () => {
      // For some reason, using consola here leads to weird message dupes?
      console.log("Connection has been closed on the remote server.")
    })

  return connection
}

/**
 * Keep the connection alive.
 *
 * When connection closes on the remote end, reconnect.
 */
function keepAlive(connectionBuilder, firstRun) {
  const connection = connectionBuilder(firstRun)
  // Makes sure connection is re-created when the original one is closed.
  connection.webSocket.once("close", () => keepAlive(connectionBuilder, false))
}

function parseVerbosity(verbosityString) {
  switch (verbosityString) {
    case "SILENT":
      return 0
    case "ERROR":
      return 1
    case "WARNING":
      return 3
    case "INFO":
      return 5
    case "DEBUG":
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
    .action(options => {
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
    .option(
      "-f, --forward <address>",
      "What should be forwarded",
      "http://localhost"
    )
    .option(
      "-v, --verbosity <verbosityLevel>",
      "verbosity level (SILENT, ERROR, WARNING, INFO, DEBUG)",
      parseVerbosity,
      "INFO"
    )
    .action((key, { url, forward, verbosity }) => {
      const connectionBuilder = reportConnectionInit =>
        openConnection(
          { serverUrl: url, key, forward, verbosityLevel: verbosity },
          reportConnectionInit
        )

      keepAlive(connectionBuilder, true)
    })

  program.parse(process.argv)
}
