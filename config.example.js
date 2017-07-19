module.exports = {
  // GitHub webhook secret, generate with:
  // ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
  secret: '1bd538bf6564182d2cf9f2624d05a4f14ec23a1d',

  // port the server is running on
  port: 3333,

  // where the deploy uri can be found
  path: '/'
}
