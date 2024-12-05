import { genId, useInternalContext } from './common'
import {
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignFacadeCommand,
  DomainDesignFields,
  DomainDesignPerson,
  DomainDesignPersonProvider,
} from './define'
import { _optionalDesc } from './desc'

export function personProvider(designCode: string): DomainDesignPersonProvider {
  return (name: string, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    function command<COMMAND extends DomainDesignCommand<any>>(c: COMMAND): COMMAND
    function command<FIELDS extends DomainDesignFields>(
      name: string,
      fields: FIELDS,
      desc?: string | DomainDesignDesc
    ): DomainDesignCommand<FIELDS>
    function command<COMMAND extends DomainDesignCommand<any>, FIELDS extends DomainDesignFields>(
      param1: COMMAND | string,
      fields?: FIELDS,
      desc?: string | DomainDesignDesc
    ): COMMAND | DomainDesignCommand<FIELDS> {
      if (typeof param1 !== 'string') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const c = context.createCommand(name, fields!, desc)
      context.link(_code, c._attributes._code)
      return c
    }

    function facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>>(param: FACADECMD): FACADECMD
    function facadeCmd<FIELDS extends DomainDesignFields>(
      name: string,
      fields: FIELDS,
      desc?: string | DomainDesignDesc
    ): FIELDS
    function facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>, FIELDS extends DomainDesignFields>(
      param1: FACADECMD | string,
      fields?: FIELDS,
      desc?: string | DomainDesignDesc
    ): FACADECMD | DomainDesignFacadeCommand<FIELDS> {
      if (typeof param1 !== 'string') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const c = context.createFacadeCommand(name, fields!, desc)
      context.link(_code, c._attributes._code)
      return c
    }
    const person: DomainDesignPerson = {
      _attributes: {
        _code,
        rule: 'Person',
        name,
        description: _optionalDesc(desc),
      },
      command,
      facadeCmd,
    }
    context.registerPerson(person)
    return person
  }
}
