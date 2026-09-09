/** Archive. Public copy from website-content.md section 7. One page, three entries. */

export const hero = {
  eyebrow: "Archive",
  headline: "Separate initiatives and exploratory work.",
  body: [
    "This archive documents other initiatives and concepts associated with the founder. They are included for context and are not part of Sayfer Bio's active cultivated-meat development programme.",
    "Sayfer Bio's current focus remains cultivated meat, beginning with its bone-like scaffold.",
    "Archive does not necessarily mean that an initiative has been abandoned. Each entry explains its relationship to the current company focus.",
  ],
};

export type Entry = {
  name: string;
  status: string;
  summary: string;
  overview: string;
  relationship: string;
  extra?: { label: string; body: string };
};

export const entries: Entry[] = [
  {
    name: "Sayfer Labs",
    status: "Separate initiative; outside Sayfer Bio.",
    summary:
      "Sayfer Labs is a separate initiative being developed by the founder. It has its own plan and is not part of Sayfer Bio's current cultivated-meat programme.",
    overview:
      "This entry records Sayfer Labs as a separate initiative. A fuller account of its purpose, planned activities, and development status will be added from its own approved project brief.",
    relationship:
      "Its inclusion here does not mean Sayfer Bio owns or operates laboratory infrastructure, or has secured access to facilities through Sayfer Labs.",
  },
  {
    name: "Ora",
    status: "Separate functional-beverage concept; outside Sayfer Bio.",
    summary:
      "Ora is a separate functional-beverage concept for women. It is not part of Sayfer Bio's cultivated-meat development programme.",
    overview:
      "The concept explores a flavoured beverage intended for a regular consumption routine. Its formulation, intended benefit, safety assessment, and commercial plan require their own development work.",
    relationship:
      "Ora is not presented as a Sayfer Bio product or as the financial basis for its cultivated-meat research.",
    extra: {
      label: "Original motivation",
      body: "The founder's initial interest concerned women's experience around menstruation. That motivation is not evidence that the beverage improves menstrual symptoms or cycle regularity.",
    },
  },
  {
    name: "Food-waste collection and processing",
    status: "Exploratory concept; outside Sayfer Bio's current programme.",
    summary:
      "An exploratory concept for collecting and processing selected food or agricultural side streams in India.",
    overview:
      "The founder's interest includes materials such as sugarcane-related residues and fruit or vegetable peels. The concept would need to define a specific input, collection approach, processing method, useful output, and intended user.",
    relationship:
      "No established connection is being claimed between these materials and Sayfer Bio's scaffold or cell-culture inputs.",
    extra: {
      label: "Current scope",
      body: "This entry describes a direction of interest, not an operating collection network or a validated processing business.",
    },
  },
];

export const closing = {
  body: "Looking for Sayfer Bio's current programme?",
  actions: [
    { label: "Explore our scaffold", href: "/our-scaffold" },
    { label: "Read our platform vision", href: "/about" },
  ],
};
