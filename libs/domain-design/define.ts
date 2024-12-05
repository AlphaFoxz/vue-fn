// ========================== 描述 ==========================
export interface DomainDesignDescProvider {
  (temp: undefined): undefined
  (temp: string): DomainDesignDesc
  (temp: DomainDesignDesc): DomainDesignDesc
  (temp: TemplateStringsArray, ...values: DomainDesignDescValue[]): DomainDesignDesc
}
export type DomainDesignDesc = Readonly<{
  readonly _attributes: {
    rule: 'Desc'
    readonly template: TemplateStringsArray
    readonly values: DomainDesignDescValue[]
  }
}>
export type DomainDesignDescValue = DomainDesignField<any> | DomainDesignCommand<any> | DomainDesignEvent<any>

// ========================== 字段 ==========================
export type DomainDesignFieldProvider<T extends DomainDesignFieldType> = (
  name: string,
  desc?: string | DomainDesignDesc
) => DomainDesignField<T>
export type DomainDesignFieldType = 'String' | 'Number' | 'Time' | 'Enumeration' | 'Unknown' | 'ID'
export type DomainDesignField<T extends DomainDesignFieldType> = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Field'
    type: T
    name: string
    description?: DomainDesignDesc
  }
}>
export type DomainDesignFields = Record<string, DomainDesignField<any>>

// ========================== 用户 ==========================
export type DomainDesignPersonProvider = (name: string, desc?: string | DomainDesignDesc) => DomainDesignPerson
export type DomainDesignPerson = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Person'
    name: string
    description?: DomainDesignDesc
  }
  command<COMMAND extends DomainDesignCommand<any>>(command: COMMAND): COMMAND
  command<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignCommand<FIELDS>
  facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>>(command: FACADECMD): FACADECMD
  facadeCmd<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignFacadeCommand<FIELDS>
}>

// ========================== 指令 ==========================
export type DomainDesignCommandProvider<FIELDS extends DomainDesignFields> = (
  name: string,
  fields: DomainDesignFields,
  desc?: string | DomainDesignDesc
) => DomainDesignCommand<FIELDS>
export type DomainDesignCommand<FIELDS extends DomainDesignFields> = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Command'
    name: string
    fields: FIELDS
    description?: DomainDesignDesc
  }
  agg<AGG extends DomainDesignAgg<any>>(agg: AGG): AGG
  agg<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignAgg<FIELDS>
}>

export type DomainDesignFacadeCommandProvider<FIELDS extends DomainDesignFields> = (
  name: string,
  fields: FIELDS,
  desc?: string | DomainDesignDesc
) => DomainDesignFacadeCommand<FIELDS>
export type DomainDesignFacadeCommand<FIELDS extends DomainDesignFields> = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'FacadeCommand'
    name: string
    fields: FIELDS
    description?: DomainDesignDesc
  }
  agg<AGG extends DomainDesignAgg<any>>(agg: AGG): AGG
  agg<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignAgg<FIELDS>
  service(service: DomainDesignService): DomainDesignService
  service(name: string, desc?: string | DomainDesignDesc): DomainDesignService
}>

// ========================== 事件 ==========================
export type DomainDesignEventProvider<FIELDS extends DomainDesignFields> = (
  name: string,
  fields: FIELDS,
  desc?: string | DomainDesignDesc
) => DomainDesignEvent<FIELDS>
export type DomainDesignEvent<FIELDS extends DomainDesignFields> = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Event'
    name: string
    fields: FIELDS
    description?: DomainDesignDesc
  }
  inner: FIELDS
  policy(policy: DomainDesignPolicy): DomainDesignPolicy
  policy(name: string, desc?: string | DomainDesignDesc): DomainDesignPolicy
  system(system: DomainDesignSystem): DomainDesignSystem
  system(name: string, desc?: string | DomainDesignDesc): DomainDesignSystem
}>

// ========================== 聚合 ==========================
export type DomainDesignAggProvider<FIELDS extends DomainDesignFields> = (
  name: string,
  fields: FIELDS,
  desc?: string | DomainDesignDesc
) => DomainDesignAgg<FIELDS>
export type DomainDesignAgg<FIELDS extends DomainDesignFields> = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Agg'
    name: string
    fields: FIELDS
    description?: DomainDesignDesc
  }
  inner: FIELDS
  event<EVENT extends DomainDesignEvent<any>>(event: EVENT): EVENT
  event<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignEvent<FIELDS>
}>

// ========================== 规则 ==========================
export type DomainDesignPolicyProvider = (name: string, desc?: string | DomainDesignDesc) => DomainDesignPolicy
export type DomainDesignPolicy = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Policy'
    name: string
    description?: DomainDesignDesc
  }
  service(service: DomainDesignService): DomainDesignService
  service(name: string, desc?: string | DomainDesignDesc): DomainDesignService
}>

// ========================== 外部系统 ==========================
export type DomainDesignSystemProvider = (name: string, desc?: string | DomainDesignDesc) => DomainDesignSystem
export type DomainDesignSystem = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'System'
    name: string
    description?: DomainDesignDesc
  }
  command<COMMAND extends DomainDesignCommand<any>>(command: COMMAND): COMMAND
  command<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignCommand<FIELDS>
  facadeCmd<FACADECMD extends DomainDesignFacadeCommand<any>>(facadeCmd: FACADECMD): FACADECMD
  facadeCmd<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignFacadeCommand<FIELDS>
}>

// ========================== 服务 ==========================
export type DomainDesignServiceProvider = (name: string, desc?: string | DomainDesignDesc) => DomainDesignService
export type DomainDesignService = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Service'
    name: string
    description?: DomainDesignDesc
  }
  command<COMMAND extends DomainDesignCommand<any>>(command: COMMAND): COMMAND
  command<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignCommand<FIELDS>
  agg<AGG extends DomainDesignAgg<any>>(agg: AGG): AGG
  agg<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignAgg<FIELDS>
}>

// ========================== 上下文 ==========================
export type ArrowType = 'Normal'
