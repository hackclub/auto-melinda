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
