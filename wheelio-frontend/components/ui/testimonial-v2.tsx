"use client"

import React from "react"
import { motion, useReducedMotion } from "framer-motion"

interface Testimonial {
  text: string
  image: string
  name: string
  role: string
}

const testimonials: Testimonial[] = [
  {
    text: "I could compare airport pickup, deposits, and the real total price without messaging five different agencies.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Briana Patton",
    role: "Early-access renter",
  },
  {
    text: "Seeing the mileage, fuel policy, and confirmation type together made choosing a car much less stressful.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Bilal Ahmed",
    role: "Business traveler",
  },
  {
    text: "The search is clear and fast on mobile, which is exactly what I need when planning a trip from abroad.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Saman Malik",
    role: "International visitor",
  },
  {
    text: "Wheelio gives local agencies a professional way to present availability and conditions to serious customers.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Omar Raza",
    role: "Agency owner",
  },
  {
    text: "I like that the total rental price is prominent while the refundable deposit stays clearly separated.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Zainab Hussain",
    role: "Tunis resident",
  },
  {
    text: "One consistent booking journey is a major improvement over comparing screenshots and voice notes.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Aliza Khan",
    role: "Frequent renter",
  },
  {
    text: "Filtering by transmission, luggage, and pickup method helped us find the right family car quickly.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Farhan Siddiqui",
    role: "Family traveler",
  },
  {
    text: "Clear cancellation terms and driver requirements gave me confidence before sending a booking request.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sana Sheikh",
    role: "Diaspora traveler",
  },
  {
    text: "A marketplace focused on trusted Tunisian agencies makes discovering dependable local options much easier.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Hassan Ali",
    role: "Hotel partner",
  },
]

const columns = [
  testimonials.slice(0, 3),
  testimonials.slice(3, 6),
  testimonials.slice(6, 9),
]

function TestimonialsColumn({
  className,
  testimonials: items,
  duration = 15,
}: {
  className?: string
  testimonials: Testimonial[]
  duration?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={className}>
      <motion.ul
        animate={reduceMotion ? undefined : { translateY: "-50%" }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }
        }
        className="m-0 flex list-none flex-col gap-6 bg-transparent p-0 pb-6"
      >
        {[0, 1].map((set) => (
          <React.Fragment key={set}>
            {items.map(({ text, image, name, role }, index) => (
              <motion.li
                key={`${set}-${index}`}
                aria-hidden={set === 1}
                tabIndex={set === 1 ? -1 : 0}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.025,
                        y: -6,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        },
                      }
                }
                whileFocus={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.025,
                        y: -6,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        },
                      }
                }
                className="group w-full max-w-xs cursor-default select-none rounded-[20px] border border-black/10 bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.06)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/25 dark:border-white/10 dark:bg-black dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)] dark:focus-visible:ring-white/30 sm:p-9"
              >
                <blockquote>
                  <p className="m-0 text-[15px] font-normal leading-7 text-black/65 transition-colors dark:text-white/65">
                    “{text}”
                  </p>
                  <footer className="mt-7 flex items-center gap-3">
                    <img
                      width={42}
                      height={42}
                      src={image}
                      alt={`Portrait of ${name}`}
                      loading="lazy"
                      className="size-[42px] rounded-full object-cover grayscale ring-2 ring-black/10 transition dark:ring-white/10"
                    />
                    <div className="flex flex-col">
                      <cite className="not-italic text-sm font-semibold leading-5 tracking-tight text-black dark:text-white">
                        {name}
                      </cite>
                      <span className="mt-0.5 text-xs leading-5 text-black/45 dark:text-white/45">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  )
}

export default function TestimonialsSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden border-t border-black/10 bg-white py-20 transition-colors dark:border-white/10 dark:bg-zinc-900 md:py-28"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 42 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-7xl px-6"
      >
        <div className="mx-auto mb-14 flex max-w-xl flex-col items-center justify-center md:mb-16">
          <div className="rounded-full border border-black/15 bg-black/[0.03] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black/55 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/55">
            Testimonials
          </div>
          <h2
            id="testimonials-heading"
            className="mt-6 text-center text-4xl font-normal tracking-[-0.04em] text-black transition-colors dark:text-white md:text-5xl"
          >
            What our early users say
          </h2>
          <p className="mt-5 max-w-md text-center text-base leading-7 text-black/50 transition-colors dark:text-white/50 md:text-lg">
            A clearer way to compare local agencies, understand every condition,
            and book with confidence.
          </p>
        </div>

        <div
          className="mx-auto mt-10 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
          role="region"
          aria-label="Scrolling testimonials"
        >
          <TestimonialsColumn testimonials={columns[0]} duration={15} />
          <TestimonialsColumn
            testimonials={columns[1]}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={columns[2]}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </motion.div>
    </section>
  )
}
