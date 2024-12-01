export type DomainDesignDesc = {
  rule: 'Desc'
  template: TemplateStringsArray
  values: DomainDesignDescValue[]
}
export type DomainDesignDescValue = DomainDesignField<any> | DomainDesignCommand | DomainDesignEvent

export type DomainDesignFieldType = 'str' | 'num' | 'time' | 'enumeration'
export type DomainDesignField<T extends DomainDesignFieldType> = {
  rule: 'Field'
  type: T
  description?: DomainDesignDesc
}
export type DomainDesignFields = Record<string, DomainDesignField<any>>

export type DomainDesignPerson = {
  rule: 'Person'
  name: string
  description?: DomainDesignDesc
}

export type DomainDesignCommand = {
  rule: 'Command' | 'FacadeCommand'
  fields: DomainDesignFields
  description?: DomainDesignDesc
}

export type DomainDesignEvent = {
  rule: 'Event'
  fields: DomainDesignFields
  description?: DomainDesignDesc
}
