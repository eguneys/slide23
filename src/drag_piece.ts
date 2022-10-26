import { ticks } from './shared'
import { Vec2 } from './vec2'
import { Ref, onScrollHandlers } from './ref'
import { make_drag } from './drag'
import { Tween } from './anim'
import { Shake2 } from './shake'

export type DragHooks = {
  on_test_move_: (dir: Vec2) => boolean,
  on_test_drag: (v: Vec2) => boolean,
  on_move: (x: number, y: number) => void,
  on_shake: (s: Shake2) => void,
  on_begin: (_type: DragStateType, o: Vec2) => void,
  on_end: () => void,
  on_pass: () => void
}



export type DragStateType = 'begin' | 'slide-pass' | 'slide-fail' | 'slide-test' | 'slide'

abstract class DragState {

  get _is_down() {
    return this.drag_piece._is_down
  }

  get hooks() {
    return this.drag_piece.hooks
  }
  _next_state: DragState| undefined = this

  constructor(readonly drag_piece: DragPiece,
              readonly o: Vec2) { }

  init() {
    this.hooks.on_begin(this._type, this.o)
    this._init()
    return this
  }

  abstract _type: DragStateType
  _init() { }
  _drag_end() {}
  _drag_move(o: Vec2) {}
  _update(dt: number) { }

}

class DragSlidePass extends DragState {

  get _drag_begin() {
    return this._drag_test._drag_begin
  }

  _type: DragStateType = 'slide-pass'
  constructor(readonly _drag_test: DragSlideTest) {
    super(_drag_test.drag_piece,
          _drag_test.o)
  }

  _tween!: Tween

  _init() {
    this._tween = Tween.make([0.3, 0.8, 1, 1], ticks.five)
  }


  _update(dt: number) {
    this._tween.update(dt)

    if (!this._tween.completed) {
      let x = 100 * Math.sign(this._drag_begin._h) * this._tween.value,
        y = 100 * Math.sign(this._drag_begin._v) * this._tween.value

      x = Math.max(-100, Math.min(100, x))
      y = Math.max(-100, Math.min(100, y))
      this.hooks.on_move(x, y)
    } else {
      this.hooks.on_pass()
      if (this._is_down) {
        this._next_state = new DragSlideTest(this._drag_begin).init()
      } else {
        this._next_state = undefined
      }
    }
  }
}

class DragSlideFail extends DragState {

  get _drag_begin() {
    return this._drag_test._drag_begin
  }

  _type: DragStateType = 'slide-fail'
  constructor(readonly _drag_test: DragSlideTest) {
    super(_drag_test.drag_piece,
          _drag_test.o)
  }

  _shake!: Shake2
  _tween!: Tween

  _init() {
    this._shake = new Shake2(3, 1, Vec2.left, ticks.sixth)
    this._tween = Tween.make([1, 1, 0], ticks.sixth)
  }

  _update(dt: number) {
    this._shake._update(dt)
    this._tween.update(dt)

    if (!this._shake.completed) {
      this.hooks.on_shake(this._shake)
    }

    if (!this._tween.completed) {

      let x = this._drag_begin._h * this._tween.value,
        y = this._drag_begin._v * this._tween.value


      x = Math.max(-30, Math.min(30, x))
      y = Math.max(-30, Math.min(30, y))


      this.hooks.on_move(x, y)
    } else {
      this._next_state = undefined
    }
  }

}

class DragSlideTest extends DragState {
  

  _drag_end() {}

  _type: DragStateType = 'slide-test'
  constructor(readonly _drag_begin: DragBegin) {
    super(_drag_begin.drag_piece,
          _drag_begin.o)
  }

  _tween!: Tween

  _init() {
    this._tween = Tween.make([0, 1], ticks.five)
  }

  _update(dt: number) {
    this._tween.update(dt)

    let x = this._drag_begin._h * this._tween.value,
      y = this._drag_begin._v * this._tween.value


    x = Math.max(-30, Math.min(30, x))
    y = Math.max(-30, Math.min(30, y))
 
    this.hooks.on_move(x, y)
    if (this._tween.completed) {
      let res = this.hooks.on_test_move_(
        Vec2.make(this._drag_begin._h,
                  this._drag_begin._v).sign)
      if (!res) {
        this._next_state = new DragSlideFail(this).init()
      } else {
        this._next_state = new DragSlidePass(this).init()
      }
    }
  }

}

class DragBegin extends DragState {

  _v!: number
  _h!: number
  _type: DragStateType = 'begin'

  _shake: Shake2 | undefined
  _drag_move(o: Vec2) {
    let _ = this.o.sub(o)
    let h = _.dot(Vec2.left)
    let v = _.dot(Vec2.up)
    let _h = Math.abs(h),
      _v = Math.abs(v)


    if (_h > _v) {
      if (!this._shake) {
        this._shake = new Shake2(1, 1, Vec2.left.scale(2 * Math.sign(h)), ticks.three)
      }
      this._h = h
      this._v = 0
    } else {
      if (!this._shake) {
        this._shake = new Shake2(1, 1, Vec2.up.scale(2 * Math.sign(v)), ticks.three)
      }
      this._v = v
      this._h = 0
    }
  }

  _update(dt: number) {
    if (this._shake) {
      this._shake._update(dt)

      if (this._shake.completed) {
        this._next_state = new DragSlideTest(this).init()
      }

      this.hooks.on_shake(this._shake)
    }
  }
}

let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1)
let v_off = Vec2.make(540, 740).sub(Vec2.make(500, 500))

export class DragPiece {


  _is_down: boolean
  _state: DragState | undefined

  constructor(readonly element: HTMLElement,
              readonly hooks: DragHooks) {

    let ref = Ref.make(element)
    onScrollHandlers(() => {
      ref.$clear_bounds()
    })

    this._is_down = false

    let _self = this

    make_drag({
      on_context() {},
      on_drag(e, e0) {
        if (e.m) {
          _self._is_down = true
          let _o = ref.get_normal_at_abs_pos(e.e).mul(v_world).sub(v_off)
          let o = ref.get_normal_at_abs_pos(e.m).mul(v_world).sub(v_off)

          if (!_self._state) {
            let v = o.scale(1/100).floor
            if (hooks.on_test_drag(v)) {
              _self._state = new DragBegin(_self, _o).init()
            }
          } else {
            _self._state._drag_move(o)
          }
        }
      },
      on_up() {
        _self._is_down = false
      }
    }, element)
  }


  _update(dt: number) {
    if (this._state) {
      this._state._update(dt)
      this._state = this._state._next_state
      if (!this._state) {
        this.hooks.on_end()
      }
    }
  }
}
