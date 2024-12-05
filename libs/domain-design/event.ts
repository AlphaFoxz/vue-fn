import { genId, useInternalContext } from './common'
import {
  DomainDesignFields,
  DomainDesignEvent,
  DomainDesignDesc,
  DomainDesignPolicy,
  DomainDesignSystem,
  DomainDesignEventProvider,
} from './define'

export function eventProvider(designCode: string): DomainDesignEventProvider<any> {
  return <FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignEvent<FIELDS> => {
    const context = useInternalContext(designCode)
    const _code = genId()

    function policy(param: DomainDesignPolicy): DomainDesignPolicy
    function policy(name: string, desc?: string | DomainDesignDesc): DomainDesignPolicy
    function policy(param1: DomainDesignPolicy | string, desc?: string | DomainDesignDesc): DomainDesignPolicy {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const p = context.createPolicy(param1, desc)
      context.link(_code, p._attributes._code)
      return p
    }

    function system(param: DomainDesignSystem): DomainDesignSystem
    function system(name: string, desc?: string | DomainDesignDesc): DomainDesignSystem
    function system(param1: DomainDesignSystem | string, desc?: string | DomainDesignDesc): DomainDesignSystem {
      if (typeof param1 === 'object') {
        context.link(_code, param1._attributes._code)
        return param1
      }
      const s = context.createSystem(param1, desc)
      context.link(_code, s._attributes._code)
      return s
    }
    const event: DomainDesignEvent<FIELDS> = {
      _attributes: {
        _code,
        rule: 'Event',
        name,
        fields,
        description: context.createDesc(desc as any),
      },
      inner: fields,
      policy,
      system,
    }
    context.registerEvent(event)
    return event
  }
}
