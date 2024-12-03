import { genId, useInternalContext } from './common'
import { DomainDesignDesc, DomainDesignSystem, DomainDesignSystemFn } from './define'
import { _optionalDesc } from './desc'

export function systemFn(designCode: string): DomainDesignSystemFn {
  return (name: string, desc?: string | DomainDesignDesc) => {
    const context = useInternalContext(designCode)
    const _code = genId()
    const system: DomainDesignSystem = {
      _attributes: {
        _code,
        rule: 'System',
        name,
        description: _optionalDesc(desc),
      },
    }
    context.registerSystem(system)
    return system
  }
}
