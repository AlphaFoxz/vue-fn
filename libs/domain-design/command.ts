import { DomainDesignFields, DomainDesignCommand, DomainDesignDesc } from './define'
import { _optionalDesc } from './desc'

export function cmd<FIELDS extends DomainDesignFields>(
  fields: FIELDS,
  desc?: string | DomainDesignDesc
): DomainDesignCommand {
  return {
    rule: 'Command',
    fields,
    description: _optionalDesc(desc),
  }
}

export function facadeCmd<FIELDS extends DomainDesignFields>(
  fields: FIELDS,
  desc?: string | DomainDesignDesc
): DomainDesignCommand {
  return {
    rule: 'FacadeCommand',
    fields,
    description: _optionalDesc(desc),
  }
}
