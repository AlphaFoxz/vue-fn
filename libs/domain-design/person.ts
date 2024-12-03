import { genId, useInternalContext } from './common'
import {
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignFacadeCommand,
  DomainDesignFields,
  DomainDesignPerson,
  DomainDesignPersonFn,
} from './define'
import { _optionalDesc } from './desc'

export function personFn(designCode: string): DomainDesignPersonFn {
  return (name: string, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    function command(c: DomainDesignCommand): DomainDesignCommand
    function command(name: string, fields: DomainDesignFields, desc?: string | DomainDesignDesc): DomainDesignCommand
    function command(
      param1: DomainDesignCommand | string,
      fields?: DomainDesignFields,
      desc?: string | DomainDesignDesc
    ): DomainDesignCommand {
      if (typeof param1 !== 'string') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const c = context.createCommand(name, fields!, desc)
      context.link(_code, c._attributes._code)
      return c
    }

    function facadeCmd(param: DomainDesignFacadeCommand): DomainDesignFacadeCommand
    function facadeCmd(
      name: string,
      fields: DomainDesignFields,
      desc?: string | DomainDesignDesc
    ): DomainDesignFacadeCommand
    function facadeCmd(
      param1: DomainDesignFacadeCommand | string,
      fields?: DomainDesignFields,
      desc?: string | DomainDesignDesc
    ): DomainDesignFacadeCommand {
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
