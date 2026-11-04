import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply, inject, name } from '../lib/index.js'

const home = path.join(os.tmpdir(), 'composing-room-stub-' + process.pid)
fs.rmSync(home, { recursive: true, force: true })
fs.mkdirSync(home, { recursive: true })
fs.copyFileSync(new URL('../prompt.txt', import.meta.url), path.join(home, 'prompt.txt'))
fs.writeFileSync(path.join(home, 'state.json'), JSON.stringify({ armed: false }), 'utf8')

let active = []
let everRegistered = 0
const cmds = []
const ctx = {
  effect(fn) {
    const d = fn()
    return () => {
      if (typeof d === 'function') d()
    }
  },
  systemPrompt: {
    section({ name, order, text }) {
      everRegistered += 1
      const entry = { name, order, len: text.length }
      active.push(entry)
      return () => {
        active = active.filter((e) => e !== entry)
      }
    },
  },
  commands: { register: (def) => cmds.push(def) },
  logger: { warn: (m) => console.warn('[warn]', m) },
}

const lifecycle = apply(ctx, { home })

const say = (label) => console.log(label, '| active:', active.length, '| ever:', everRegistered, active.map((a) => `${a.name}@${a.order}:${a.len}`).join(','))
const call = (raw) => cmds[0].handler({ rawInput: raw, attachments: [] })

const injectText = Array.isArray(inject) ? inject.join(',') : JSON.stringify(inject)
console.log('plugin name:', name, '| inject:', injectText)
say('after apply (state disarmed)')

console.log('cmd on ->', JSON.stringify(call('on')).slice(0, 120))
say('after /room on')

console.log('cmd off ->', JSON.stringify(call('off')).slice(0, 120))
say('after /room off')

console.log('cmd reload ->', JSON.stringify(call('')).slice(0, 200))

// external trigger: write the state file, the watcher should arm it
fs.writeFileSync(path.join(home, 'state.json'), JSON.stringify({ armed: true }), 'utf8')
await new Promise((r) => setTimeout(r, 1600))
say('after external state.json arm')

fs.writeFileSync(path.join(home, 'state.json'), JSON.stringify({ armed: false }), 'utf8')
await new Promise((r) => setTimeout(r, 1600))
say('after external state.json disarm')

// lifecycle()
say('after lifecycle dispose')
fs.rmSync(home, { recursive: true, force: true })
process.exit(0)
