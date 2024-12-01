import d from '..'
import { it } from 'vitest'

it('', () => {
  const 支付系统 = d.person('支付系统')
  const 闸机 = d.person('闸机')
  const 车主 = d.person('车主')

  const 用户聚合 = d.agg(() => {
    // 聚合属性
    const 用户名 = d.field.str()

    return {
      states: {
        用户名,
      },
      commands: {
        车辆出场命令: d.cmd({ 用户名 }, d.desc``),
        车辆进场命令: d.cmd({}),
      },
      events: { 车辆出场成功事件: d.event({}) },
    }
  })
})
