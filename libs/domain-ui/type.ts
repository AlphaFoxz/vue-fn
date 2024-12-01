type DomainDataTypeDesc = 'str' | 'num' | 'time' | 'enumeration'
type DomainDataType<T extends DomainDataTypeDesc> = {
  desc?: string
  type: T
}

export namespace type {
  export function str(desc?: string): DomainDataType<'str'> {
    return {
      type: 'str',
      desc,
    }
  }
  export function num(desc: string): DomainDataType<'num'> {
    return {
      type: 'num',
      desc,
    }
  }
  export function time(desc: string): DomainDataType<'time'> {
    return {
      type: 'time',
      desc,
    }
  }

  export function enumeration(desc: string): DomainDataType<'enumeration'> {
    return {
      type: 'enumeration',
      desc,
    }
  }
}
