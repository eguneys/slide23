import { Vec2 } from './vec2'  

export class Ref {


  static make = (element: HTMLElement) => {
    return new Ref(element)
  }

  $clear_bounds() {
    this._bounds = undefined
  }

  _bounds: ClientRect | undefined

  get bounds() {
    if (!this._bounds) {
      this._bounds = this.$_.getBoundingClientRect()
    }
    return this._bounds!
  }

  get size() {
    let { bounds } = this
    return Vec2.make(bounds.width, bounds.height)
  }

  get orig() {
    let { bounds } = this
    return Vec2.make(bounds.x, bounds.y)
  }


  get_normal_at_abs_pos(v: Vec2) {
    let { orig, size } = this

    return v.sub(orig).div(size)
  }

  constructor(readonly $_: HTMLElement) {
  }
}


export const onScrollHandlers = (on_scroll: () => void) => {
  document.addEventListener('scroll', on_scroll, { capture: true, passive: true })
  window.addEventListener('resize', on_scroll, { passive: true })
}
