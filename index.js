const { Socket } = require('net')
const { EventEmitter } = require('events')

const parseResponse = (response) => {
  const code = response.split(' ')[1]

  return code === '0'
}

class Client extends EventEmitter {
  constructor (host = 'localhost', port = 7356) {
    super()

    this.host = host
    this.port = port
    this.socket = new Socket()
  }

  async connect () {
    const { host, port } = this

    if (!this.socket.pending) {
      throw new Error('Already connected')
    }

    return new Promise((resolve) => {
      this.socket.connect({ host, port }, () => {
        this.emit('connected')
        resolve()
      })
    })
  }

  async sendCommand (cmd) {
    if (this.socket.pending) {
      throw new Error('Not connected')
    }

    return new Promise((resolve, reject) => {
      const onData = (data) => {
        this.socket.removeListener('error', onError)
        resolve(data.toString().trim())
      }

      const onError = (err) => {
        this.socket.removeListener('data', onData)
        reject(err)
      }

      this.socket.once('data', onData)
      this.socket.once('error', onError)
      this.socket.write(`${cmd}`)
    })
  }

  async setFrequency (mhz) {
    const freq = mhz * 1000000
    let response

    try {
      response = await this.sendCommand(`F ${freq}`)
    } catch (e) {
      throw new Error('Failed to set frequency')
    }

    return parseResponse(response)
  }

  async getFrequency () {
    let response

    try {
      response = await this.sendCommand('f')
    } catch (e) {
      throw new Error('Failed to get frequency')
    }

    return parseInt(response) / 1000000.0
  }

  async setMode (mode) {
    const presets = {
      AM: 10000,
      FM: 10000,
      WFM: 160000,
      WFM_ST: 160000,
      LSB: 2700,
      USB: 2700,
      CW: 500
    }

    if (!presets[mode]) {
      throw new Error('Invalid mode')
    }

    let response
    try {
      response = await this.setModeAndPassband(mode, presets[mode])
    } catch (e) {
      throw new Error('Failed to set mode')
    }

    return response
  }

  async setModeAndPassband (mode, passband) {
    let response

    try {
      response = await this.sendCommand(`M ${mode} ${passband}`)
    } catch (e) {
      throw new Error('Failed to set mode and passband')
    }

    return parseResponse(response)
  }

  async getModeAndPassband () {
    let response

    try {
      response = await this.sendCommand('m')
    } catch (e) {
      throw new Error('Failed to get mode and bandwidth')
    }

    const [mode, bandwidth] = response.split('\n')
    return {
      mode,
      bandwidth
    }
  }

  async getAvailableModes () {
    let response

    try {
      response = await this.sendCommand('M ?')
    } catch (e) {
      throw new Error('Failed to get available modes')
    }

    return response.split(' ')
  }

  async getSignalStrength () {
    let response

    try {
      response = await this.sendCommand('l STRENGTH')
    } catch (e) {
      throw new Error('Failed to get signal strength')
    }

    return parseFloat(response)
  }

  async getSquelch () {
    let response

    try {
      response = await this.sendCommand('l SQL')
    } catch (e) {
      throw new Error('Failed to get squelch')
    }

    return parseFloat(response)
  }

  async setSquelch (squelch) {
    let response

    try {
      response = await this.sendCommand(`L SQL ${squelch}`)
    } catch (e) {
      throw new Error('Failed to set squelch')
    }

    return parseResponse(response)
  }

  async getRecordingStatus () {
    let response

    try {
      response = await this.sendCommand('u RECORD')
    } catch (e) {
      throw new Error('Failed to get recording status')
    }

    return response
  }

  async setRecordingStatus (status) {
    let response

    try {
      response = await this.sendCommand(`U RECORD ${status}`)
    } catch (e) {
      throw new Error('Failed to set recording status')
    }

    return parseResponse(response)
  }

  async isRecording () {
    const result = await this.getRecordingStatus()

    return result === '1'
  }

  async startRecording () {
    return this.setRecordingStatus(1)
  }

  async stopRecording () {
    return this.setRecordingStatus(0)
  }

  async triggerAOS () {
    let response

    try {
      response = await this.sendCommand(`AOS`)
    } catch (e) {
      throw new Error('Failed to trigger AOS')
    }

    return parseResponse(response)
  }

  async triggerLOS () {
    let response

    try {
      response = await this.sendCommand(`LOS`)
    } catch (e) {
      throw new Error('Failed to trigger LOS')
    }

    return parseResponse(response)
  }

  async getVersion () {
    let response

    try {
      response = await this.sendCommand('_')
    } catch (e) {
      throw new Error('Failed to get version')
    }

    return response
  }

  async getLNB () {
    let response

    try {
      response = await this.sendCommand('LNB_LO')
    } catch (e) {
      throw new Error('Failed to get LNB')
    }

    return response
  }

  async setLNB (mhz) {
    let response
    const freq = mhz * 1000000

    try {
      response = await this.sendCommand(`LNB_LO ${freq}`)
    } catch (e) {
      throw new Error('Failed to get LNB')
    }

    return parseResponse(response)
  }

  async quit () {
    this.socket.write('q\n')
    this.socket.destroy()
  }
}

module.exports = Client
