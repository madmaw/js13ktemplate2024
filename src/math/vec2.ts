import { type Mat2D } from './mat2d';
import { type Mat3 } from './mat3';

export type Vec2 = readonly [number, number];
export type MutableVec2 = [number, number];

export function transformMat2D([
  x,
  y,
]: Vec2, [
  m0,
  m1,
  m2,
  m3,
  m4,
  m5,
]: Mat2D): MutableVec2 {
  return [
    m0 * x + m2 * y + m4,
    m1 * x + m3 * y + m5,
  ];
}

export function transformMat3([
  x,
  y,
]: Vec2, [
  m00,
  m01,
  _m02,
  m10,
  m11,
  _m12,
  m20,
  m21,
  _m22,
]: Mat3): MutableVec2 {
  return [
    m00 * x + m10 * y + m20,
    m01 * x + m11 * y + m21,
  ];
}
