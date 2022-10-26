export class Vec2 {

  get key() {
    return [this.x, this.y].join(';')
  }
  static from_key = (key: string) =>
  new Vec2(parseFloat(key.split(';')[0]), parseFloat(key.split(';')[1]))

  static from_angle = (n: number) =>
    new Vec2(Math.cos(n), Math.sin(n))

  static make = (x: number, y: number) =>
    new Vec2(x, y)

  static get unit() { return new Vec2(1, 1) }
  static get zero() { return new Vec2(0, 0) }
  static get left() { return new Vec2(-1, 0) }
  static get right() { return new Vec2(1, 0) }
  static get up() { return new Vec2(0, -1) }
  static get down() { return new Vec2(0, 1) }

  get sign() {
    return Vec2.make(Math.sign(this.x), Math.sign(this.y))
  }

  get floor() {
    return Vec2.make(Math.floor(this.x), Math.floor(this.y))
  }

  get neighbours() {
    return [Vec2.up, Vec2.down, Vec2.left, Vec2.right].map(_ => _.add(this))
  }

  get right() {
    return Vec2.right.add(this)
  }

  get left() {
    return Vec2.left.add(this)
  }

  get up() {
    return Vec2.up.add(this)
  }

  get down() {
    return Vec2.down.add(this)
  }

  get vs(): [number, number] {
    return [this.x, this.y]
  }

  get mul_inverse(): Vec2 {
    return new Vec2(1/this.x, 1/this.y)
  }

  get inverse(): Vec2 {
    return new Vec2(-this.x, -this.y)
  }

  get half(): Vec2 {
    return new Vec2(this.x/2, this.y/2)
  }

  get length_squared() {
    return this.x * this.x + this.y * this.y
  }

  get length() {
    return Math.sqrt(this.length_squared)
  }

  get normalize(): Vec2 | undefined {
    if (this.length === 0) {
      return undefined
    }
    return this.scale(1/this.length)
  }

  get perpendicular() {
    return new Vec2(-this.y, this.x)
  }

  get clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }

  get angle(): number {
    return Math.atan2(this.y, this.x)
  }

  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }


  dot(v: Vec2) {
    return this.x * v.x + this.y * v.y
  }

  cross(v: Vec2) {
    return this.x * v.y - this.y * v.x
  }



  project_to(v: Vec2) {
    let lsq = v.length_squared
    let dp = this.dot(v)
    return Vec2.make(dp * v.x / lsq, dp * v.y / lsq)
  }

  distance(v: Vec2) {
    return this.sub(v).length
  }

  addy(n: number) {
    return Vec2.make(this.x, this.y + n)
  }

  add_angle(n: number) {
    return Vec2.from_angle(this.angle + n)
  }

  scale(n: number) {
    let { clone } = this
    return clone.scale_in(n)
  }

  scale_in(n: number) {
    this.x *= n
    this.y *= n
    return this
  }

  add(v: Vec2) {
    let { clone } = this
    return clone.add_in(v)
  }

  add_in(v: Vec2) {
    this.x += v.x
    this.y += v.y
    return this
  }


  sub(v: Vec2) {
    let { clone } = this
    return clone.sub_in(v)
  }

  sub_in(v: Vec2) {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  mul(v: Vec2) {
    let { clone } = this
    return clone.mul_in(v)
  }

  mul_in(v: Vec2) {
    this.x *= v.x
    this.y *= v.y
    return this
  }

  div(v: Vec2) {
    let { clone } = this
    return clone.div_in(v)
  }

  div_in(v: Vec2) {
    this.x /= v.x
    this.y /= v.y
    return this
  }

  set_in(x: number, y: number = this.y) {
    this.x = x
    this.y = y
    return this
  }

}




export class Matrix {

  static get identity() { return new Matrix(1, 0, 0, 1, 0, 0) }

  static get unit() { return Matrix.identity }

  static projection = (width: number, height: number) => {
    let b = 0,
      c = 0 

    let a = 1 / width * 2,
      d = -1 / height * 2,
      tx = -1,
      ty = 1 

    return new Matrix(a, b, c, d, tx, ty)
  }


  get clone(): Matrix {
    let { a, b, c, d, tx, ty } = this
    return new Matrix(a,b,c,d,tx,ty)
  }


  get inverse(): Matrix {
    let { a, b, c, d, tx, ty } = this

    let n = a * d - b * c

    let a1 = d / n,
      b1 = -b / n,
      c1 = -c / n,
      d1 = a / n,
      tx1 = (c * ty - d * tx) / n,
      ty1 = -(a * ty - b * tx) / n

    return new Matrix(a1, b1, c1, d1, tx1, ty1)
  }

  readonly array_t: Float32Array


  a: number
  b: number
  c: number
  d: number
  tx: number
  ty: number

  // a c tx
  // b d ty
  // 0 0 1
  constructor(
    a: number,
    b: number,
    c: number,
    d: number,
    tx: number,
    ty: number) {

    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.tx = tx
    this.ty = ty

    this.array_t = new Float32Array([
      a, b, 0,
      c, d, 0,
      tx, ty, 1
    ])
  }

  rotate_in(r: number): Matrix {

    let cosa = Math.cos(r),
      sina = Math.sin(r)

    let a = this.a * cosa - this.b * sina,
      b = this.a * sina + this.b * cosa,
      c = this.c * cosa - this.d * sina,
      d = this.c * sina + this.d * cosa,
      tx = this.tx * cosa - this.ty * sina,
      ty = this.tx * sina + this.ty * cosa

    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.tx = tx
    this.ty = ty

    return this
  }

  rotate(r: number): Matrix {
    let { clone } = this
    clone.rotate_in(r)
    return clone
  }

  scale(x: number, y: number): Matrix {

    let a = this.a * x,
      b = this.b,
      c = this.c,
      d = this.d * y,
      tx = this.tx,
      ty = this.ty

    return new Matrix(a, b, c, d, tx, ty)
  }

  translate_in(x: number, y: number): Matrix {

    let a = this.a,
      b = this.b,
      c = this.c,
      d = this.d,
      tx = x + this.tx,
      ty = y + this.ty

    this.tx = tx
    this.ty = ty
    return this
  }


  translate(x: number, y: number) {
    let { clone } = this
    clone.translate_in(x, y)
    return clone
  }

  scale_in(x: number, y: number) {
    this.a = x
    this.d = y
    return this
  }

  mVec2(v: Vec2): Vec2 {

    let a = this.a,
      b = this.b,
      c = this.c,
      d = this.d,
      tx = this.tx,
      ty = this.ty

    let x = a * v.x + c * v.y + tx,
      y = b * v.x + d * v.y + ty

    return Vec2.make(x, y)
  }


  mul_in(m: Matrix) {
    let { a, b, c, d, tx, ty } = this

    this.a = m.a * a + m.b * c
    this.b = m.a * b + m.b * d
    this.c = m.c * a + m.d * c
    this.d = m.c * b + m.d * d

    this.tx = m.tx * a + m.ty * c + tx
    this.ty = m.tx * b + m.ty * d + ty
  }

  set_in(m: Matrix) {
    let { a, b, c, d, tx, ty } = m

    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.tx = tx
    this.ty = ty
  }

  transform_in(scale: Vec2, rotation: number, translate: Vec2, pivot: Vec2 = Vec2.unit.half) {

   this.a = Math.cos(rotation) * scale.x
   this.b = Math.sin(rotation) * scale.x
   this.c = - Math.sin(rotation) * scale.y
   this.d = Math.cos(rotation) * scale.y

   this.tx = translate.x - (pivot.x * this.a + pivot.y * this.c)
   this.ty = translate.y - (pivot.x * this.b + pivot.y * this.d)
  }

}

export class Circle {

  static make = (x: number, y: number, r: number) => new Circle(Vec2.make(x, y), r)

  static get unit() { return Circle.make(0, 0, 1) }

  scale(n: number) { return Circle.make(this.o.x, this.o.y, this.r * n) }

  copy_in(circle: Circle) {  
    this.r = circle.r 
    this.o = circle.o 
    return this
  }

  add_o_in(v: Vec2) {
    this.o.add_in(v)
    return this
  }

  get x() {
    return this.o.x
  }

  get y() {
    return this.o.y
  }

  o: Vec2
  r: number


  constructor(o: Vec2, r: number) {
    this.o = o
    this.r = r
  }
}


export class Line {

  static make = (x: number, y: number, x2: number, y2: number) => new Line(Vec2.make(x, y), Vec2.make(x2, y2))

  get center() {
    return this.b.add(this.a).half
  }

  get parallel() {
    return this.b.sub(this.a).normalize
  }

  get normal() {
    return this.parallel?.perpendicular
  }

  get angle() {
    return this.b.sub(this.a).angle
  }

  get radius() {
    return this.length / 2
  }

  get length() {
    return this.b.sub(this.a).length
  }


  segments(ns: Array<number>, xs: Array<number>) {

    return ns.map((_, i) => 
           this.a.add(this.normal!.scale(xs[i]).add(this.parallel!.scale(this.length * _))))

  }

  get x1() {
    return this.a.x
  }

  get x2() {
    return this.b.x
  }

  get y1() {
    return this.a.y
  }

  get y2() {
    return this.b.y
  }

  constructor(readonly a: Vec2, readonly b: Vec2) {}

}


export class Rectangle {

  static make = (x: number, y: number,
    w: number, h: number) => new Rectangle([
      Vec2.make(x, y),
      Vec2.make(x + w, y),
      Vec2.make(x + w, y + h),
      Vec2.make(x, y + h)
    ])


  static get unit() { return Rectangle.make(0, 0, 1, 1) }


  get vs() { 
    let { x, y, w, h } = this
    return [x, y, w, h] 
  }

  
  get x1() { return this.vertices[0].x }
  get y1() { return this.vertices[0].y }
  get x2() { return this.vertices[2].x }
  get y2() { return this.vertices[2].y }

  get x() { return this.x1 }
  get y() { return this.y1 }
  get w() { return this.x2 - this.x1 }
  get h() { return this.y2 - this.y1 }

  get center() {
    return Vec2.make(this.x + this.w / 2,
                     this.y + this.h / 2)
  }

  get vertexData(): Float32Array {
    return new Float32Array(
      this.vertices.flatMap(_ =>
                            _.vs))
  }

  get indices(): Uint16Array {
    return new Uint16Array([0, 1, 2, 0, 2, 3])
  }


  larger(r: number) {
    return Rectangle.make(this.x - r/2, this.y - r/2,
                          this.w + r, this.h + r)
  }

  constructor(readonly vertices: Array<Vec2>) {}

  transform(m: Matrix): Rectangle {
    return new Rectangle(this.vertices.map(_ => m.mVec2(_)))
  }
}


export class Triangle {

  constructor(readonly a: Vec2, readonly b: Vec2, readonly c: Vec2) {}
}
