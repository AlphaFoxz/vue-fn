import { genId, useInternalContext } from './common'
import {
  DomainDesignFields,
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignCommandFn,
  DomainDesignAgg,
  DomainDesignFacadeCommandFn,
  DomainDesignFacadeCommand,
  DomainDesignService,
} from './define'

export function commandFn(designCode: string): DomainDesignCommandFn {
  return <FIELDS extends DomainDesignFields>(name: string, fields: FIELDS, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    function agg<AGG extends DomainDesignAgg<any>>(param: AGG): AGG
    function agg<FIELDS extends DomainDesignFields>(
      name: string,
      fields: FIELDS,
      desc?: string | DomainDesignDesc
    ): DomainDesignAgg<FIELDS>
    function agg<AGG extends DomainDesignAgg<any>, FIELDS extends DomainDesignFields>(
      param1: AGG | string,
      fields?: DomainDesignFields,
      desc?: string | DomainDesignDesc
    ): AGG | DomainDesignAgg<FIELDS> {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const a = context.createAgg(param1, fields!, desc)
      context.link(_code, a._attributes._code)
      return a
    }
    const command: DomainDesignCommand = {
      _attributes: {
        _code,
        rule: 'Command',
        name,
        fields,
        description: context.createDesc(desc as any),
      },
      agg,
    }
    context.registerCommand(command)
    return command
  }
}

export function facadeCmdFn(designCode: string): DomainDesignFacadeCommandFn {
  return <FIELDS extends DomainDesignFields>(name: string, fields: FIELDS, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    function agg<AGG extends DomainDesignAgg<any>>(param: AGG): AGG
    function agg<FIELDS extends DomainDesignFields>(
      name: string,
      fields: FIELDS,
      desc?: string | DomainDesignDesc
    ): DomainDesignAgg<FIELDS>
    function agg<AGG extends DomainDesignAgg<any>, FIELDS extends DomainDesignFields>(
      param1: AGG | string,
      fields?: FIELDS,
      desc?: string | DomainDesignDesc
    ): AGG | DomainDesignAgg<FIELDS> {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const a = context.createAgg(param1, fields!, desc)
      context.link(_code, a._attributes._code)
      return a
    }

    function service(param: DomainDesignService): DomainDesignService
    function service(name: string, desc?: string | DomainDesignDesc): DomainDesignService
    function service(param1: DomainDesignService | string, desc?: string | DomainDesignDesc): DomainDesignService {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const s = context.createService(param1, desc)
      context.link(_code, s._attributes._code)
      return s
    }
    const facadeCmd: DomainDesignFacadeCommand = {
      _attributes: {
        _code,
        rule: 'FacadeCommand',
        name,
        fields,
        description: context.createDesc(desc as any),
      },
      agg,
      service,
    }
    context.registerFacadeCommand(facadeCmd)
    return facadeCmd
  }
}
