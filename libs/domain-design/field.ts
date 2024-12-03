import { genId } from './common'
import { DomainDesignDesc, DomainDesignField, DomainDesignFieldFn } from './define'
import { _optionalDesc } from './desc'

export interface DomainDesignFieldUtil {
  (name: string, desc?: string | DomainDesignDesc): DomainDesignField<'Unknown'>
  id: DomainDesignFieldFn<'ID'>
  str: DomainDesignFieldFn<'String'>
  num: DomainDesignFieldFn<'Number'>
  time: DomainDesignFieldFn<'Time'>
  enumeration: DomainDesignFieldFn<'Enumeration'>
}

export const field: DomainDesignFieldUtil = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'Unknown',
      name,
      description: _optionalDesc(desc),
    },
  }
}

field.id = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'ID',
      name,
      description: _optionalDesc(desc),
    },
  }
}
field.str = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'String',
      name,
      description: _optionalDesc(desc),
    },
  }
}
field.num = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'Number',
      name,
      description: _optionalDesc(desc),
    },
  }
}
field.time = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'Time',
      name,
      description: _optionalDesc(desc),
    },
  }
}
field.enumeration = (name: string, desc?: string | DomainDesignDesc) => {
  return {
    _attributes: {
      _code: genId(),
      rule: 'Field',
      type: 'Enumeration',
      name,
      description: _optionalDesc(desc),
    },
  }
}
