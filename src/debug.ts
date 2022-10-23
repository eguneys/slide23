export class Canvas {

  static make = (width: number, height: number, element: HTMLElement) => {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    element.appendChild(canvas)
    return new Canvas(width, height, canvas)
  }

  ctx: CanvasRenderingContext2D

  constructor(
    readonly width: number,
    readonly height: number,
    readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }


  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  tr(x: number, y: number, px: number, py: number, angle: number) {
    this.ctx.translate(x, y)
    this.ctx.rotate(angle)
    this.ctx.translate(-px, -py)
  }

  resetTransform() {
    this.ctx.resetTransform()
  }

  fr(color: string, x: number, y: number, w: number, h: number) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, w, h)
  }


  line(color: string, lineWidth: number, x1: number, y1: number, x2: number, y2: number) {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = lineWidth
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.closePath()
    this.ctx.stroke()
  }
}


export const loop = (_fn: (dt: number) => void) => {

  let _cancel: number

  let _last_now = 0

  function step(_now: number) {

    let dt = _now - (_last_now || _now)
    _last_now = _now

    dt = Math.max(Math.min(dt, 16), 4)

    _fn(dt)

    _cancel = requestAnimationFrame(step)
  }

  _cancel = requestAnimationFrame(step)

  return () => {
    cancelAnimationFrame(_cancel)
  }
}


export const log_r = (() => {

  let life = 0

  return (...args: any) => {
    if (life++ % 1000 === 0) {
      console.log(...args)
    }
  }
})()
