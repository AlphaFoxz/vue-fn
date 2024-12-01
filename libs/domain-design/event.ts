import { DomainDesignFields, DomainDesignEvent } from './define'
import { _optionalDesc } from './desc'

export function event<FIELDS extends DomainDesignFields>(fields: FIELDS, desc?: string): DomainDesignEvent {
  return {
    rule: 'Event',
    fields,
    description: _optionalDesc(desc),
  }
}
