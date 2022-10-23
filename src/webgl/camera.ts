import { Mat4, Vec3 } from './math4'
import { Quat, Billboard } from './math4'

export class Camera  {


  get v_matrix() {
    return this.c_matrix.inverse || Mat4.identity
  }

  get vp_matrix() {
    return this.p_matrix.mul(this.v_matrix)
  }

  //p_matrix = Mat4.perspective_from_frust(Math.PI*0.4, 16/9, 10, 1000)

  p_matrix = Mat4.orthoNO(0, 1080, 1920, 0, -10, 100)

  get c_matrix() {
    return Mat4.lookAt(this.o, this.l, Vec3.up)
  }

  constructor(readonly o: Vec3, readonly l: Vec3) {}
 
}
