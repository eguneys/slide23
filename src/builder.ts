import { Vec2 } from './vec2'
import { Grid, Body } from './grid'

const body_by_char: any = {
  '#': [Vec2.zero],
  'o': [Vec2.zero],
  'n': [Vec2.zero, Vec2.zero.right],
  'l': [Vec2.zero, Vec2.zero.down],
  'g': [Vec2.zero, Vec2.zero.right, Vec2.zero.down, Vec2.zero.right.down]
}


export type GridItem = {
  char: string,
  o: Vec2,
  body: Body
}


export class GridBuilder {

  static from_fen = (fen: string) => {

    let nb_rows = 0,
    nb_cols = 0
    let ms = new Map()
    fen.split('\n').forEach((lines: string, row: number) => {
      nb_rows = row + 1
      lines.split('').forEach((char: string, col: number) => {
        nb_cols = col + 1
        ms.set(Vec2.make(col, row).key, char)
      })
    })

    let grid = new Grid(nb_rows, nb_cols)
    let info_by_body = new Map()

    let visited: Array<string> = []
    for (let [key, char] of ms) {
      if (visited.includes(key)) {
        continue
      }

      let v = Vec2.from_key(key)
      let body = body_by_char[char]?.slice(0)

      if (!body) {
        continue
      }
      let body_on_world = grid.body(v, body)

      body_on_world.forEach(bw => visited.push(bw.key))

      info_by_body.set(body, { body, o: v, char })
    }

    return new GridBuilder(grid, info_by_body)
  }

  get bodies(): Array<[GridItem, Body]> {
    return this.grid.bodies
    .map(([body, body_on_world]) =>
         [this.info_by_body.get(body)!,
           body_on_world])
  }

  with_grid(grid: Grid) {
    let info_by_body = new Map(
      [...this.info_by_body]
      .map(([body, info]) => {
        return [body,
          {
            ...info,
            o: grid._o_by_body.get(body)!
          }]
      }))
    return new GridBuilder(grid, info_by_body)
  }

  constructor(readonly grid: Grid,
              readonly info_by_body: Map<Body, GridItem>) {}
}

