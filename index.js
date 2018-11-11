/*
 * 检测页面上无用户交互时间
 * @Author: CntChen
 * @Date: 2018-11-09
 */

class Idle {
  constructor(handler, timeCount, isTick) {
    this.handler = handler
    this.timeCount = timeCount
    this.isTick = isTick
    this.lastHandleTime = Date.now()
    this.isShouldHandle = true
  }

  receiveIdleTime(idleTimeCount, timeNow) {
    if (!this.isShouldHandle) {
      return
    }

    if (timeNow - this.lastHandleTime >= this.timeCount) {
      this.handler()
      this.lastHandleTime = Date.now()

      if (this.isTick) {
        this.isShouldHandle = true
      } else {
        this.isShouldHandle = false
      }
    }
  }

  reset() {
    this.lastHandleTime = Date.now()
    this.isShouldHandle = true
  }
}

class UserIdle {
  constructor(detectInterval = 500) {
    this.detectInterval = detectInterval
    this.idleList = []
    this._idleTimeCount = 0
    this.idleStartTimestamp = Date.now()

    this.resetIdleTime = this.resetIdleTime.bind(this)
    this.startDetect()
  }

  startDetect() {
    // https://developer.mozilla.org/en-US/docs/Web/Events
    window.addEventListener('keydown', this.resetIdleTime, { capture: true })
    window.addEventListener('keypress', this.resetIdleTime, { capture: true })
    window.addEventListener('mousemove', this.resetIdleTime, { capture: true })
    window.addEventListener('mousedown', this.resetIdleTime, { capture: true })
    window.addEventListener('wheel', this.resetIdleTime, { capture: true })
    window.addEventListener('resize', this.resetIdleTime, { capture: true })

    // for mobile
    window.addEventListener('touchstart', this.resetIdleTime, { capture: true })
    window.addEventListener('touchmove', this.resetIdleTime, { capture: true })

    this.idleStartTimestamp = Date.now()
    setInterval(() => {
      const timeNow = Date.now()
      this._idleTimeCount = timeNow - this.idleStartTimestamp

      this.idleList.forEach(idle => idle.receiveIdleTime(this._idleTimeCount, timeNow))
    }, this.detectInterval)
  }

  resetIdleTime() {
    this._idleTimeCount = 0
    this.idleStartTimestamp = Date.now()
    this.idleList.forEach(idle => idle.reset())
  }

  get idleTimeCount() {
    return this._idleTimeCount
  }

  setIdle(handler, timeCount, isTick = false) {
    if (typeof handler !== 'function' || typeof timeCount !== 'number') {
      return null
    }

    const idle = new Idle(handler, timeCount, isTick)
    this.idleList.push(idle)
    return idle
  }

  clearIdle(idle) {
    const idleIndex = this.idleList.indexOf(idle)
    if (idleIndex >= 0) {
      this.idleList.splice(idleIndex, 1)
      return true
    } else {
      return false
    }
  }
}

export const userIdle = new UserIdle()
export default userIdle
