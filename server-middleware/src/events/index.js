/*

  To standardize the format of messages that flow to the socket connection,
  I'm coercing events generated by various libraries which use their own
  event structure. In this case, Bull & Jsforce both emit events, which I
  will relay.

 */

const EventEmitter = require('events')

const jobEvents = new EventEmitter()

const logRelay = function(event, session, body) {
  console.log('\n')
  console.log(`Type: ${event}`)
  console.log(`To: ${session.socketRoom}`)
  console.log(`From: ${body.event.producer}`)
  console.log(`Job: ${body.event.job.name} (${body.event.job.id})`)
  if (body.event.message)
    console.log(`Message: ${body.event.message}`)
  if (body.data)
    console.log(`Data: ${body.data}`)
  console.log('\n')
}

const setListeners = function(emitter) {
  const eventsList = [ 'jobStarted', 'jobInfo', 'jobSuccess', 'jobError', 'serverError' ]
  for (const e of eventsList) {

    emitter.on(e, (params) => {

      const { job, producer, message, payload } = params,
            { session, ...rest } = job.data,

            jobInfo = {
              id: job.id,
              name: job.name,
              queue: job.queue.name,
              context: rest
            },
            relayBody = {
              event: {
                job: jobInfo,
                producer,
                message
              },
              data: payload
            };


      logRelay(e, session, relayBody)
      socket.to(session.socketRoom).emit(e, relayBody)

    })

  }
  return emitter
}

module.exports = setListeners(jobEvents)