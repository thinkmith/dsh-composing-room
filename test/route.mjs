// Unit test for the host half: the HTTP route the composer button calls.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

const home = path.join(os.tmpdir(), 'composing-room-route-' + process.pid)
fs.rmSync(home, { recursive: true, force: true })
fs.mkdirSync(home, { recursive: true })
fs.copyFileSync(new URL('../prompt.txt', import.meta.url), path.join(home, 'prompt.txt'))
fs.writeFileSync(path.join(home, 'state.json'), JSON.stringify({ armed: true, order: 12000 }), 'utf8')

const sections = []
let route
const ctx = {
  effect: (fn) => {
    const d = fn()
    return () => {
      if (typeof d === 'function') d()
    }
  },
  systemPrompt: {
    section: (o) => {
      sections.push(o)
      return () => {
        const i = sections.indexOf(o)
        if (i >= 0) sections.splice(i, 1)
      }
    },
  },
  commands: { register: () => {} },
  webServer: {
    register: (r) => {
      route = r
      return () => {
        route = undefined
      }
    },
  },
  logger: { warn: console.warn },
}

apply(ctx, { home })

if (!route) throw new Error('no route registered')
console.log('route:', route.kind, route.path, '| section chars:', sections[0]?.text.length)

function call(method, url) {
  let status
  let body
  const req = { method, url }
  const res = {
    writeHead: (code) => {
      status = code
    },
    end: (payload) => {
      body = payload
    },
  }
  route.handler(req, res)
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    parsed = body
  }
  return { status, body: parsed }
}

const g = call('GET', '/api/composing-room')
console.log('GET  ->', g.status, JSON.stringify(g.body))

const off = call('POST', '/api/composing-room?action=off')
const offSections = sections.length
console.log('POST off  ->', off.status, 'armed=', off.body.armed, 'sections=', offSections)

const on = call('POST', '/api/composing-room?action=on')
const onSections = sections.length
console.log('POST on   ->', on.status, 'armed=', on.body.armed, 'sections=', onSections)

const tg = call('POST', '/api/composing-room')
console.log('POST toggle ->', tg.status, 'armed=', tg.body.armed, 'sections=', sections.length)

const bad = call('POST', '/api/composing-room?action=nope')
console.log('POST bad  ->', bad.status, JSON.stringify(bad.body))

const m = call('PUT', '/api/composing-room')
console.log('PUT  ->', m.status, JSON.stringify(m.body))

const ok =
  g.status === 200 &&
  g.body.chars === 7407 &&
  off.body.armed === false &&
  offSections === 0 &&
  on.body.armed === true &&
  onSections === 1 &&
  tg.body.armed === false &&
  bad.status === 400 &&
  m.status === 405
console.log(ok ? 'OK: route + section stay in step' : 'FAIL: see values above')

fs.rmSync(home, { recursive: true, force: true })
process.exit(0)
