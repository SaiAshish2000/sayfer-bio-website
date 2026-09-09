/** Consortium. Public copy from website-content.md section 5. */

export const hero = {
  eyebrow: "Consortium",
  headline: "Help build India's cultivated-meat industry.",
  body: "Sayfer Bio is inviting expressions of interest in forming a cultivated-meat industry consortium in India.",
  supporting:
    "We want to connect people working on the scientific, technical, commercial, and responsible-development questions that the field needs to address.",
  status: "Proposed initiative; gathering expressions of interest.",
  action: { label: "Express interest", href: "#express-interest" },
};

export const whatIsProposed = {
  heading: "What is being proposed?",
  body: [
    "We propose a forum where relevant participants can identify shared challenges, exchange appropriate non-confidential knowledge, and explore useful collaboration.",
    "The purpose is not to require everyone to pursue the same technology. It is to identify where working together could support progress while respecting independent research and business interests.",
  ],
};

export const whoIsInvited = {
  heading: "Who is invited?",
  groups: [
    "Researchers and academic groups",
    "Cultivated-meat startups and developers",
    "Suppliers of relevant materials, inputs, equipment, and services",
    "Food and bioprocess specialists",
    "Food-safety and regulatory professionals",
    "Investors and ecosystem organisations",
    "Independent contributors with relevant expertise",
  ],
  note: "Participation should be relevant to cultivated-meat development in India. International contributors may express interest in supporting that purpose.",
};

export const collaborationAreas = {
  heading: "Potential areas of collaboration",
  rows: [
    ["Research and evaluation", "Identify practical research questions and appropriate evaluation approaches."],
    ["Laboratory and technical access", "Connect projects with relevant capabilities and expertise."],
    ["Materials and process development", "Discuss non-confidential challenges in scaffolds, inputs, and process integration."],
    ["Skills and knowledge exchange", "Explore useful educational discussions and researcher connections."],
    ["Evidence-based communication", "Improve the clarity of public explanations and discussion of uncertainty."],
    ["Responsible development", "Exchange perspectives on safety, quality, and regulatory questions without claiming regulatory authority."],
  ] as [string, string][],
  note: "These are proposed topics, not operating working groups or guaranteed services.",
};

export const principles = {
  heading: "Principles for the proposed initiative",
  body: [
    "We propose a collaborative environment grounded in scientific integrity, accurate communication, respect for confidential information, and clearly defined contributions.",
    "Participation should not imply automatic access to another organisation's intellectual property, endorsement of a product, or an obligation to share sensitive commercial information.",
    "Formal governance, membership arrangements, and any future activities would need to be defined with the appropriate participants.",
  ],
};

export const afterInterest = {
  heading: "What happens after someone expresses interest?",
  body: [
    "We will review the information provided to understand the participant's interests and potential contribution. Where there is a relevant next conversation, the team may make contact.",
    "Submitting the form is not confirmation of membership, funding, access to facilities, or a commercial partnership. Any public listing of participants would require a separate decision and permission.",
  ],
};

export const form = {
  heading: "Expression of interest",
  intro:
    "Please do not include confidential research, unpublished inventions, proprietary formulations, or sensitive commercial information.",
  fields: [
    { name: "fullName", label: "Full name", required: true, type: "text", help: "Your name." },
    { name: "email", label: "Email", required: true, type: "email", help: "An address where we can contact you; personal addresses are welcome." },
    { name: "organisation", label: "Organisation or affiliation", required: false, type: "text", help: "Include Independent where appropriate." },
    { name: "role", label: "Role or area of work", required: false, type: "text", help: "Your role or relevant expertise." },
    { name: "country", label: "Country", required: true, type: "text", help: "Your country." },
    { name: "location", label: "City / state", required: false, type: "text", help: "Your location at city or state level." },
    {
      name: "category",
      label: "Participant category",
      required: true,
      type: "select",
      options: [
        "Research / academia",
        "Cultivated-meat company",
        "Supplier / service provider",
        "Food industry",
        "Safety / regulatory",
        "Investor / ecosystem",
        "Independent contributor",
        "Other",
      ],
    },
    {
      name: "interests",
      label: "Areas of interest",
      required: true,
      type: "checkboxes",
      options: [
        "Research and evaluation",
        "Laboratory and technical access",
        "Materials and process development",
        "Skills and knowledge exchange",
        "Evidence-based communication",
        "Responsible development",
      ],
    },
    {
      name: "contribution",
      label: "Potential contribution",
      required: true,
      type: "textarea",
      help: "What would you like to contribute, discuss, or help develop?",
    },
    { name: "profile", label: "Website or professional profile", required: false, type: "url", help: "A relevant public link." },
  ],
  consent:
    "I agree that Sayfer Bio may use the information I provide to review and respond to this expression of interest, as described in the Privacy Notice.",
  updates:
    "I would also like to receive future updates about the proposed consortium.",
  submitLabel: "Submit expression of interest",
  success:
    "Thank you. Your expression of interest has been submitted for review. This is not confirmation of consortium membership.",
  failure:
    "We could not submit your expression of interest. Please try again. No membership has been created.",
};

export const faqs = [
  {
    q: "Is the consortium already established?",
    a: "No. This is an invitation to help shape a proposed initiative.",
  },
  {
    q: "Are membership fees defined?",
    a: "No membership fee is being requested through this expression-of-interest form. Any future arrangements would be communicated separately.",
  },
  {
    q: "Will my name be published?",
    a: "Submitting an expression of interest does not give permission to publish your name or affiliation as a member.",
  },
  {
    q: "Do I need to disclose my technology?",
    a: "No. A non-confidential description of your interests and possible contribution is sufficient.",
  },
];
