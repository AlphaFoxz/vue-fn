import { field } from './field'
import { commandProvider, facadeCmdProvider } from './command'
import { eventProvider } from './event'
import { personProvider } from './person'
import { descProvider } from './desc'
import { aggProvider } from './agg'
import { systemProvider } from './system'
import { policyProvider } from './policy'
import { serviceProvider } from './service'
import { genId, useInternalContext } from './common'

export function createDomainDesigner() {
  const designCode = genId()
  const createDesc = descProvider(designCode)
  const createPerson = personProvider(designCode)
  const createCommand = commandProvider(designCode)
  const createFacadeCommand = facadeCmdProvider(designCode)
  const createAgg = aggProvider(designCode)
  const createEvent = eventProvider(designCode)
  const createSystem = systemProvider(designCode)
  const createPolicy = policyProvider(designCode)
  const createService = serviceProvider(designCode)
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

export type DomainDesigner = ReturnType<typeof createDomainDesigner>

export type {
  DomainDesignAgg,
  DomainDesignCommand,
  DomainDesignDesc,
  DomainDesignEvent,
  DomainDesignField,
  DomainDesignFields,
  DomainDesignPerson,
} from './define'
