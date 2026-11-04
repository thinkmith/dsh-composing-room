/**
 * First-run test: a brand-new install has neither state.json nor prompt.txt.
 * apply() must seed the bundled payload so the button works on click one.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../lib/index.js'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'composing-room-first-'))
const sections = []
let dispose = null

const ctx = {
  logger: { warn: (m) => console.log('warn:', m) },
  effect(fn) {
    const d = fn()
    return () => {
      if (typeof d === 'function') d()
    }
  },
  inject(names, run) {
    if (this.webServer) run(this)
  },
  systemPrompt: {
    section(def) {
      sections.push(`${def.name}@${def.order}:${def.text.length}`)
      dispose = () => sections.splice(0)
      return dispose
    },
  },
  commands: { register: () => {} },
}

apply(ctx, { home })

const st = JSON.parse(fs.readFileSync(path.join(home, 'state.json'), 'utf8').toString() || '{}')
const textPath = path.join(home, 'prompt.txt')
const text = fs.existsSync(textPath) ? fs.readFileSync(textPath, 'utf8') : ''

console.log('home:', home)
console.log('prompt.txt exists:', fs.existsSync(textPath))
console.log('prompt.txt chars:', text.trim().length)
console.log('state.json:', JSON.stringify(st))
console.log('sections after apply (armed default true):', sections.length)
console.log(text.trim().length === 7407 ? 'OK: bundled payload seeded on first run' : 'FAIL: payload missing')

// apply() installs a watchFile handle; nothing else is pending, so end here.
process.exit(0)
