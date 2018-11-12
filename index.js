/*
 * 检测页面上用户无交互时间
 * @Author: CntChen
 * @Date: 2018-11-09
 */

/**
 * 用户无交互超时类
 * @class Idle
 */
class Idle {
  /**
   * @param {function} handler 用户无交互超时的回调函数
   * @param {number} timeCount 用户无交互的超时时间间隔, milliseconds
   * @param {object} options
   * @param {boolean} options.isTick 是否循环触发, 为 true 时会循环触发
   * @param {function|null} options.onActive 无交互超时后的激活回调函数, 需要无交互时间超过 timeCount 才会触发
   */
  constructor(handler, timeCount, {
      isTick = false,
      onActive = null,
    } = {}) {
    this.handler = handler
    this.timeCount = timeCount
    this.isTick = isTick
    this.onActive = onActive
    this.initTime = this.lastHandleTime = Date.now()
    this.isShouldHandle = true
  }

  /**
   * 用户依然无交互的回调函数
   * @param {number} idleTimeCount 用户无交互的总时间, milliseconds
   * @param {number} timeNow 当前时刻, milliseconds
   */
  receiveIdleTime(idleTimeCount, timeNow) {
    if (!this.isShouldHandle) {
      return
    }

    if (timeNow - this.lastHandleTime >= this.timeCount) {
      this.handler()
      this.lastHandleTime = Date.now()

      this.isShouldHandle = this.isTick ? true : false
    }
  }

  /**
   * 用户有操作的回调函数
   */
  userActive() {
    const hasHandled = this.initTime !== this.lastHandleTime

    this.lastHandleTime = Date.now()
    this.isShouldHandle = true

    // 注册了激活回调函数, 并且已经达到无交互时间超时
    this.onActive && hasHandled && this.onActive()
  }
}

/**
 * 用户无操作检测类
 * @class UserIdle
 */
class UserIdle {
  /**
   * @param {number} detectInterval 用户无交互检测的检测间隔, milliseconds
   */
  constructor(detectInterval = 256) {
    this.detectInterval = detectInterval
    this.idleList = []
    this._idleTimeCount = 0 // 用户无交互的总时间
    this.idleStartTimestamp = Date.now()

    this.userActive = this.userActive.bind(this)
    this.startDetect()
  }

  /**
   * 开始用户无交互监控
   */
  startDetect() {
    // https://developer.mozilla.org/en-US/docs/Web/Events
    window.addEventListener('keydown', this.userActive, { capture: true })
    window.addEventListener('keypress', this.userActive, { capture: true })
    window.addEventListener('mousemove', this.userActive, { capture: true })
    window.addEventListener('mousedown', this.userActive, { capture: true })
    window.addEventListener('wheel', this.userActive, { capture: true })
    window.addEventListener('resize', this.userActive, { capture: true })

    // for mobile
    window.addEventListener('touchstart', this.userActive, { capture: true })
    window.addEventListener('touchmove', this.userActive, { capture: true })

    this.idleStartTimestamp = Date.now()
    setInterval(() => {
      const timeNow = Date.now()
      this._idleTimeCount = timeNow - this.idleStartTimestamp

      this.idleList.forEach(idle => idle.receiveIdleTime(this._idleTimeCount, timeNow))
    }, this.detectInterval)
  }

  /**
   * 用户有操作事件回调
   */
  userActive() {
    this._idleTimeCount = 0
    this.idleStartTimestamp = Date.now()
    this.idleList.forEach(idle => idle.userActive())
  }

  /**
   * 用户无交互的总时间
   * @return {number} 用户无交互的总时间
   * @memberof UserIdle
   */
  get idleTimeCount() {
    return this._idleTimeCount
  }

  /**
   * 创建一个用户无交互超时对象
   * @param {*} handler 用户无交互对象构建参数
   * @param {*} timeCount 用户无交互对象构建参数
   * @param {*} options 用户无交互对象构建参数
   * @return {Idle} 用户无交互超时对象
   * @memberof UserIdle
   */
  setIdle(handler, timeCount, options) {
    if (typeof handler !== 'function' || typeof timeCount !== 'number') {
      return null
    }

    const idle = new Idle(handler, timeCount, options)
    this.idleList.push(idle)
    return idle
  }

  /**
   * 清除一个用户无交互超时对象
   * @param {Idle} idle 用户无交互超时对象
   * @memberof UserIdle
   */
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
