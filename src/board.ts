import { ticks } from './shared'
import p2 from 'p2'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './webgl/math4'

let fen = `
### # # # #
 nno
l
l
 gg
 gg
`

let fen2 = `
# ########
  #nno.o.#
  #logglo#
  #logglo#
  ###.####
`


export type BodyInfo = {
  bounding_box: Rectangle,
  body: p2.Body,
  pos: Vec2,
  char: string,
  color: string
}



let origin_off = Vec2.make(95, 495)
let box_shrink_off = 16

let damping = 0.98
let mass = 20
let angularDamping = 1

const from_fen = (fen: string) => {

  let res: Array<BodyInfo> = []

  let visited: Array<string> = []

  let nb_rows,
  nb_cols
  let ms = new Map()
  fen.split('\n').forEach((lines: string, row: number) => {
    nb_rows = row + 1
    lines.split('').forEach((char: string, col: number) => {
      nb_cols = col + 1
      ms.set(Vec2.make(col, row).key, char)
    })
  })


  for (let [key, char] of ms) {
    if (visited.includes(key)) {
      continue
    }
    let v = Vec2.from_key(key)
    if (char === '#') {

      let box = Rectangle.make(-50, -50, 100, 100)

      let body = new p2.Body({
        position: v.scale(100).add(origin_off).vs,
        mass: 0
      })

      body.addShape(new p2.Box({
        width: 100,
        height: 100
      }))

      res.push({
        bounding_box: box,
        body,
        pos: v,
        char,
        color: 'hsl(0, 20%, 50%)'
      })
    } else if (char === 'n') {
      visited.push(...[v.key, v.right.key])

      let box = Rectangle.make(-50, -50, 200, 100).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(origin_off).vs,
        angularDamping,
        damping,
        mass
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(70, 50%, 50%)'
      })
    } else if (char === 'o') {
      visited.push(...[v.key])

      let box = Rectangle.make(-50, -50, 100, 100).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(origin_off).vs,
        angularDamping,
        damping,
        mass
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(90, 50%, 50%)'
      })
    } else if (char === 'l') {
      visited.push(...[v.key, v.down.key])

      let box = Rectangle.make(-50, -50, 100, 200).larger(-box_shrink_off)
      let vertices = box.vertices.map(_ => _.vs)
      let body = new p2.Body({
        fixedRotation: true,
        position: v.scale(100).add(origin_off).vs,
        angularDamping,
        damping,
        mass
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(30, 50%, 50%)'
      })


    } else if (char === 'g') {
      visited.push(...[v.key, v.down.key, v.right.key, v.down.right.key])
      let box = Rectangle.make(-50, -50, 200, 200).larger(-box_shrink_off)
      let vertices = box.vertices.map((_: Vec2) => _.vs)

      let body = new p2.Body({
        position: v.scale(100).add(origin_off).vs,
        fixedRotation: true,
        angularDamping,
        damping,
        mass
      })

      body.addShape(new p2.Convex({ vertices}))
      res.push({
        body,
        pos: v,
        char,
        bounding_box: box,
        color: 'hsl(50, 50%, 50%)'
      })
    }
  }

  return res
}


export class Board {

  world!: p2.World

  infos!: Array<BodyInfo>

  _drag_bodies!: Array<p2.Body>
  _drag_constraints!: Array<p2.Constraint>

  c_mouse!: p2.RevoluteConstraint | undefined
  b_mouse!: p2.Body

  _drag_particle!: Vec3

  _v_snap_t!: number

  get bs() {
    return this.infos.map(_ => _.body)
  }

  _init() {
    this.world = new p2.World({
      gravity: [0, 0]
    })


    this.infos = from_fen(fen2.trim())
    this.bs.forEach(_ => this.world.addBody(_))

    this._drag_bodies = []
    this._drag_constraints = []

    this.c_mouse = undefined
    this.b_mouse = new p2.Body()

    this._v_snap_t = 0

    return this
  }

  on_up() {
    this.world.removeConstraint(this.c_mouse!)
    this.world.removeBody(this.b_mouse)

    this._v_snap_t = ticks.half
  }

  on_drag() {
    this._drag_bodies.forEach(_ => this.world.removeBody(_))
    this._drag_constraints.forEach(_ => this.world.removeConstraint(_))
    this._drag_bodies = []
    this._drag_constraints = []
  }

  on_hit_test(_o_vs: [number, number]) {

    let [_body] = this.world.hitTest(_o_vs, this.bs, 1)

    if (_body) {

      let localPoint = p2.vec2.create()
      _body.toLocalFrame(localPoint, _o_vs)
      localPoint = Vec2.make(localPoint[0], localPoint[1]).scale(0.9).vs
      this.c_mouse = new p2.RevoluteConstraint(this.b_mouse, _body, {
        localPivotA: _o_vs,
        localPivotB: localPoint,
        maxForce: 10000 * _body.mass
      })
      this.world.addBody(this.b_mouse)
      this.world.addConstraint(this.c_mouse!)

    }
  }

  _update_drag_particle(_drag_particle_vs: [number, number, number]) {
    let [x, y] = _drag_particle_vs
    p2.vec2.copy((this.c_mouse as any).pivotA, [x, y])
  }

  update(dt: number) {

    let { _drag_constraints, _drag_bodies, world } = this
    if (this._v_snap_t > 0) {
      this._v_snap_t -= dt / 1000


      if (this._v_snap_t <= 0) {

        this.infos.forEach(_ => {
          let [x, y] = _.body.interpolatedPosition

          let _x = Math.round(x / 100) * 100
          let _y = Math.round(y / 100) * 100

          let cs_body = new p2.Body({ mass: 0, position: [_x, _y] })
          let cs_constraint = new p2.DistanceConstraint(cs_body, _.body, { 
            distance: 0,
            maxForce: 10000 * _.body.mass
          })
          cs_constraint.setStiffness(10000000)
          cs_constraint.setRelaxation(10)

          world.addBody(cs_body)
          world.addConstraint(cs_constraint)

          _drag_bodies.push(cs_body)
          _drag_constraints.push(cs_constraint)
        })
      }
    }

    this.world.step(1/60, dt/1000, 15)
  }
}
