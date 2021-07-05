const fetch = require('node-fetch')
require('dotenv').config()

const MAILDOG = 'URZHZS3L6'
const POSTMASTER = 'UNRAW3K7F'
const MAILTEAM = 'GNTFDNEF8'

async function sendMessage({text, ts}) {
  const token = process.env.SLACK_TOKEN
  try {
    const result = await (await fetch(`http://slack.com/api/chat.postMessage?token=${token}&channel=${MAILTEAM}&text=${text}&thread_ts=${ts}`, {
      method: "POST"
    })).json()
  } catch (e) {
    console.error(e)
  }
}

async function getMissions(opts) {
  const results = await (await fetch(`https://api2.hackclub.com/v0.1/Operations/Mail Missions?authKey=${process.env.AIRTABLE_TOKEN}&select=${JSON.stringify(opts)}`)).json()
  return results
}

async function forEachInFilter(filterByFormula, sleepTime = 100, cb) {
  const missionTSs = await (await getMissions({filterByFormula})).map(obj => obj.fields['Mail Team Thread Timestamp'])
  if (missionTSs.length == 0) {
    console.log('     ...no missions found.')
    return
  }

  await missionTSs.reduce(async (acc, ts, i, missions) => {
    await acc
    await cb(ts, i, missions)
    await new Promise(resolve => setTimeout(resolve, sleepTime))
  }, undefined)
}

async function requestAll(sleepTime = 30000) {
  console.log('Looking for missions to request...')
  const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}='true',{Address Status Escaped}='true')`

  await forEachInFilter(filterByFormula, sleepTime, async (ts, i, missions) => {
    console.log(`Requesting ${i+1}/${missions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    await sendMessage({ts, text: `<@${MAILDOG}> request`})
  })
}

async function run() {
  await new Promise(resolve => setTimeout(resolve, 5000))
  await requestAll()
}

run()
