#!/usr/bin/env node
"use strict"

const WebSockProxyClient = require("karmen_ws/client/client")
    .WebSockProxyClient,
  cuid = require("cuid"),
  consola = require("consola")
const { program } = require("commander")
const pkg = require("./package")

function generateKey() {
  const token = cuid()
  return `octoprint/${token}`
}

function openConnection(serverUrl, key, localPort = 80) {
  const wsProxy = new WebSockProxyClient(key)

  return new Promise((resolve, reject) => {
    const forwardTo = `http://localhost:${localPort}`
    const connection = wsProxy.connect(serverUrl, { forwardTo })

    connection
      .on("error", function(err) {
        consola.error(
          `An error occurred while connecting to ${serverUrl}. Is it running?`,
          err
        )
      })
      .on("open", function() {
        consola.success(
          `Websocket tunnel ${serverUrl} -> OctoPrint box on ${forwardTo} has been opened.`
        )
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

if (require.main == module) {
  program.version(pkg.version)

  program
    .command("generate-key")
    .description("Generate a new token for linking with Karmen.")
    .action(() => {
      consola.log(`Your Karmen connection key is: ${generateKey()}`)
    })

  program
    .command("connect <key>")
    .description("Open the websocket proxy tunnel to Karmen")
    .option(
      "-u, --url <serverUrl>",
      "Karmen websocket proxy server URL to use",
      "https://cloud.karmen.tech"
    )
    .option("-p, --port <localPort>", "Local port to proxy", 80)
    .action((key, options) => {
      openConnection(options.url, key, options.port)
    })

  program.parse(process.argv)
}
