import type { AppLocale } from "@/lib/i18n/types"

const en = {
  "nav.howItWorks": "How it works",
  "nav.locations": "Locations",
  "nav.trips": "Trips",
  "nav.help": "Help",
  "nav.findCar": "Find a car",
  "footer.tagline": "One search. Multiple agencies.",
  "footer.ctaTitle": "Find the right car for your next trip across Tunisia.",
  "footer.searchCars": "Search cars",
  "footer.partner": "Partner with Wheelio",
  "footer.rights": "© 2026 Wheelio TN. All rights reserved.",
  "footer.currency": "Prices shown in Tunisian dinar (TND).",
  "footer.languages": "Languages",
  "admin.demoBanner":
    "Admin preview — demo data, not live money. Changes stay in this browser.",
  "admin.home": "Home",
  "admin.applications": "Applications",
  "admin.agencies": "Agencies",
  "admin.bookings": "Bookings",
  "admin.cases": "Cases",
  "admin.claims": "Claims",
  "admin.sla": "SLA",
  "admin.finance": "Finance",
  "admin.vehicles": "Vehicles",
  "admin.categories": "Categories",
  "admin.locations": "Locations",
  "admin.content": "Content",
  "admin.reviews": "Reviews",
  "admin.promotions": "Promotions",
  "admin.customers": "Customers",
  "admin.analytics": "Analytics",
  "admin.staff": "Staff",
  "admin.audit": "Audit",
  "admin.settings": "Settings",
  "admin.searchPlaceholder": "Ref, phone, plate, agency…",
  "admin.forbidden": "You do not have access",
  "admin.forbiddenHint": "Ask a super-admin to grant this role.",
  "admin.askSuper": "Ask super",
  "admin.error": "Something went wrong",
  "admin.retry": "Retry",
  "admin.dualPending": "Waiting on second approver",
  "admin.dualApprove": "Approve as second signer",
  "admin.dualReject": "Reject request",
  "admin.mfaRequired": "Confirm MFA before this write",
  "preview.banner":
    "Read-only preview from Wheelio admin. You cannot save changes on this surface.",
  "preview.exit": "Exit preview",
  "dual.requestTitle": "Dual-control required",
  "dual.requestBody":
    "A second Wheelio staff member must confirm before this runs.",
  "dual.submit": "Submit for approval",
  "cms.publish": "Publish",
  "cms.unpublish": "Unpublish",
  "cms.draft": "Draft",
  "cms.published": "Published",
  "cms.save": "Save",
} as const

export type MessageKey = keyof typeof en

const fr: Record<MessageKey, string> = {
  "nav.howItWorks": "Comment ça marche",
  "nav.locations": "Lieux",
  "nav.trips": "Trajets",
  "nav.help": "Aide",
  "nav.findCar": "Trouver une voiture",
  "footer.tagline": "Une recherche. Plusieurs agences.",
  "footer.ctaTitle":
    "Trouvez la bonne voiture pour votre prochain trajet en Tunisie.",
  "footer.searchCars": "Chercher des voitures",
  "footer.partner": "Devenir partenaire",
  "footer.rights": "© 2026 Wheelio TN. Tous droits réservés.",
  "footer.currency": "Prix affichés en dinar tunisien (TND).",
  "footer.languages": "Langues",
  "admin.demoBanner":
    "Aperçu admin — données de démo, pas d’argent réel. Les changements restent dans ce navigateur.",
  "admin.home": "Accueil",
  "admin.applications": "Candidatures",
  "admin.agencies": "Agences",
  "admin.bookings": "Réservations",
  "admin.cases": "Tickets",
  "admin.claims": "Réclamations",
  "admin.sla": "SLA",
  "admin.finance": "Finance",
  "admin.vehicles": "Véhicules",
  "admin.categories": "Catégories",
  "admin.locations": "Lieux",
  "admin.content": "Contenu",
  "admin.reviews": "Avis",
  "admin.promotions": "Promotions",
  "admin.customers": "Clients",
  "admin.analytics": "Analytique",
  "admin.staff": "Équipe",
  "admin.audit": "Audit",
  "admin.settings": "Réglages",
  "admin.searchPlaceholder": "Réf., téléphone, plaque, agence…",
  "admin.forbidden": "Accès refusé",
  "admin.forbiddenHint":
    "Demandez à un super-admin d’accorder ce rôle.",
  "admin.askSuper": "Contacter super",
  "admin.error": "Une erreur est survenue",
  "admin.retry": "Réessayer",
  "admin.dualPending": "En attente du second approbateur",
  "admin.dualApprove": "Approuver (2e signature)",
  "admin.dualReject": "Rejeter la demande",
  "admin.mfaRequired": "Confirmez le MFA avant cette écriture",
  "preview.banner":
    "Aperçu lecture seule depuis l’admin Wheelio. Aucune modification n’est enregistrée.",
  "preview.exit": "Quitter l’aperçu",
  "dual.requestTitle": "Double validation requise",
  "dual.requestBody":
    "Un second membre du staff Wheelio doit confirmer avant exécution.",
  "dual.submit": "Soumettre pour approbation",
  "cms.publish": "Publier",
  "cms.unpublish": "Dépublier",
  "cms.draft": "Brouillon",
  "cms.published": "Publié",
  "cms.save": "Enregistrer",
}

export const messages: Record<AppLocale, Record<MessageKey, string>> = {
  en,
  fr,
}

export function translate(
  locale: AppLocale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let out = messages[locale][key] ?? messages.en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v))
    }
  }
  return out
}
