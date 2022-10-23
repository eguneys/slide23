import { Vec2 } from './vec2'
import { Mouse } from './mouse'
import { loop } from './debug'

export type EventPosition = Vec2

export type DragEvent = {
  e: EventPosition, 
  _right: boolean,
  m?: EventPosition
}

export type Hooks = {
  on_hover?: (e: EventPosition) => void,
  on_up?: (e: EventPosition, right: boolean) => void,
  on_click?: (e: EventPosition, right: boolean) => void,
  on_drag?: (d: DragEvent, d0?: DragEvent) => void,
  on_context?: () => void
}

export const make_drag = (hooks: Hooks, $_: HTMLElement) => {

  let { 
    on_hover,
    on_up,
    on_click,
    on_drag,
    on_context
  } = hooks

  let _drag: DragEvent | undefined
  let _drag0: DragEvent | undefined
  let _m: EventPosition | undefined
  let _cancel_raf: (() => void) | undefined

  const clone_drag = (_: DragEvent | undefined) => {
    return _ && { ..._ }
  }

  return Mouse.init({
    ...(on_context ?  {
      _onContextMenu() {
        on_context?.()
      }
    }: {}),
    _onDragStart(e, _right) {

      _drag0 = clone_drag(_drag)
      _drag = { e, _right }
      if (_cancel_raf) {
        _cancel_raf?.() 
      }
      _cancel_raf = loop((dt: number) => {
        if (_drag) {
          if (_drag.m || (_m && _drag.e.distance(_m) > 3)) { _drag.m = _m; }
          on_drag?.(_drag, _drag0)
          _drag0 = clone_drag(_drag)
        } else {
          _cancel_raf?.()
        }
      })
    },
    _onDragMove(e) { 
      _m = e
      if (!_drag) {
        on_hover?.(e)
      }
    },
    _onDragEnd() { 
      if (!_drag) {
        return
      }
      if (!_drag.m) {
        on_click?.(_drag.e, _drag._right) 
      }
      on_up?.(_drag.m || _drag.e, _drag._right)
      _cancel_raf?.() 
      _cancel_raf = undefined
      _drag = undefined
      _m = undefined
    }
  }, $_)
}
