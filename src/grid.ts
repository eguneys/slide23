import { Vec2 } from './vec2'

export type Body = Array<Vec2>
export type Pos = string

export class Grid {

  get clone() {

    return new Grid(this.w, 
                    this.h,
                    new Map(this._map), 
                    new Map(this._o_by_body))
  }

  get bodies() {
    return [...this._o_by_body].map(([body, o]) => {
      return [body, body.map(b => b.add(o))]
    })
  }

  constructor(readonly w: number,
              readonly h: number,
              readonly _map: Map<Pos, Array<Vec2>> = new Map(),
              readonly _o_by_body: Map<Array<Vec2>, Vec2> = new Map()
             ) { }

  move_(v: Vec2, body: Body) {

    let coll = this._w_body(body).map(_ => v.add(_)).find(_ => {
      let __ = this.on(_)
      return __ && __ !== body
    })

    if (!coll) {
      let o = this._o_by_body.get(body)!

      let { clone } = this


      clone.remove_body(body)
      clone.body(o.add(v), body)

      return clone
    }
    return undefined
  }

  _w_body(body: Body) {
    let o = this._o_by_body.get(body)!
    return body.map(_ => _.add(o))
  }

  on(o: Vec2) {
    return this._map.get(o.key)
  }


  remove_body(body: Body) {
    let _o = this._o_by_body.get(body)!
    body.forEach(v => this._map.delete(_o.add(v).key))
    this._o_by_body.delete(body)
  }

  body(o: Vec2, vss: Array<Vec2>) {
    let news = vss.map(_ => _.add(o)).map(v => [v.key, vss] as [Pos, Array<Vec2>])

    news.forEach(([key, value]) => this._map.set(key, value))

    this._o_by_body.set(vss, o)

    return news.map(_ => Vec2.from_key(_[0]))
  }

}
