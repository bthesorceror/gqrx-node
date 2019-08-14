const GQRX = require('../index')

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 1000)
  })
}

const channels = [
  { freq: 851.872, mode: 'FM' },
  { freq: 852.022, mode: 'FM' },
  { freq: 852.225, mode: 'FM' },
  { freq: 145.288, mode: 'FM' }
]

async function main () {
  const client = new GQRX()
  await client.connect()

  let index = 0

  client.setFrequency(channels[index].freq)
  client.setMode(channels[index].mode)

  while (true) {
    const squelch = await client.getSquelch()
    const strength = await client.getSignalStrength()

    if (squelch < strength) {
      await sleep(15)
    } else {
      index = (index + 1) % channels.length
      await client.setFrequency(channels[index].freq)
      await client.setMode(channels[index].mode)
    }
  }
}

main().catch((e) => {
  console.error(e)
})
