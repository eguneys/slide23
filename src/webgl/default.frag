#version 300 es
precision highp float;
in vec2 vTextureCoord;
in vec3 vVertexCoord;
in vec3 vTint;
in vec3 vType;
out vec4 outColor;

uniform sampler2D uSampler3;

void main() {

  vec2 p = vTextureCoord;
  vec4 col = texture(uSampler3, vTextureCoord);

  col.rgb *= vTint;
  col.a += vType.z;

  outColor = vec4(col.rgb * col.a, col.a);
}

