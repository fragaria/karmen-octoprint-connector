#!/usr/bin/env node
"use strict"

const WebSockProxyClient = require("karmen_ws/client/client")
    .WebSockProxyClient,
  config = require("karmen_ws/config"),
  cuid = require("cuid"),
  signale = require("signale"),
  chalk = require("chalk")
const { program } = require("commander")
const pkg = require("./package")

const loggerOpts = {
  types: {
    connected: {
      badge: "🔗",
      label: "Connected",
      color: "green",
      logLevel: "debug",
    },
    error: {
      badge: "❌",
      label: "Error",
      color: "red",
      logLevel: "error",
    },
    note: {
      badge: "📓",
      label: "Note",
      color: "blue",
      logLevel: "debug",
    },
  },
}

let logger
let interactiveLogger

const setupLoggers = logLevel => {
  const localOpts = {
    logLevel,
    // Logging disabled for null verbosity level.
    disabled: !logLevel,
  }

  logger = new signale.Signale({ ...localOpts, ...loggerOpts })
  interactiveLogger = new signale.Signale({
    interactive: true,
    ...localOpts,
    ...loggerOpts,
  })
}

/**
 * Open connection to the websocket proxy server.
 */
function openConnection(
  { serverUrl, key, forward, verbosityLevel },
  reportConnectionInit
) {
  // Couldn't find a better way to override unfortunately.
  config.logVerbosity = verbosityLevel

  const wsProxy = new WebSockProxyClient(key)
  const connection = wsProxy.connect(serverUrl, { forwardTo: forward })
  let errored = false

  connection
    .on("error", err => {
      errored = true
      logger.error(
        `An error occurred while connecting to ${serverUrl}. Do you have a right connection key? Is it running?`,
        err
      )
    })
    .on("open", () => {
      interactiveLogger.connected(`Connection established.`)
    })
    .on("close", () => {
      // Won't reconnect on error so no output.
      if (!errored) {
        interactiveLogger.note("Connection has been closed, reconnecting ...")
      }
    })

  return connection
}

/**
 * Keep the connection alive.
 *
 * When connection closes on the remote end, reconnect.
 */
function keepAlive(connectionBuilder) {
  const connection = connectionBuilder()

  connection.on("error", () => {
    // Ensure stdio is flushed prior to exitting.
    // @see: https://github.com/nodejs/node/issues/6456 for more details
    ;[process.stdout, process.stderr].forEach(s => {
      s &&
        s.isTTY &&
        s._handle &&
        s._handle.setBlocking &&
        s._handle.setBlocking(true)
    })

    process.exit(1)
  })

  // Make sure connection is re-created when the original one is closed.
  connection.webSocket.once("close", () => keepAlive(connectionBuilder))
}

function parseVerbosity(verbosityString) {
  switch (verbosityString) {
    case "SILENT":
      return { wsVerbosity: 0, ownVerbosity: null }
    case "ERROR":
      return { wsVerbosity: 1, ownVerbosity: "error" }
    case "WARNING":
      return { wsVerbosity: 3, ownVerbosity: "warn" }
    case "INFO":
      return { wsVerbosity: 3, ownVerbosity: "info" }
    case "DEBUG":
      return { wsVerbosity: 10, ownVerbosity: "info" }
    default:
      return { wsVerbosity: 3, ownVerbosity: "info" }
  }
}

if (require.main == module) {
  program.version(pkg.version)

  program
    .command("connect <key>")
    .description("Open and maintain a websocket proxy tunnel to Karmen cloud")
    .option(
      "-u, --url <serverUrl>",
      "Karmen websocket proxy server URL to use",
      "https://cloud.karmen.tech/connector/v1/"
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
      { wsVerbosity: 3, ownVerbosity: "info" }
    )
    .action((key, { url, forward, verbosity }) => {
      const { wsVerbosity, ownVerbosity } = verbosity

      const connectionBuilder = () =>
        openConnection({
          serverUrl: url,
          key,
          forward,
          verbosityLevel: wsVerbosity,
        })

      setupLoggers(ownVerbosity)

      logger.note(
        `Opening a websocket tunnel`,
        chalk.green(url),
        `-> OctoPrint box on`,
        chalk.green(forward),
        "using key",
        chalk.cyan(key),
        "as the connection key ..."
      )

      keepAlive(connectionBuilder)
    })

  program.parse(process.argv)
}
