// Unit test for the browser half: module shape + slot registration.
let captured
globalThis.window = {
  __ModuleLoader__: {
    load: (def) => {
      captured = def
    },
  },
}

const react = {
  createElement: (...args) => ({ type: 'element', args }),
  useState: (v) => [v, () => {}],
  useEffect: () => {},
}

await import('../lib/client.js')

if (!captured) throw new Error('client.js did not call __ModuleLoader__.load')
console.log('module id:', captured.id)

const mod = captured.factory((name) => {
  if (name === 'react') return react
  throw new Error('unexpected require: ' + name)
})

console.log('exports:', Object.keys(mod).join(','))
console.log('inject:', mod.inject.join(','))

const registrations = []
const ctx = {
  slots: {
    inject: (name, run) => {
      registrations.push({ slot: name, phase: 'inject' })
      run()
    },
    register: (options, component) => {
      registrations.push({ slot: options.name, id: options.id, order: options.order, component: typeof component })
      return () => {}
    },
  },
}

mod.apply(ctx)
console.log('registrations:', JSON.stringify(registrations, null, 0))

const button = mod.RoomButton()
console.log('button element:', button?.type, '| children:', button?.args?.[1]?.length)

if (registrations.some((r) => r.slot === 'conversation.input.right' && r.id === 'composing-room')) {
  console.log('OK: registered into conversation.input.right as composing-room')
} else {
  console.log('FAIL: slot registration missing')
}
process.exit(0)
