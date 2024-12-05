import { nanoid } from 'nanoid'
import {
  ArrowType,
  DomainDesignAgg,
  DomainDesignAggProvider,
  DomainDesignCommand,
  DomainDesignCommandProvider,
  DomainDesignDescProvider,
  DomainDesignEvent,
  DomainDesignEventProvider,
  DomainDesignFacadeCommand,
  DomainDesignFacadeCommandProvider,
  DomainDesignPerson,
  DomainDesignPersonProvider,
  DomainDesignPolicy,
  DomainDesignPolicyProvider,
  DomainDesignService,
  DomainDesignServiceProvider,
  DomainDesignSystem,
  DomainDesignSystemProvider,
} from './define'

export function genId(): string {
  return nanoid()
}

type ContextInitializer = () => {
  createDesc: DomainDesignDescProvider
  createPerson: DomainDesignPersonProvider
  createCommand: DomainDesignCommandProvider<any>
  createFacadeCommand: DomainDesignFacadeCommandProvider<any>
  createAgg: DomainDesignAggProvider<any>
  createEvent: DomainDesignEventProvider<any>
  createPolicy: DomainDesignPolicyProvider
  createService: DomainDesignServiceProvider
  createSystem: DomainDesignSystemProvider
}

export type DomainDesignInternalContext = ReturnType<typeof createInternalContext>
const _internalContextMap: Record<string, ReturnType<typeof createInternalContext>> = {}

function createInternalContext(initFn: ContextInitializer) {
  const initResult = initFn()
  //NOTE: arrows的键为"srcid,destid"
  const arrows: Record<string, ArrowType> = {}
  const idMap: Record<string, object> = {}
  const commands: DomainDesignCommand<any>[] = []
  const facadeCommands: DomainDesignFacadeCommand<any>[] = []
  const persons: DomainDesignPerson[] = []
  const events: DomainDesignEvent<any>[] = []
  const policies: DomainDesignPolicy[] = []
  const services: DomainDesignService[] = []
  const systems: DomainDesignSystem[] = []
  const aggs: DomainDesignAgg<any>[] = []
  return {
    getArrows() {
      return arrows
    },
    getIdMap() {
      return idMap
    },
    getCommands() {
      return commands
    },
    getFacadeCommands() {
      return facadeCommands
    },
    getPersons() {
      return persons
    },
    getEvents() {
      return events
    },
    getPolicies() {
      return policies
    },
    getServices() {
      return services
    },
    getSystems() {
      return systems
    },
    getAggs() {
      return aggs
    },
    registerCommand(command: DomainDesignCommand<any>) {
      idMap[command._attributes._code] = command
      commands.push(command)
    },
    registerFacadeCommand(command: DomainDesignFacadeCommand<any>) {
      idMap[command._attributes._code] = command
      facadeCommands.push(command)
    },
    registerPerson(person: DomainDesignPerson) {
      idMap[person._attributes._code] = person
      persons.push(person)
    },
    registerEvent(event: DomainDesignEvent<any>) {
      idMap[event._attributes._code] = event
      events.push(event)
    },
    registerPolicy(policy: DomainDesignPolicy) {
      idMap[policy._attributes._code] = policy
      policies.push(policy)
    },
    registerService(service: DomainDesignService) {
      idMap[service._attributes._code] = service
      services.push(service)
    },
    registerSystem(system: DomainDesignSystem) {
      idMap[system._attributes._code] = system
      systems.push(system)
    },
    registerAgg(agg: DomainDesignAgg<any>) {
      idMap[agg._attributes._code] = agg
      aggs.push(agg)
    },
    link(from: string, to: string, arrowType: ArrowType = 'Normal') {
      arrows[`${from},${to}`] = arrowType
    },
    createDesc: initResult.createDesc,
    createPersion: initResult.createPerson,
    createCommand: initResult.createCommand,
    createFacadeCommand: initResult.createFacadeCommand,
    createAgg: initResult.createAgg,
    createEvent: initResult.createEvent,
    createPolicy: initResult.createPolicy,
    createService: initResult.createService,
    createSystem: initResult.createSystem,
  }
}

export function useInternalContext(designCode: string, initFn?: ContextInitializer) {
  if (!_internalContextMap[designCode]) {
    if (!initFn) {
      throw new Error('initFn is required')
    }
    _internalContextMap[designCode] = createInternalContext(initFn)
  }
  return _internalContextMap[designCode]
}
