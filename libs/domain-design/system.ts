import { genId, useInternalContext } from './common'
import {
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignFacadeCommand,
  DomainDesignFields,
  DomainDesignSystem,
  DomainDesignSystemProvider,
} from './define'

export function systemProvider(designCode: string): DomainDesignSystemProvider {
  return (name: string, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    function command<COMMAND extends DomainDesignCommand<any>>(param: COMMAND): COMMAND
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
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      } else {
        const c = context.createCommand(param1, fields!, desc)
        context.link(_code, c._attributes._code)
        return c
      }
    }

    function facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>>(param: FACADECMD): FACADECMD
    function facadeCmd<FIELDS extends DomainDesignFields>(
      name: string,
      fields: FIELDS,
      desc?: string | DomainDesignDesc
    ): DomainDesignFacadeCommand<FIELDS>
    function facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>, FIELDS extends DomainDesignFields>(
      param1: FACADECMD | string,
      fields?: FIELDS,
      desc?: string | DomainDesignDesc
    ): FACADECMD | DomainDesignFacadeCommand<FIELDS> {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      } else {
        const c = context.createFacadeCommand(param1, fields!, desc)
        context.link(_code, c._attributes._code)
        return c
      }
    }
    const system: DomainDesignSystem = {
      _attributes: {
        _code,
        rule: 'System',
        name,
        description: context.createDesc(desc as any),
      },
      command,
      facadeCmd,
    }
    context.registerSystem(system)
    return system
  }
}
