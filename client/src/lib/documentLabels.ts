// Document definitions with labels (matching ApplicationForm.tsx)
export const baseRequiredDocuments = [
  {
    key: "buildPlans",
    label: "Build plans, structural analysis, bill of materials, and specification signed by a duly licensed civil engineer/architect",
  },
  {
    key: "electricalPermit",
    label: "Electrical permit/plan signed by a duly licensed professional electrical engineer",
  },
  {
    key: "sanitaryPermit",
    label: "Sanitary/plumbing permit signed by a duly licensed master plumber/sanitary engineer",
  },
  { key: "taxDeclaration", label: "Tax declaration" },
  { key: "transferTitle", label: "Transfer certificate of title" },
  { key: "taxReceipt", label: "Tax receipt of current year" },
  { key: "barangayClearance", label: "Barangay clearance" },
  { key: "doleApplication", label: "DOLE application (CHSP) - Grand Central" },
];

export const nonLotOwnerDocuments = [
  { key: "lotOwnerAuthorization", label: "Authorization from the lot owner" },
  { key: "constructAuthorization", label: "Authorization to erect/construct building" },
];

// Helper to get the document index (number)
function getDocumentIndex(documentKey: string): number {
  const allDocs = [...baseRequiredDocuments, ...nonLotOwnerDocuments];
  const index = allDocs.findIndex((d) => d.key === documentKey);
  return index >= 0 ? index + 1 : 0;
}

// Helper to get formatted label with numbering based on documentKey
export function getFormattedDocumentLabel(documentKey: string): string {
  const allDocs = [...baseRequiredDocuments, ...nonLotOwnerDocuments];
  const doc = allDocs.find((d) => d.key === documentKey);
  if (!doc) return `Document`;
  const number = getDocumentIndex(documentKey);
  return `${number}. ${doc.label}`;
}

// Helper to get label without numbering
export function getDocumentLabel(documentKey: string): string {
  const allDocs = [...baseRequiredDocuments, ...nonLotOwnerDocuments];
  const doc = allDocs.find((d) => d.key === documentKey);
  return doc?.label || documentKey;
}
