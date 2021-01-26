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

async function dedupeAll() {
  console.log('Looking for missions to dedupe...')
  const missionTypes = "GCH Stickers,Sticker Box,Sticker Envelope,Hack Pack Envelope".split(',')
  const filterByFormula = `AND({Status}='1 Unassigned',{Dropped}=FALSE(),OR(${missionTypes.map(m=>`{Scenario Name}="${m}"`).join(',')}))`
  const firstTimeSending = {}
  const duplicateMissions = await (await getMissions({filterByFormula})).filter(mission => {
    if (firstTimeSending[mission.fields['Receiving Person']] == true) {
      return true
    } else {
      firstTimeSending[mission.fields['Receiving Person']] = true
      return false
    }
  })

  let i = 0
  for (const mission of duplicateMissions) {
    const ts = mission.fields['Mail Team Thread Timestamp']
    console.log(`Deduping ${i+1}/${duplicateMissions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    i++
    await sendMessage({ts, text: `This is a duplicate mission`})
    await sendMessage({ts, text: `<@${MAILDOG}> drop`})
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function acceptAll() {
  console.log('Looking for missions to accept...')
  const missionTypes = "GCH Stickers,Sticker Box,Sticker Envelope,Hack Pack Envelope".split(',')
  const filterByFormula = `AND({Status}='1 Unassigned',{Dropped}=FALSE(),OR(${missionTypes.map(m=>`{Scenario Name}="${m}"`).join(',')}))`

  await forEachInFilter(filterByFormula, 100, async (ts, i, missions) => {
    console.log(`Accepting ${i+1}/${missions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    await sendMessage({ts, text: `<@${MAILDOG}> accept`})
  })
}

async function purchaseAll() {
  console.log('Looking for missions to purchase...')
  //const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}=FALSE(),NOT({Valid Names}=BLANK()),{Address Too Long}=FALSE())`
  const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}=FALSE(),{Address Too Long}=FALSE())`

  await forEachInFilter(filterByFormula, 60000, async (ts, i, missions) => {
    console.log(`Purchasing ${i+1}/${missions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    await sendMessage({ts, text: `<@${POSTMASTER}> purchase`})
  })
}

async function leapAll() {
  console.log('Looking for LEAP missions to purchase...')
  const filterByFormula = `AND({Status}='2 Assigned',{Scenario Name}='Orpheus Leap',{Sender}='roshan_palakkal_508_22')`

  await forEachInFilter(filterByFormula, 60000, async (ts, i, missions) => {
    console.log(`Purchasing LEAP mission ${i+1}/${missions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    await sendMessage({ts, text: `<@${POSTMASTER}> purchase`})
  })
}

async function requestAll() {
  console.log('Looking for missions to request...')
  const filterByFormula = `AND({Status}='2 Assigned',{Sender}='melinda_lawson_1996_16',{Address Missing Fields}='true',{Address Status Escaped}='true')`

  await forEachInFilter(filterByFormula, 30000, async (ts, i, missions) => {
    console.log(`Requesting ${i+1}/${missions.length}: https://hackclub.slack.com/archives/${MAILTEAM}/p${ts.replace('.','')}`)
    await sendMessage({ts, text: `<@${MAILDOG}> request`})
  })
}

async function run() {
  await dedupeAll()
  await new Promise(resolve => setTimeout(resolve, 5000))
  await acceptAll()
  await new Promise(resolve => setTimeout(resolve, 5000))
  await purchaseAll()
  await new Promise(resolve => setTimeout(resolve, 5000))
  // await requestAll()
  //await new Promise(resolve => setTimeout(resolve, 5000))
  //await leapAll()
}

run()
