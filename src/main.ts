import { w, h } from './shared'
import sprites_png from '../assets/sprites.png'
import { loop } from './debug'
import { Camera, Canvas, Graphics, Batcher } from './webgl'
import { Vec3 } from './webgl/math4'
import Play from './play'

function start(element: HTMLElement, images: Array<HTMLImageElement>) {
  let c = new Camera(Vec3.zero, Vec3.zero)

  let canvas = new Canvas(element, w, h)
  let graphics = new Graphics(canvas, c)

  let g = new Batcher(graphics)

  let _ctx = {
    c,
    g
  }

  let p = new Play(_ctx).init()

  g.init(0x000000, images)

  loop(dt => {

    p.update(dt)

    p.draw()

    g.render()
  })

}


function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}


const app = (element: HTMLElement) => {
  Promise.all([
    load_image(sprites_png),
    load_image(sprites_png),
    load_image(sprites_png),
  ]).then(images => start(element, images))
}


app(document.getElementById('app')!)
