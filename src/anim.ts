export type TweenMakeSettings = {
  values: Array<number>,
  duration: number,
  loop?: boolean
}
export class Tween {
  static make_from_settings = (_: TweenMakeSettings) => Tween.make(_.values, _.duration, _.loop)
  static make = (
    values: Array<number>,
    duration: number,
    loop: boolean = false) => {
      return new Tween(values.slice(0), [duration], loop ? 1 : 0).init()
    }
  get value() {
    return this._value
  }
  get i() {
    let dur = this._durations[this._i % this._durations.length]
    let i = Math.min(this._t / dur, 1)
    return i
  }
  get completed() {
    return this._completed
  }
  complete_now() {
    this._value = this._values[this._values.length - 1]
    this._completed = true
  }
  update(dt: number) {
    if (this._completed) {
      return
    }
    let { _values: values } = this
    this._t += dt
    let orig = values[this._i]
    let dest = values[this._i + 1]
    let i = this.i
    this._value = lerp(orig, dest, ease(i))
    if (i === 1) {
      this._i++;
      this._t = 0;
      if (this._i >= values.length - 1) {
        if (this.loop === 1) {
          this._i = 0
          this._values.reverse()
          this._durations.reverse()
        } else {
          this._completed = true
        }
      }
    }
  }
  _completed!: boolean
  _i!: number
  _t!: number
  _value!: number
  init() {
    this._i = 0
    this._t = 0
    this._completed = false
    this._value = this._values[0]
    return this
  }
  constructor(
    readonly _values: Array<number>,
    readonly _durations: Array<number>,
    readonly loop: number = 0) {}
}
/* https://gist.github.com/gre/1650294 */
function ease(t: number) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
export const lerp = (a: number, b: number, t: number = 0.5) => {
  return a * (1 - t) + b * t
}
export const lerp_dt = (f: number, dt: number, a: number, b: number) => {
  return lerp(a, b, (1-Math.pow(f, dt)))
}
export function appr(a: number, b: number, by: number) {
  if (a < b) { return Math.min(a + by, b) }
  if (a > b) { return Math.max(a - by, b) }
  return b
}
