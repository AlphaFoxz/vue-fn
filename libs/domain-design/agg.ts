import { DomainDesignField, DomainDesignEvent, DomainDesignCommand } from './define'

type CustomerStateRecords<T> = keyof T extends never ? {} : Record<string, DomainDesignField<any>>
type CustomerCommandRecords<T> = keyof T extends never ? {} : Record<string, DomainDesignCommand>
type CustomerEventRecords<T> = keyof T extends never ? {} : Record<string, DomainDesignEvent>

export function agg<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  init: () => {
    states?: STATES
    commands?: COMMANDS
    events?: EVENTS
  }
) {
  return {
    ...init(),
  }
}
