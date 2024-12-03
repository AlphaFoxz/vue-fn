import { readonly } from 'vue'
import { DomainDesignDesc, DomainDesignDescFn, DomainDesignDescValue } from './define'

export function descFn(_designCode: string): DomainDesignDescFn {
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
      template = readonly({
        raw: readonly([temp]),
        ...arr,
      })
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
    template = readonly({
      raw: readonly([temp]),
      ...arr,
    })
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
