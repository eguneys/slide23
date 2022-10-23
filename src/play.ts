import { Batcher, Camera } from './webgl'
import { Vec3 } from './webgl/math4'
import { Vec2, Rectangle } from './vec2'
import { Board as PBoard } from './board'
import { make_drag } from './drag'
import { Ref } from './ref'

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

class Board extends WithPlays {

  board!: PBoard

  _drag_particle?: Vec3

  _init() {
    this.board = new PBoard()._init()

    let self = this

    make_drag({
      on_drag(e) {
        self.board.on_drag()

        if (e.m) {
          let _o = self.ref.get_normal_at_abs_pos(e.e).mul(v_screen)
          let o = self.ref.get_normal_at_abs_pos(e.m).mul(v_screen)

          if (self._drag_particle) {
            self._drag_particle = Vec3.make(o.x, o.y, 0)
          } else {
            self.board.on_hit_test(_o.vs)
            self._drag_particle = Vec3.make(o.x, o.y, 0)
          }
        }
      },
      on_up() {
        self.board.on_up()
        self._drag_particle = undefined
      }

    }, this.ref.$_)

  }

  _update(dt: number) {

    if (this._drag_particle) {
      this.board._update_drag_particle(this._drag_particle.vs)
    }
    this.board.update(dt)
  }

  _draw() {

    this.g.texture(0xcccccc, 0, 0, 0, 
                   540, 940, -80, 
                   1000, 1000, 1664, 0, 1, 1, 2048, 2048)



    this.board.infos.forEach((_, i) => {

      let { char, color, body, bounding_box} = _

      let [x, y] = body.interpolatedPosition

      let w = bounding_box.w
      let h = bounding_box.h
      x += bounding_box.x
      y += bounding_box.y
      let v = Vec2.make(x, y)
      let s = Vec2.make(w, h)

      let _r = 180
      let z = 0

      if (char === '#') {

      this.g.texture(0xcccccc, 0, 0, 0, 
                     v.x+_r/4, v.y+_r/4, z,
                     _r/2, _r/2, 1712, 0, 1, 1, 2048, 2048)
                     return
      }

      let is = 0

      if (char === 'l') {
        is = 1
      }
      if (char === 'n') {
        is = 2
      }
      if (char === 'g') {
        is = 3
      }

      this.g.texture(0xcccccc, 0, 0, 0, 
                     v.x+_r/2, v.y+_r/2, z,
                     _r, _r, 320*is, 0, 320, 320, 2048, 2048)
    })
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
                   1080, 1920, 1600, 0, 1, 1, 2048, 2048)
    this.z_objects.forEach(_ => _.draw())
  }
}
