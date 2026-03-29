/** Industries / sectors for bill proposal intake (stored in `category` on BillProposal). */
export const BILL_PROPOSAL_SECTORS = [
  'Agriculture & food systems',
  'Mining & natural resources',
  'Energy & utilities',
  'Manufacturing & industry',
  'Trade, retail & services',
  'Financial services & inclusion',
  'ICT & digital economy',
  'Transport & infrastructure',
  'Housing & urban development',
  'Health & social care',
  'Education & skills',
  'Labour & social protection',
  'Justice, governance & anti-corruption',
  'Environment & climate',
  'Arts, culture, media & sport',
  'Zimbabwe Diaspora',
] as const

export type BillProposalSector = (typeof BILL_PROPOSAL_SECTORS)[number]

export const DEFAULT_BILL_PROPOSAL_SECTOR: BillProposalSector = BILL_PROPOSAL_SECTORS[0]

const sectorSet = new Set<string>(BILL_PROPOSAL_SECTORS)

export function isBillProposalSector(value: string): value is BillProposalSector {
  return sectorSet.has(value)
}
