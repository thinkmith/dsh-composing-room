/**
 * dsh-composing-room
 *
 * Registers one system-prompt section that is DISARMED by default and only
 * exists while the operator arms it. Three ways to arm:
 *   /room on          (in chat, this session)
 *   state.json edit   (any process; picked up by the file watcher)
 *   /room off         disarm and drop the section again
 *
 * The section text is read from a plain file, so the payload never lives in
 * this module and never appears in a config diff.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'composing-room'

/**
 * Services this row needs from the host.
 *
 * Cordis reads `inject` as a MAP of service name -> intercept config (or an
 * array of names). An object like `{ required: [...], optional: [...] }` is
 * NOT a declaration form: its keys become service names, the fiber waits for
 * services called "required"/"optional" that nobody provides, and `apply()`
 * never runs — no section, no command, no route, while the client half still
 * loads because the loader entry exists.
 */
export const inject = ['systemPrompt', 'commands']

const DEFAULT_HOME = path.join(os.homedir(), '.dsh', 'composing-room')

/** The payload shipped with this package, used to seed a fresh install. */
const BUNDLED_TEXT = fileURLToPath(new URL('../assets/prompt.default.txt', import.meta.url))

/**
 * Make sure the state directory holds a payload.
 *
 * A fresh install has no `prompt.txt`; without this the plugin would load,
 * the button would work, and every arm would fail with "the text file is
 * empty". The bundled copy is written once, then the operator owns the file.
 * @param target - absolute path the state points at.
 * @returns absolute path actually holding text (unchanged when seeding failed).
 */
function seedText(target) {
  if (readText(target).length > 0) return target
  const bundled = readText(BUNDLED_TEXT)
  if (bundled.length === 0) return target
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, bundled.endsWith('\n') ? bundled : `${bundled}\n`, 'utf8')
  } catch {
    // A read-only home still lets the operator point /room path elsewhere.
  }
  return target
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8').trim()
  } catch {
    return ''
  }
}

export function apply(ctx, config = {}) {
  const home = config.home || DEFAULT_HOME
  const resolve = (p, dflt) => (p ? (path.isAbsolute(p) ? p : path.join(home, p)) : path.join(home, dflt))
  const statePath = resolve(config.stateFile, 'state.json')
  const defaultText = resolve(config.textFile, 'prompt.txt')
  const sectionName = config.section || 'deployment:composing-room'
  const defaultOrder = Number.isFinite(config.order) ? config.order : 12000

  const armedByDefault = config.armed === true
  const state = () => {
    const raw = readJson(statePath, {})
    return {
      armed: typeof raw.armed === 'boolean' ? raw.armed : armedByDefault,
      textPath: typeof raw.textPath === 'string' && raw.textPath ? raw.textPath : defaultText,
      order: Number.isFinite(raw.order) ? raw.order : defaultOrder,
    }
  }
  const patchState = (next) => writeJson(statePath, { ...readJson(statePath, {}), ...next })

  // A fresh install has no payload file: put the bundled copy in place so the
  // switch works on the very first click, without a separate setup step.
  seedText(state().textPath)
  if (!fs.existsSync(statePath)) {
    const initial = state()
    patchState({ armed: initial.armed, order: initial.order, textPath: initial.textPath })
  }

  let disposeSection = null
  let signature = null

  function unmount() {
    if (disposeSection) {
      try {
        disposeSection()
      } catch {
        /* already disposed by scope teardown */
      }
      disposeSection = null
    }
  }

  /** Bring the live registration in line with the state file. */
  function sync(force) {
    const st = state()
    const text = st.armed ? readText(st.textPath) : ''
    const sig = `${st.armed}|${st.order}|${st.textPath}|${text.length}`
    if (!force && sig === signature) return { st, text, changed: false }
    signature = sig
    unmount()
    if (st.armed && text.length > 0) {
      disposeSection = ctx.effect(
        () => ctx.systemPrompt.section({ name: sectionName, order: st.order, text }),
        'composing-room.section',
      )
    }
    return { st, text, changed: true }
  }

  ctx.effect(() => {
    sync(true)
    const onFile = () => {
      try {
        sync(false)
      } catch (error) {
        ctx.logger?.warn?.('composing-room: sync failed: ' + error)
      }
    }
    fs.mkdirSync(home, { recursive: true })
    fs.watchFile(statePath, { interval: 800 }, onFile)
    return () => {
      fs.unwatchFile(statePath, onFile)
      unmount()
    }
  }, 'composing-room.lifecycle')

  const routeBase = config.route || '/api/composing-room'

  /** What the composer button draws: the effective state plus the raw flag. */
  function snapshot() {
    const st = state()
    const chars = readText(st.textPath).length
    return {
      armed: st.armed && chars > 0,
      armedFlag: st.armed,
      chars,
      order: st.order,
      section: sectionName,
      textPath: st.textPath,
    }
  }

  function send(res, code, body) {
    const payload = JSON.stringify(body)
    res.writeHead(code, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(payload),
    })
    res.end(payload)
  }

  function handle(req, res) {
    try {
      if (req.method === 'GET' || req.method === 'HEAD') return send(res, 200, snapshot())
      if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' })

      const url = new URL(req.url, 'http://127.0.0.1')
      const action = (url.searchParams.get('action') || 'toggle').toLowerCase()
      const st = state()
      let armed
      if (action === 'on') armed = true
      else if (action === 'off') armed = false
      else if (action === 'toggle') armed = !st.armed
      else return send(res, 400, { error: `unknown action ${action}` })

      patchState({ armed })
      sync(true)
      return send(res, 200, snapshot())
    } catch (error) {
      return send(res, 500, { error: String(error) })
    }
  }

  // Register through ctx.inject so the route is installed whenever the
  // webServer service actually exists, not only when it happened to be ready
  // at apply() time.
  const installRoute = (webCtx) => {
    webCtx.effect(() => {
      try {
        return webCtx.webServer.register({ kind: 'exact', path: routeBase, handler: handle })
      } catch (error) {
        ctx.logger?.warn?.(`composing-room: ${routeBase} not registered: ${String(error)}`)
        return () => {}
      }
    }, 'composing-room.route')
  }
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], installRoute)
  else if (ctx.webServer) installRoute(ctx)

  try {
    ctx.commands.register({
    definitionId: 'dsh-composing-room',
    name: 'room',
    description: '排版台：手动开/关当前会话的排版参考页上下文（默认关闭）',
    input: { hint: '[on|off|reload|path <file>]', attachments: false },
    handler: (invocation) => {
      const raw = String(invocation?.rawInput ?? '').trim()
      const [verb, ...rest] = raw.split(/\s+/u)
      const arg = rest.join(' ').trim()
      try {
        switch ((verb || '').toLowerCase()) {
          case 'on': {
            patchState({ armed: true })
            const r = sync(true)
            return r.text.length > 0
              ? { kind: 'success', text: `排版台已开（${r.text.length} 字符，order ${r.st.order}）。这一轮起生效。` }
              : { kind: 'error', text: `已置为开启，但文本文件是空的：${r.st.textPath}` }
          }
          case 'off': {
            patchState({ armed: false })
            sync(true)
            return { kind: 'success', text: '排版台已关，段已撤下。' }
          }
          case 'path': {
            if (!arg) return { kind: 'error', text: `当前文本文件：${state().textPath}` }
            patchState({ textPath: path.isAbsolute(arg) ? arg : path.join(home, arg) })
            const r = sync(true)
            return { kind: 'success', text: `文本文件改为 ${r.st.textPath}（${r.text.length} 字符）` }
          }
          case 'reload':
          case '': {
            const r = sync(true)
            const lines = [
              `状态：${r.st.armed ? '已开' : '已关'}`,
              `文本：${r.st.textPath}（${readText(r.st.textPath).length} 字符）`,
              `段名：${sectionName}，order ${r.st.order}`,
              '开关：/room on | /room off | /room reload | /room path <file>',
            ]
            return { kind: 'success', text: lines.join('\n') }
          }
          default:
            return { kind: 'error', text: '用法：/room [on|off|reload|path <file>]' }
        }
      } catch (error) {
        return { kind: 'error', text: '排版台操作失败：' + String(error) }
      }
    },
  })
  } catch (error) {
    ctx.logger?.warn?.(`composing-room: /room not registered: ${String(error)}`)
  }
}
