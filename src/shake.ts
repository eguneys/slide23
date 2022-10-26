import { ticks } from './shared'
import { perlin2 } from './noise'
import { Vec2 } from './vec2'

export class Shake2 {
  
  get x() {
    return this.value.x
  }

  get y() {
    return this.value.y
  }

  get completed() {
    return this._fade === 0
  }

  _life: number
  value: Vec2
  _fade: number

  constructor(readonly _max: number, readonly _speed: number, readonly _direction: Vec2, readonly _max_fade: number = ticks.half) {
    this._life = 0
    this.value = Vec2.zero
    this._fade = this._max_fade
  }

  _update(dt: number) {
    this._life += dt

    if (this._fade > 0) {
      this._fade -= dt
      if (this._fade < 0) {
        this._fade = 0
      }
    }

    let sin = Math.sin(this._speed * this._life)

    let v_direction = this._direction.add(
      Vec2.make(
        perlin2(Math.cos(this._life), Math.sin(this._life)),
        perlin2(Math.sin(this._life), Math.cos(this._life)),
      ).scale(2))

    let _fade = this._fade / this._max_fade
    this.value = v_direction.scale(sin * this._max * _fade)
  }

}
