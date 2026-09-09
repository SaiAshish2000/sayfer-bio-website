/** About & Platform Vision. Public copy from website-content.md section 4. */

export const hero = {
  eyebrow: "About & platform vision",
  headline: "Why Sayfer Bio exists, and where it is going.",
  body: "Sayfer Bio is an early-stage cultivated-meat company with a focused first priority: developing and evaluating a bone-like scaffold intended for food applications.",
  supporting:
    "Our long-term goal is to help make cultivated-meat production possible in India. We are beginning with one material-development programme and seeking the expertise and access needed to advance it responsibly.",
};

export const missionVision = [
  {
    label: "Our mission",
    body: "To advance cultivated-meat development in India through focused technical work, evidence, and collaboration.",
  },
  {
    label: "Our vision",
    body: "A cultivated-meat platform in which material development, cell-culture understanding, and practical process engineering work together to support useful food products.",
  },
];

export const whatPlatformMeans = {
  heading: "What we mean by a platform",
  body: [
    "By platform, we mean an eventual set of connected technical capabilities for cultivated-meat development, not an operating factory or a completed production system today.",
    "Our intended progression is to understand the scaffold, evaluate its interaction with a relevant biological system, and then investigate how those results inform integrated prototypes and process development.",
  ],
};

/**
 * The four stages exactly as given in website-content.md 4.5. `key` selects the
 * progression visual and `short` is a display shorthand for the same stage --
 * the authority's own stage name, focus and status are all still rendered
 * verbatim alongside it. No stage claims completion.
 */
export const developmentDirection = {
  heading: "Our development direction",
  /**
   * Bridging line only. Introduces no facts beyond the status wording already
   * carried by the stages themselves ("Current priority" ... "Long-term
   * ambition"), and states plainly that later stages are intent, not results.
   */
  note: "Four stages in one development programme. The first is where the work sits today; the stages after it describe intended direction, not completed results.",
  stages: [
    {
      key: "structure",
      short: "Structure",
      stage: "Scaffold development",
      focus: "Define and understand the material.",
      status: "Current priority",
    },
    {
      key: "biological",
      short: "Biological evaluation",
      stage: "Material and biological evaluation",
      focus: "Establish performance in a relevant application.",
      status: "Next validation work",
    },
    {
      key: "integrated",
      short: "Integrated prototype",
      stage: "Integrated prototypes",
      focus: "Explore how the scaffold and biological system work together.",
      status: "Subsequent development, dependent on results",
    },
    {
      key: "future",
      short: "Future platform",
      stage: "Process and platform capability",
      focus: "Address repeatability, manufacturing practicality, and wider integration.",
      status: "Long-term ambition",
    },
  ],
};

export const whyIndia = {
  heading: "Why India matters to us",
  body: [
    "We want India to be a place where cultivated-meat capabilities are developed, tested, and understood, not only discussed as developments happening elsewhere.",
    "Our contribution begins with a focused technical programme and an invitation to others who want to help develop the field through useful, clearly defined work.",
  ],
};

export const howWeBuild = {
  heading: "How we intend to build",
  body: [
    "We intend to seek external laboratory access and work with people whose expertise complements our own. We do not assume that every capability must be created inside one company.",
    "Our priorities are to distinguish observations from assumptions, define the next useful experiment, and advance only when the evidence supports the next commitment.",
  ],
  actions: [
    { label: "Explore our scaffold", href: "/our-scaffold" },
    { label: "Discuss a collaboration", href: "/contact" },
  ],
};
