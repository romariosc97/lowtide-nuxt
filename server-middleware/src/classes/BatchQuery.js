module.exports = class {

  constructor(connection, job, endpoint, queryList, batchSize = 10, sleepMs = 1000) {
    this.connection = connection
    this.endpoint = endpoint
    this.queryList = queryList
    this.batchSize = batchSize
    this.sleepFor = sleepMs
    this.queryResults = []
  }

  async singleQuery(q) {
    try {
      const { context, query } = q
      const result = await this.connection.requestPost(this.endpoint, query)
      return { ...context, queryResult: result }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async execute() {

    let sleep = () => new Promise(resolve => setTimeout(resolve, this.sleepFor))

    const batchedList = this.queryList.reduce((temp, x, i) => {
      const subIndex = Math.floor(i / this.batchSize)
      if(!temp[subIndex])
        temp[subIndex] = []
      temp[subIndex].push(x)
      return temp
    }, [])

    for (const [index, batch] of batchedList.entries()) {
      const batchResult = await Promise.allSettled(batch.map(q => this.singleQuery(q)))
      this.queryResults.push(batchResult)

      /* SEND MESSAGE TO SOCKET HERE!!! */
      jobs.emit('jobInfo', { job, producer: 'lowtide.batchQuery', message: this.queryResults })

      await sleep()
    }

  }

  get results() {
    return this.queryResults.flat()
  }

}
