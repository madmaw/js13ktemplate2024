export const GLSLX_SOURCE_VERTEX = "precision lowp float;\n\nuniform mat3 u_modelPositionToTextureCoord, u_modelPositionToScreenPosition, u_screenPositionToBackgroundCoord;\nattribute vec3 a_modelPosition;\nvarying vec3 b, c;\n\nvoid main() {\n  b = u_modelPositionToTextureCoord * a_modelPosition;\n  vec3 a = u_modelPositionToScreenPosition * a_modelPosition;\n  c = u_screenPositionToBackgroundCoord * a, gl_Position = vec4(a, 1);\n}\n"
export const GLSLX_SOURCE_FRAGMENT = "precision lowp float;\n\nuniform sampler2D u_background, u_texture;\nvarying vec3 b, c;\n\nvoid main() {\n  vec4 a = texture2D(u_texture, b.xy), d = texture2D(u_background, c.xy);\n  vec3 e = mix(d.rgb, a.rgb, a.a);\n  gl_FragColor = vec4(e, 1);\n}\n"

export const GLSLX_NAME_A_MODEL_POSITION = "a_modelPosition"
export const GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION = "u_modelPositionToScreenPosition"
export const GLSLX_NAME_U_BACKGROUND = "u_background"
export const GLSLX_NAME_U_TEXTURE = "u_texture"
export const GLSLX_NAME_U_MODEL_POSITION_TO_TEXTURE_COORD = "u_modelPositionToTextureCoord"
export const GLSLX_NAME_U_SCREEN_POSITION_TO_BACKGROUND_COORD = "u_screenPositionToBackgroundCoord"
