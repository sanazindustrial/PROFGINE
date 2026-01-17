export interface NavItem {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  elements?: NavItem[]
  type: string
}

export interface DropDownItem {
  title: string
  href?: string
  elements: NavItem[]
  type: string
}
