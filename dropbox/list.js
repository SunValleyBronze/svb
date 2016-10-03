"use strict"

const path = require('path')
const rp = require('request-promise-native')

const common = require("./common");
const secrets = require('./secrets')


/**
 * Lists the files in a Dropbox folder.
 *
 * @param event.operation - 'list'
 * @param event.path - path to a Dropbox folder
 */
function list(event, context, callback) {

  const options = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secrets.DROPBOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    json: true,
    body: {
      path: event.path || event.folder,
      recursive: false
    }
  }

  rp(options)
    .then((results) => {
      callback(null, formatDropboxEntries(results.entries))
    })
    .catch((err) => {
      callback(err)
    })
}


/** Converts the entries returned by the Dropbox list_folder API to a tree of folders and files. */
function formatDropboxEntries(entries) {

  return entries
    .filter((entry) => entry['.tag'] === 'file')
    .map((entry) => ({
      id: entry.id,
      name: path.basename(entry.path_display, path.extname(entry.path_display)),
      type: path.extname(entry.path_display).toUpperCase(),
      path: 'https://s3.amazonaws.com/sunvalleybronze.com' + entry.path_lower,
      modified: entry.server_modified
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
}


module.exports = list
