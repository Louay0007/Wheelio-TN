import type { VehicleCategory } from "@/lib/search-types"
import { cn } from "@/lib/utils"

type CategoryIconProps = {
  category: VehicleCategory
  className?: string
  title?: string
}

const titles: Record<VehicleCategory, string> = {
  economy: "Economy car",
  compact: "Compact car",
  intermediate: "Intermediate car",
  suv: "SUV",
  van: "Van",
  luxury: "Luxury car",
}

/**
 * Side-profile category icons. Uses currentColor for light/dark.
 * Matching assets also live in /public/icons/categories/*.svg
 */
export function CategoryIcon({ category, className, title }: CategoryIconProps) {
  const label = title ?? titles[category]
  const common = {
    viewBox: "0 0 64 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: cn("size-full", className),
    role: "img" as const,
    "aria-label": label,
  }

  switch (category) {
    case "economy":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* Small city hatch — short overhangs, upright greenhouse */}
          <path
            d="M10 27.5h44.5c1.2 0 2.2-.9 2.2-2.1v-2.8c0-1.4-.7-2.7-1.9-3.5l-7.8-5.1c-1.1-.7-2.4-1.1-3.7-1.1H24.2c-1.5 0-2.9.6-3.9 1.7L15.2 20c-.7.8-1.7 1.3-2.8 1.3H9.8c-1.1 0-2 .9-2 2v2.1c0 1.2 1 2.1 2.2 2.1Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M22.5 14.2 18.8 20.2h12.2l.8-6h-6.2c-1.1 0-2.1.4-2.9 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M33.2 14.2h6.8c1 0 2 .4 2.7 1.1l4.5 4.9H34l-.8-6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="18.5" cy="28.5" r="4.2" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="18.5" cy="28.5" r="1.6" fill="currentColor" />
          <circle cx="45.5" cy="28.5" r="4.2" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="45.5" cy="28.5" r="1.6" fill="currentColor" />
          <path d="M22.8 28.5h18.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "compact":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* Compact hatch — longer nose, still short overall */}
          <path
            d="M7.5 28h49c1.3 0 2.3-1 2.3-2.3v-3.2c0-1.5-.8-2.9-2.1-3.7L48 13.8c-1.2-.8-2.6-1.2-4.1-1.2H22.8c-1.6 0-3.1.7-4.1 1.9L13.4 20c-.6.7-1.5 1.2-2.5 1.2H8.2c-1.2 0-2.2 1-2.2 2.2v2.3C6 27 6.9 28 7.5 28Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M20.8 13.8 16.2 20.8h14.6l1.1-7H24c-1.2 0-2.3.4-3.2 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M33.2 13.8h8.2c1.1 0 2.1.4 2.9 1.2l5.1 5.8H34.4l-1.2-7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M48.5 21.5h6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="17.5" cy="29" r="4.3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="17.5" cy="29" r="1.6" fill="currentColor" />
          <circle cx="46" cy="29" r="4.3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="46" cy="29" r="1.6" fill="currentColor" />
          <path d="M22 29h19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "intermediate":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* Midsize sedan — longer cabin + boot */}
          <path
            d="M5.5 28.5h53c1.3 0 2.4-1 2.4-2.3v-3.5c0-1.4-.7-2.7-1.9-3.5l-6.2-4.1c-1-.7-2.2-1-3.4-1H21.5c-1.5 0-2.9.6-3.9 1.7L12.4 21c-.6.7-1.4 1.1-2.3 1.1H6.8c-1.2 0-2.1 1-2.1 2.2v1.9c0 1.3 1 2.3 2.3 2.3Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M19.5 15.2 14.8 21.5h16.2l1.4-6.3H23c-1.3 0-2.5.5-3.5 1.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M33.8 15.2h9.2c1.2 0 2.3.5 3.1 1.3l4.4 5H35.2l-1.4-6.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M49.2 21.5h8.3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="29.2" r="4.4" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16.5" cy="29.2" r="1.65" fill="currentColor" />
          <circle cx="47.5" cy="29.2" r="4.4" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="47.5" cy="29.2" r="1.65" fill="currentColor" />
          <path d="M21.2 29.2h21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "suv":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* SUV — tall body, high beltline, roof rails hint */}
          <path
            d="M6 30h52c1.4 0 2.5-1.1 2.5-2.5v-5.2c0-1.6-.9-3.1-2.3-3.8L50 14.2c-1.1-.6-2.4-.9-3.6-.9H20.8c-1.6 0-3.1.7-4.1 1.9L12.2 20c-.5.6-1.2 1-2 1H7.2C6 21 5 22 5 23.2v4.3C5 28.9 5.9 30 6 30Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 14.5 14.2 20.8h15.4l1.2-6.3H22c-1.3 0-2.6.5-3.5 1.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M32.2 14.5h11.2c1.2 0 2.3.5 3.1 1.4l4.2 4.9H33.5l-1.3-6.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M20 12.2h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M24 11h2.2M30.5 11h2.2M37 11h2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="17" cy="30.5" r="4.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="17" cy="30.5" r="1.7" fill="currentColor" />
          <circle cx="47" cy="30.5" r="4.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="47" cy="30.5" r="1.7" fill="currentColor" />
          <path d="M21.8 30.5h20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "van":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* Van / MPV — tall box, short nose, high roof */}
          <path
            d="M7 30.5h50c1.3 0 2.4-1 2.4-2.3V14.8c0-1.5-1.2-2.8-2.7-2.8H24.2c-1.4 0-2.7.6-3.6 1.7L15.5 19c-.5.6-1.2 1-2 1H8.2C7 20 6 21 6 22.2v6c0 1.3 1 2.3 2.2 2.3H7Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M22.5 13.2v7.6h10.8V13.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M35.2 13.2v7.6H53V13.8c0-.3-.3-.6-.6-.6H35.2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.8 19.5 20.8 13.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="17.5" cy="31" r="4.3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="17.5" cy="31" r="1.6" fill="currentColor" />
          <circle cx="46.5" cy="31" r="4.3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="46.5" cy="31" r="1.6" fill="currentColor" />
          <path d="M22 31h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "luxury":
      return (
        <svg {...common}>
          <title>{label}</title>
          {/* Luxury sedan — long, low, sweeping roofline */}
          <path
            d="M4.5 28.8h55c1.4 0 2.5-1.1 2.5-2.5v-2.8c0-1.6-.9-3.1-2.4-3.8L50.8 15c-1.3-.7-2.8-1.1-4.3-1.1H22.2c-1.7 0-3.4.7-4.5 2L12.2 22c-.5.6-1.2 1-2 1H5.8c-1.2 0-2.1 1-2.1 2.2v1.1c0 1.4 1.1 2.5 2.5 2.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M19.8 15.2 13.8 22.5h17.4l1.8-7.3H23.5c-1.4 0-2.7.5-3.7 1.4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M34.5 15.2h9.5c1.3 0 2.5.5 3.4 1.5l4.8 5.8H36.4l-1.9-7.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M50.5 22.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M28 12.5h8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <circle cx="16" cy="29.5" r="4.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16" cy="29.5" r="1.7" fill="currentColor" />
          <circle cx="48" cy="29.5" r="4.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="48" cy="29.5" r="1.7" fill="currentColor" />
          <path d="M20.8 29.5h22.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
  }
}
