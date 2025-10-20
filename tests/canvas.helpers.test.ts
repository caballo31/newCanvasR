import { describe, it, expect } from 'vitest'
import { viewportCenterOnCanvas, getDefaultSize, getWindowSize } from '../src/lib/canvas-helpers'

describe('canvas helpers', () => {
  it('computes viewport center correctly with scale and translation', () => {
    const vp = { x: 100, y: 50, scale: 2 }
    const { x, y } = viewportCenterOnCanvas(vp, 1200, 800)
    // manual math: 1200/2/2 - 100/2 = 300 - 50 = 250 ; 800/2/2 - 50/2 = 200 - 25 = 175
    expect(x).toBeCloseTo(250)
    expect(y).toBeCloseTo(175)
  })

  it('returns default sizes by type', () => {
    expect(getDefaultSize('text')).toEqual({ width: 200, height: 100 })
    expect(getDefaultSize('media')).toEqual({ width: 200, height: 150 })
    expect(getDefaultSize('html')).toEqual({ width: 250, height: 120 })
    expect(getDefaultSize('folder')).toEqual({ width: 300, height: 200 })
  })

  it('returns window sizes by type', () => {
    expect(getWindowSize('text')).toEqual({ width: 520, height: 380 })
    expect(getWindowSize('media')).toEqual({ width: 640, height: 420 })
    expect(getWindowSize('html')).toEqual({ width: 520, height: 360 })
    expect(getWindowSize('folder')).toEqual({ width: 700, height: 480 })
  })
})
