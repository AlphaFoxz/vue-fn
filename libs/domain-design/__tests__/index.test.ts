import { createDomainDesigner } from '..'
import { expect, it } from 'vitest'

it('注册元素', () => {
  const d = createDomainDesigner()

  // 用户
  const 用户 = d.person('用户')
  // 命令
  const 命令1 = d.command('命令1', {})
  const 命令2 = d.facadeCmd('命令2', {})
  // 聚合
  const 聚合 = d.agg('聚合', {})
  // 事件
  const 事件 = d.event('事件', {})
  // 规则
  const 规则 = d.policy('规则')
  // 服务
  const 服务 = d.service('服务')
  // 外部系统
  const 外部系统 = d.system('外部系统')

  const context = d._getContext()
  expect(context.getPersons()[0]._attributes._code).toEqual(用户._attributes._code)
  expect(context.getCommands()[0]._attributes._code).toEqual(命令1._attributes._code)
  expect(context.getFacadeCommands()[0]._attributes._code).toEqual(命令2._attributes._code)
  expect(context.getAggs()[0]._attributes._code).toEqual(聚合._attributes._code)
  expect(context.getEvents()[0]._attributes._code).toEqual(事件._attributes._code)
  expect(context.getPolicies()[0]._attributes._code).toEqual(规则._attributes._code)
  expect(context.getServices()[0]._attributes._code).toEqual(服务._attributes._code)
  expect(context.getSystems()[0]._attributes._code).toEqual(外部系统._attributes._code)
})

it('箭头', () => {
  const d = createDomainDesigner()
  // 用户
  const 用户 = d.person('用户')
  // 命令
  const 命令1 = d.command('命令1', {})
  const 命令2 = d.facadeCmd('命令2', {})
  // 聚合
  const 聚合 = d.agg('聚合', {})
  // 事件
  const 事件 = d.event('事件', {})
  // 规则
  const 规则 = d.policy('规则')
  // 服务
  const 服务 = d.service('服务')
  // 外部系统
  const 外部系统 = d.system('外部系统')
  用户.command(命令1).agg(聚合).event(事件).policy(规则).service(服务)
  事件.system(外部系统)
  用户.facadeCmd(命令2).service(服务)

  const context = d._getContext()
  type Node = {
    _attributes: {
      _code: string
    }
  }
  function checkArrow(from: Node, to: Node) {
    expect(context.getArrows()[`${from._attributes._code},${to._attributes._code}`]).not.toBe(undefined)
  }
  checkArrow(用户, 命令1)
  checkArrow(命令1, 聚合)
  checkArrow(聚合, 事件)
  checkArrow(事件, 规则)
  checkArrow(规则, 服务)
  checkArrow(事件, 外部系统)
  checkArrow(用户, 命令2)
  checkArrow(命令2, 服务)
})

it('聚合增强', () => {
  const d = createDomainDesigner()
  const 主键 = d.field.id('主键')
  const 聚合 = d.agg('聚合', { 主键 })
  聚合.inner['主键']
})

it('事件增强', () => {
  const d = createDomainDesigner()
  const 主键 = d.field.id('主键')
  const event = d.event('事件', { 主键 })
  event.inner['主键']
})
