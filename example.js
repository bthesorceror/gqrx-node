const GQRX = require('./index')

async function main () {
  const client = new GQRX()
  await client.connect()

  const version = await client.getVersion()
  console.info(version)

  client.quit()
}

main().then(() => {
  console.info('DONE')
}).catch((e) => {
  console.error(e)
})
