import { Batcher, Camera } from './webgl'
import { Vec3 } from './webgl/math4'
import { Vec2, Rectangle } from './vec2'
import { make_drag } from './drag'
import { Ref } from './ref'
import { DragStateType, DragPiece } from './drag_piece'
import { Grid, Body } from './grid'
import { GridBuilder } from './builder'
import { Shake2 } from './shake'


let v_off = Vec2.make(540, 740).sub(Vec2.make(500, 500))

export type RNG = () => number

/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
    return () => {
          var x = Math.sin(seed++) * 10000;
              return x - Math.floor(x);
                }
}
const random = make_random()

let v_screen = Vec2.make(1080, 1920)

function rnd_angle(rng: RNG = random) {
    return rng() * Math.PI * 2
}

function rnd_vec_h(rng: RNG = random) {
    return Vec2.make(rnd_h(rng), rnd_h(rng))
}

function rnd_vec(mv: Vec2 = Vec2.unit, rng: RNG = random) {
    return Vec2.make(rng(), rng()).mul(mv)
}

function rnd_h(rng: RNG = random) {
    return rng() * 2 - 1
}

function rnd_int_h(max: number, rng: RNG = random) {
    return rnd_h(rng) * max
}

function rnd_int(max: number, rng: RNG = random) {
    return Math.floor(rng() * max)
}

function arr_rnd<A>(arr: Array<A>) {
    return arr[rnd_int(arr.length)]
}

function arr_remove<A>(arr: Array<A>, a: A) {
    arr.splice(arr.indexOf(a), 1)
}

function arr_replace<A>(arr: Array<A>, r: Array<A>) {
    arr.length = 0
      arr.push(...r)
}

function arr_scale(arr: Array<number>, n: number) {
    return arr.map(_ => _ * n)
}


export const pi = Math.PI;
export const half_pi = pi / 2;
export const third_pi = pi / 3;
export const tau = pi * 2;
export const thirdtau = tau/ 3;


const on_interval = (t: number, life: number, life0: number) => {
  return Math.floor(life0 / t) !== Math.floor(life / t)
}

const on_interval_lee = (t: number, life: number, life0: number, lee: Array<number>) => {
  //return lee.some(_ => on_interval(t, life - _, life0 - _) || on_interval(t, life + _, life0 + _))
  return lee.some(_ => (life + _) % t === 0 || (life - _) % t === 0)
}

abstract class Play {

  get ref() { return this.ctx.ref } 
  get c() { return this.ctx.c }
  get g() { return this.ctx.g }

  data: any

  life!: number
  life0!: number

  constructor(readonly ctx: Context) {}

  _set_data(data: any): this { 
    this.data = data 
    return this
  }

  init(): this { 
    this.life = 0
    this.life0 = 0
    this._init()
    return this 
  }

  update(dt: number) {
    this.life0 = this.life
    this.life += dt
    this._update(dt)
  }

  draw() {
    this._draw()
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Scene.cs#L122 */
  on_interval(t: number) {
    return on_interval(t, this.life, this.life0)
  }

  /* https://github.com/eguneys/monocle-engine/blob/master/Monocle/Util/Calc.cs#L944 */
  between_interval(i: number) {
    return this.life % (i * 2) > i
  }

  abstract _init(): void;
  abstract _update(dt: number): void;
  abstract _draw(): void;
}

export type Context = {
  c: Camera,
  g: Batcher,
  ref: Ref
}
export type MakeCtor = any

abstract class PlayMakes extends Play {


  make(Ctor: any, data: any = {}, delay: number = 0, repeat: number = 1) {
    this.makes.push([Ctor, data, delay, repeat, 0, 0])
  }

  z!: number
  objects!: Array<PlayMakes>
  makes!: Array<MakeCtor>

  init() {
    this.objects = []
    this.makes = []
    this.z = 0
    return super.init()
  }

  update(dt: number) {
    let { makes } = this
    this.makes = []

    this.makes = this.makes.concat(makes.filter(_ => {

      _[4] += dt

      let [Ctor, f_data, _delay, _s_repeat, _t, _i_repeat] = _

      let _at_once = _s_repeat < 0
      let _repeat = Math.abs(_s_repeat)

      if (_t >= _delay) {
        
        do {
          new Ctor(this)._set_data({
            group: this.objects,
            ...f_data.apply?.(
              _[5],
              _[4],
              _repeat,
              _delay,
            ) || f_data
          }).init()
        } while(++_[5] < _repeat && _at_once)

        _[4] = 0

        if (_repeat === 0 || _[5] < _repeat) {
          return true
        }
        return false
      } else {
        return true
      }
    }))

    super.update(dt)
  }


  _init() {}
  _update(dt: number) {}
  _draw() {}
}

abstract class WithPlays extends PlayMakes {

  make(Ctor: any, data: any = {}, delay: number = 0, repeat: number = 1) {
    this.plays.make(Ctor, data, delay, repeat)
  }

  get alive() {
    return this._alive
  }

  on_dispose: Array<any>

  constructor(readonly plays: AllPlays) {
    super(plays.ctx)
    this.on_dispose = []
  }

  _alive!: boolean

  init() {
    let { group } = this.data

    if (group) {
      group.push(this)
      this._alive = true
    }

    return super.init()
  }


  dispose(reason: any) {
    let { group } = this.data
    if (group) {
      arr_remove(group, this)
    this._alive = false
    }
    this.on_dispose.forEach(_ => _(this, reason))
    this._dispose(reason)

  }


  _dispose(_: string) {}
}


let fen2 = `
# ########
  #nno.o.#
  #logglo#
  #logglo#
  ###.####
`


class Board extends WithPlays {


  _drag_body: Body | undefined
  _drag_o: Vec2 | undefined
  _drag_shake: Shake2 | undefined
  _drag_move: Vec2 | undefined
  _drag_move_grid: Grid | undefined

  _drag!: DragPiece
  grid!: GridBuilder



  _init() {

    let _self = this

    _self.grid = GridBuilder.from_fen(fen2.trim())
    _self._drag = new DragPiece(this.ref.$_, {
      on_pass() {
        if (_self._drag_move_grid) {
          _self._drag_move = Vec2.zero
          _self.grid = _self.grid.with_grid(_self._drag_move_grid)


          _self._pass_check()


        }
      },
      on_test_move_(dir: Vec2) {
        _self._drag_move_grid = _self.grid.grid.move_(dir, _self._drag_body!)
        return !!_self._drag_move_grid
      },
      on_test_drag(v: Vec2) {
        _self._drag_body = _self.grid.grid.on(v)
        return (!!_self._drag_body)
      },
      on_begin(type: DragStateType, o: Vec2) {
        _self._drag_o = o
      },
      on_move(x: number, y: number) {
        _self._drag_move = Vec2.make(x, y)
      },
      on_shake(s: Shake2) {
        _self._drag_shake = s
      }, 
      on_end() {
        _self._drag_body = undefined
        _self._drag_o = undefined
        _self._drag_shake = undefined
        _self._drag_move = undefined
      }
    })

  }

  _ok: boolean = false
  _pass_check() {

    if (this._ok) {
      return
    }
    this.grid.bodies.forEach(([info, body_on_world]) => {
      if (info.char === 'n' && info.o.key === Vec2.make(7, 1).key) {
        this._ok = true
        alert('you win')
      }
    })
  }

  _update(dt: number) {
    this._drag._update(dt)
  }

  _draw() {

    this.g.texture(0xcccccc, 0, 0, 0, 
                   540, 740, -80, 
                   1000, 1000, 384, 16, 1, 1, 2048, 2048)


    let x = v_off.x + 7 * 100,
      y = v_off.y + 1 * 100
    this.g.texture(0xcccccc, 0, 0, 0,
                   x + 50, y + 50, -80,
                   100, 100, 288, 32, 32, 32, 2048, 2048)
    x += 100
    this.g.texture(0xcccccc, 0, 0, 0,
                   x + 50, y + 50, -80,
                   100, 100, 288, 32, 32, 32, 2048, 2048)




    this.grid.bodies.forEach(([info, body_on_world]) => {
      if (info.body === this._drag_body) { return }

      let x = 40 + 50 + info.o.x * 100,
        y = 240 + 50 + info.o.y * 100

      switch (info.char) {
        case '#':
          this.g.texture(0xcccccc, 0, 0, 0,
                         x, y, -80,
                         100, 100, 16, 80, 32, 32, 2048, 2048)
          break
        case 'o':
          this.g.texture(0xcccccc, 0, 0, 0,
                         x, y, -80,
                         100, 100, 16, 32, 32, 32, 2048, 2048)
          break
          case 'l':
            this.g.texture(0xcccccc, 0, 0, 0,
                         x, y + 50, -80,
                         100, 200, 64, 32, 32, 64, 2048, 2048)

            break
            case 'n':
              this.g.texture(0xcccccc, 0, 0, 0,
                         x + 50, y, -80,
                         200, 100, 112, 32, 64, 32, 2048, 2048)
              break
              case 'g':
              this.g.texture(0xcccccc, 0, 0, 0,
                         x + 50, y + 50, -80,
                         200, 200, 192, 32, 64, 64, 2048, 2048)
              break
      }
    })



    if (this._drag_body) {

      let [info, body_on_world] = this.grid.bodies.find(_ => _[0].body === this._drag_body)!

      let _shake_r = ((this._drag_shake?.x || 0) / 100) * Math.PI

      let __x = this._drag_shake?.x || 0,
        __y = this._drag_shake?.y || 0

      __x += this._drag_move?.x || 0
      __y += this._drag_move?.y || 0

      let d_off = 4

      let o = info.o.scale(100).add(v_off).add(Vec2.make(50, 50))

      let x = o.x + __x - d_off / 2, 
        y = o.y + __y - d_off / 2


      switch (info.char) {
        case '#':
          this.g.texture(0xcccccc, 0, 0, _shake_r,
                         x, y, -80,
                         100 + d_off, 100 + d_off, 16, 80, 32, 32, 2048, 2048)
          break
        case 'o':
          this.g.texture(0xcccccc, 0, 0, _shake_r,
                         x, y, -80,
                         100 + d_off, 100 + d_off, 16, 32, 32, 32, 2048, 2048)
          break
          case 'l':
            this.g.texture(0xcccccc, 0, 0, _shake_r,
                         x, y + 50, -80,
                         100 + d_off, 200 + d_off, 64, 32, 32, 64, 2048, 2048)

            break
            case 'n':
              this.g.texture(0xcccccc, 0, 0, _shake_r,
                         x + 50, y, -80,
                         200 + d_off, 100 + d_off, 112, 32, 64, 32, 2048, 2048)
              break
              case 'g':
              this.g.texture(0xcccccc, 0, 0, _shake_r,
                         x + 50, y + 50, -80,
                         200 + d_off, 200 + d_off, 192, 32, 64, 64, 2048, 2048)
              break
      }

      
    }





  }
}

export default class AllPlays extends PlayMakes {

  all(Ctor: any) {
    return this.objects.filter(_ => _ instanceof Ctor)
  }

  one(Ctor: any, o: Array<PlayMakes> = this.objects) {
    // TODO remove any
    return (o as any).findLast((_: any) => _ instanceof Ctor)
  }

  tag(Ctor: any, tag: string, o = this.objects) {
    return o.find(_ => _ instanceof Ctor && _.data.tag === tag)
  }


  get z_objects() {
    return this.objects.sort((a, b) => b.z - a.z)

  }

  get audio() {
		return this.one(Audio)
	}

  ui!: Array<WithPlays>

  _init() {

    this.objects = []
    this.ui = []


    this.make(Board)
  }

  _update(dt: number) {
    this.objects.forEach(_ => _.update(dt))
  }
  _draw() {

    this.g.texture(0xcccccc, 0, 0, 0, 
                   1080/2, 1920/2, -90, 
                   1080, 1920, 400, 16, 1, 1, 2048, 2048)
    this.z_objects.forEach(_ => _.draw())
  }
}
