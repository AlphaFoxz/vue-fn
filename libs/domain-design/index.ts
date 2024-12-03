import { field } from './field'
import { commandFn, facadeCmdFn } from './command'
import { eventFn } from './event'
import { personFn } from './person'
import { descFn } from './desc'
import { aggFn } from './agg'
import { systemFn } from './system'
import { policyFn } from './policy'
import { serviceFn } from './service'
import { genId, useInternalContext } from './common'

export function createDomainDesigner() {
  const designCode = genId()
  const createDesc = descFn(designCode)
  const createPerson = personFn(designCode)
  const createCommand = commandFn(designCode)
  const createFacadeCommand = facadeCmdFn(designCode)
  const createAgg = aggFn(designCode)
  const createEvent = eventFn(designCode)
  const createSystem = systemFn(designCode)
  const createPolicy = policyFn(designCode)
  const createService = serviceFn(designCode)
  useInternalContext(designCode, () => {
    return {
      createDesc,
      createPerson,
      createCommand,
      createFacadeCommand,
      createAgg,
      createEvent,
      createSystem,
      createPolicy,
      createService,
    }
  })

  return {
    field,
    desc: createDesc,
    person: createPerson,
    facadeCmd: createFacadeCommand,
    command: createCommand,
    agg: createAgg,
    event: createEvent,
    system: createSystem,
    policy: createPolicy,
    service: createService,
    _getContext: () => useInternalContext(designCode),
  }
}

export type {
  DomainDesignAgg,
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignEvent,
  DomainDesignField,
  DomainDesignFields,
  DomainDesignPerson,
} from './define'
