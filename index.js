const fetch = require('node-fetch')

async function sendMessage({text, ts}) {
  const token = process.env.SLACK_TOKEN
  const channel = 'GNTFDNEF8'
  const result = await (await fetch(`http://slack.com/api/chat.postMessage?token=${token}&channel=${channel}&text=${text}&thread_ts=${ts}`, {
    method: "POST"
  })).json()
}

async function getMissions(opts) {
  const options = {
    authToken: process.env.AIRTABLE_TOKEN,
    ...opts
  }
  const results = await (await fetch(`https://api2.hackclub.com/v0.1/Operations/Mail Missions?select=${JSON.stringify(options)}`)).json()
  return results
}

async function acceptAll() {
  const missionTypes = "Sticker Box,Sticker Envelope,Hack Pack Envelope".split(',')
  const filterByFormula = `AND({Status}='1 Unassigned',OR(${missionTypes.map(m=>`{Scenario Name}="${m}"`).join(',')}))`
  const missionTSs = (await getMissions({filterByFormula})).map(obj => obj.fields['Mail Team Thread Timestamp'])
  console.log(`Accepting ${missionTSs.length} missions`)

  missionTSs.forEach(async (ts, i) => {
    await new Promise(resolve => {setTimeout(resolve, 10000 * i)})
    await sendMessage({ts, text: '<@UNRAW3K7F> accept'})
    console.log(`Accept ${i+1}: https://hackclub.slack.com/archives/GNTFDNEF8/p${ts.replace('.','')}`)
  })
}

async function purchaseAll() {
  const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}='false',NOT({Valid Names}=BLANK()),{Address First Line Too Long}='false')`
  const missionTSs = (await getMissions({filterByFormula})).map(obj => obj.fields['Mail Team Thread Timestamp'])
  console.log(`Purchasing ${missionTSs.length} missions`)

  missionTSs.forEach(async (ts, i) => {
    await new Promise(resolve => {setTimeout(resolve, 10000 * i)})
    await sendMessage({ts, text: '<@UNRAW3K7F> purchase'})
    console.log(`Purchase ${i+1}: https://hackclub.slack.com/archives/GNTFDNEF8/p${ts.replace('.','')}`)
  })
}

async function requestAll() {
  const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}='true',{Address Status Escaped}='true')`
  const missionTSs = (await getMissions({filterByFormula})).map(obj => obj.fields['Mail Team Thread Timestamp'])
  console.log(`Requesting ${missionTSs.length} missions`)

  missionTSs.forEach(async (ts, i) => {
    await new Promise(resolve => {setTimeout(resolve, 10000 * i)})
    await sendMessage({ts, text: '<@UNRAW3K7F> request'})
    console.log(`Request ${i+1}: https://hackclub.slack.com/archives/GNTFDNEF8/p${ts.replace('.','')}`)
  })
}

acceptAll()
purchaseAll()
requestAll()