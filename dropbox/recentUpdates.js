"use strict"

const path = require('path')
const rp = require('request-promise-native')

const secrets = require('./secrets')


/**
 * Gets recent updates to files in a Dropbox path.
 *
 * @param event.operation - 'recentUpdates'
 * @param event.path - path to a Dropbox folder
 * @param event.count - optional number of entries to return
 */
function recentUpdates(event, context, callback) {

  const options = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secrets.DROPBOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    json: true,
    body: {
      path: event.path,
      recursive: true
    }
  }

  rp(options)
    .then((results) => {
      callback(null, formatDropboxEntries(results.entries, event.count || 0))
    })
    .catch((err) => {
      callback(err)
    })
}


/** Converts the entries returned by the Dropbox list_folder API to list of recent updates. */
function formatDropboxEntries(entries, count) {

  count = count || entries.length
  return entries
    .filter((entry) => entry['.tag'] === 'file')
    .map((entry) => ({
      id: entry.id,
      name: path.basename(entry.path_display, path.extname(entry.path_display)),
      type: path.extname(entry.path_display).toUpperCase(),
      path: 'https://s3.amazonaws.com/sunvalleybronze.com' + entry.path_lower,
      modified: entry.server_modified
    }))
    .sort((a, b) => {
      const da = new Date(a.modified)
      const db = new Date(b.modified)
      return (da<db) - (da>db)
    })
    .slice(0, count)
}


module.exports = recentUpdates
