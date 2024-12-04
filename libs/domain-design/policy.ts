import { genId, useInternalContext } from './common'
import { DomainDesignDesc, DomainDesignPolicy, DomainDesignPolicyFn, DomainDesignService } from './define'
import { _optionalDesc } from './desc'

export function policyFn(designCode: string): DomainDesignPolicyFn {
  return (name: string, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
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
    const policy: DomainDesignPolicy = {
      _attributes: {
        _code,
        rule: 'Policy',
        name,
        description: _optionalDesc(desc),
      },
      service,
    }
    context.registerPolicy(policy)
    return policy
  }
}