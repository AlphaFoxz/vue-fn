import { DomainDesignDesc, DomainDesignPerson } from './define'
import { _optionalDesc } from './desc'

export function person(name: string, desc?: string | DomainDesignDesc): DomainDesignPerson {
  return {
    rule: 'Person',
    name,
    description: _optionalDesc(desc),
  }
}
