import { expect, it } from 'vitest'
import { createDomainDesigner } from '..'

it('字符串转换模板函数', () => {
  const d = createDomainDesigner()
  const desc = d.desc('default')
  const agg = d.agg('agg', {}, '')
  const event = agg.event('event', {}, '')
  expect(desc._attributes.template.reduce).instanceOf(Function)
  expect(agg._attributes.description?._attributes.template.reduce).instanceOf(Function)
  expect(event._attributes.description?._attributes.template.reduce).instanceOf(Function)
})
