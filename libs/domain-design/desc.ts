import { readonly } from 'vue'
import { DomainDesignDesc, DomainDesignDescProvider, DomainDesignDescValue } from './define'

export function descProvider(_designCode: string): DomainDesignDescProvider {
  function descFn(temp: undefined): undefined
  function descFn(temp: string): DomainDesignDesc
  function descFn(temp: DomainDesignDesc): DomainDesignDesc
  function descFn(temp: TemplateStringsArray, ...values: DomainDesignDescValue[]): DomainDesignDesc
  function descFn(
    temp: string | TemplateStringsArray | undefined | DomainDesignDesc,
    ...values: DomainDesignDescValue[]
  ): DomainDesignDesc | undefined {
    if (temp === undefined) {
      return undefined
    } else if (isDomainDesignDesc(temp)) {
      return temp as DomainDesignDesc
    }
    let template: Readonly<TemplateStringsArray>
    if (typeof temp === 'string') {
      const arr = new Array<string>()
      arr.push(temp)
      ;(arr as any).raw = readonly([temp])
      template = readonly(arr as unknown as TemplateStringsArray)
    } else {
      template = temp
    }
    return {
      _attributes: {
        rule: 'Desc',
        template: template,
        values: values,
      },
    }
  }
  return descFn
}

function isDomainDesignDesc(param: any): param is DomainDesignDesc {
  return param._attributes && param._attributes.rule === 'Desc'
}

export function _optionalDesc(temp?: string | DomainDesignDesc): DomainDesignDesc | undefined {
  if (temp === undefined) {
    return undefined
  } else if (isDomainDesignDesc(temp)) {
    return temp as DomainDesignDesc
  }
  let template: Readonly<TemplateStringsArray>
  if (typeof temp === 'string') {
    const arr = new Array<string>()
    arr.push(temp)
    ;(arr as any).raw = readonly([temp])
    template = readonly(arr as unknown as TemplateStringsArray)
  } else {
    template = temp
  }
  return {
    _attributes: {
      rule: 'Desc',
      template: template,
      values: [],
    },
  }
}
