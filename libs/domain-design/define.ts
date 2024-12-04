// ========================== 描述 ==========================
export interface DomainDesignDescFn {
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
export type DomainDesignDescValue = DomainDesignField<any> | DomainDesignCommand | DomainDesignEvent<any>

// ========================== 字段 ==========================
export type DomainDesignFieldFn<T extends DomainDesignFieldType> = (
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
export type DomainDesignPersonFn = (name: string, desc?: string | DomainDesignDesc) => DomainDesignPerson
export type DomainDesignPerson = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Person'
    name: string
    description?: DomainDesignDesc
  }
  command(command: DomainDesignCommand): DomainDesignCommand
  command(name: string, fields: DomainDesignFields, desc?: string | DomainDesignDesc): DomainDesignCommand
  facadeCmd(command: DomainDesignFacadeCommand): DomainDesignFacadeCommand
  facadeCmd(name: string, fields: DomainDesignFields, desc?: string | DomainDesignDesc): DomainDesignFacadeCommand
}>

// ========================== 指令 ==========================
export type DomainDesignCommandFn = (
  name: string,
  fields: DomainDesignFields,
  desc?: string | DomainDesignDesc
) => DomainDesignCommand
export type DomainDesignCommand = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Command'
    name: string
    fields: DomainDesignFields
    description?: DomainDesignDesc
  }
  agg<AGG extends DomainDesignAgg<any>>(agg: AGG): AGG
  agg<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignAgg<FIELDS>
}>

export type DomainDesignFacadeCommandFn = (
  name: string,
  fields: DomainDesignFields,
  desc?: string | DomainDesignDesc
) => DomainDesignFacadeCommand
export type DomainDesignFacadeCommand = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'FacadeCommand'
    name: string
    fields: DomainDesignFields
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
export type DomainDesignEventFn<FIELDS extends DomainDesignFields> = (
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
export type DomainDesignAggFn<FIELDS extends DomainDesignFields> = (
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
  event<FIELDS extends DomainDesignFields>(event: FIELDS): DomainDesignEvent<FIELDS>
}>

// ========================== 规则 ==========================
export type DomainDesignPolicyFn = (name: string, desc?: string | DomainDesignDesc) => DomainDesignPolicy
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
export type DomainDesignSystemFn = (name: string, desc?: string | DomainDesignDesc) => DomainDesignSystem
export type DomainDesignSystem = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'System'
    name: string
    description?: DomainDesignDesc
  }
}>

// ========================== 服务 ==========================
export type DomainDesignServiceFn = (name: string, desc?: string | DomainDesignDesc) => DomainDesignService
export type DomainDesignService = Readonly<{
  readonly _attributes: {
    _code: string
    rule: 'Service'
    name: string
    description?: DomainDesignDesc
  }
  command(command: DomainDesignCommand): DomainDesignCommand
  command(name: string, fields: DomainDesignFields, desc?: string | DomainDesignDesc): DomainDesignCommand
  agg<AGG extends DomainDesignAgg<any>>(agg: AGG): AGG
  agg<FIELDS extends DomainDesignFields>(
    name: string,
    fields: FIELDS,
    desc?: string | DomainDesignDesc
  ): DomainDesignAgg<FIELDS>
}>

// ========================== 上下文 ==========================
export type ArrowType = 'Normal'
