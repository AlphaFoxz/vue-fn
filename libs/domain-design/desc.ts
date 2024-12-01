import { readonly } from 'vue'
import { DomainDesignDesc, DomainDesignDescValue } from './define'

export function desc(temp: undefined): undefined
export function desc(temp: string): DomainDesignDesc
export function desc(temp: TemplateStringsArray, ...values: DomainDesignDescValue[]): DomainDesignDesc
export function desc(
  temp: string | TemplateStringsArray | undefined,
  ...values: DomainDesignDescValue[]
): DomainDesignDesc | undefined {
  if (temp === undefined) {
    return undefined
  }
  let template: TemplateStringsArray
  if (typeof temp === 'string') {
    const arr = new Array<string>()
    arr.push(temp)
    template = readonly({
      raw: readonly([temp]),
      ...arr,
    })
  } else {
    template = temp
  }
  return {
    rule: 'Desc',
    template,
    values,
  }
}

export function _optionalDesc(param: string | DomainDesignDesc | undefined): DomainDesignDesc | undefined {
  let description: DomainDesignDesc | undefined = undefined
  if (typeof param === 'string') {
    description = desc(param)
  } else if (typeof param === 'object') {
    description = param
  } else if (param === undefined) {
  } else {
    isNever(param)
  }
  return description
}
