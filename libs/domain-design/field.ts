import { DomainDesignField } from './define'
import { _optionalDesc } from './desc'

export namespace field {
  export function str(desc?: string): DomainDesignField<'str'> {
    return {
      rule: 'Field',
      type: 'str',
      description: _optionalDesc(desc),
    }
  }
  export function num(desc: string): DomainDesignField<'num'> {
    return {
      rule: 'Field',
      type: 'num',
      description: _optionalDesc(desc),
    }
  }
  export function time(desc: string): DomainDesignField<'time'> {
    return {
      rule: 'Field',
      type: 'time',
      description: _optionalDesc(desc),
    }
  }

  export function enumeration(desc: string): DomainDesignField<'enumeration'> {
    return {
      rule: 'Field',
      type: 'enumeration',
      description: _optionalDesc(desc),
    }
  }
}
