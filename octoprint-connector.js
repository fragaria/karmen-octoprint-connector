#!/usr/bin/env node
"use strict"

const WebSockProxyClient = require("karmen_ws/client/client")
    .WebSockProxyClient,
  cuid = require("cuid"),
  consola = require("consola"),
  colors = require('colors')
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
          `Websocket tunnel`, colors.green(serverUrl), `-> OctoPrint box on`, colors.green(forwardTo), `has been opened.`
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
    .option("-p, --port <localPort>", "Local port to proxy", 80)
    .action((key, options) => {
      openConnection(options.url, key, options.port)
    })

  program.parse(process.argv)
}
