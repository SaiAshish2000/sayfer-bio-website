/** Our Scaffold. Public copy from website-content.md section 3. */

export const hero = {
  eyebrow: "Our scaffold",
  headline: "Developing a bone-like scaffold for cultivated meat.",
  body: "Sayfer Bio is developing a zein-based structure intended for food applications and potential integration into structured cultivated-meat products.",
  objective:
    "Our immediate objective is to understand the material's performance and establish where it can make a useful contribution.",
  status: "Early material prototype; further evaluation required.",
};

export const whatWeAreDeveloping = {
  heading: "What are we developing?",
  body: [
    "Our starting point is a bone-like material structure, not a finished cultivated-meat product. We are investigating its potential use as a structural component and its suitability for a relevant cell-culture application.",
    "The intended direction is food development. This is not a medical implant programme or a claim that we have grown biological bone.",
  ],
};

export const whyScaffold = {
  heading: "Why investigate a scaffold?",
  body: [
    "Scaffolds are supporting structures studied in tissue development. In cultivated-meat research, their role can include helping organise a product and providing a surface or structure relevant to cell growth. Researchers have investigated plant-protein scaffolds, including zein-containing materials.",
    "Sayfer Bio's question is specific: can our bone-like material perform a useful role in a defined structured-food or cultivated-meat application?",
    "Existing research provides context. It does not establish the performance or novelty of our particular material.",
  ],
};

export const twoFunctions = {
  heading: "Two intended functions to evaluate separately",
  functions: [
    {
      title: "Structural role",
      body: "We want to understand whether the material can provide a useful bone-like structure under the handling and processing conditions of its intended food application.",
    },
    {
      title: "Biological role",
      body: "We want to evaluate whether it is suitable for a relevant animal-cell system and can support the intended biological interaction.",
    },
  ],
  note: "A suitable shape does not, by itself, establish cell compatibility. These are separate questions in our development programme.",
};

export const currentStage = {
  heading: "Current stage",
  rows: [
    ["Material prototype", "An early zein-based, bone-like material prototype exists."],
    ["Reproducibility", "Manufacturing repeatability requires systematic assessment."],
    ["Wet-state behaviour", "Performance in the intended wet environment requires evaluation."],
    ["Biological performance", "Cell compatibility and growth performance are not yet established."],
    ["Food use", "Intended for food applications; finished-product suitability requires assessment."],
    [
      "Manufacturing and commercial readiness",
      "Production economics and commercial readiness remain development questions.",
    ],
  ] as [string, string][],
};

export const nextQuestions = {
  heading: "What we want to learn next",
  rows: [
    ["Repeatability", "Can we prepare the material consistently enough for meaningful evaluation?"],
    ["Material performance", "How does it behave when handled and exposed to its intended environment?"],
    ["Biological compatibility", "How does a selected, relevant cell system respond to the material?"],
    ["Food-use behaviour", "How does the structure behave under its intended preparation and use conditions?"],
    ["Practical manufacture", "What would be required to make, assess, and supply it reliably?"],
  ] as [string, string][],
  note: "These are proposed evaluation areas, not completed results or a promised timetable.",
};

export const whoShouldContact = {
  heading: "Who should contact us?",
  body: [
    "We welcome discussions with cultivated-meat developers working on structured products, laboratories with relevant material or animal-cell evaluation capabilities, and researchers in food biomaterials and tissue engineering.",
    "A useful first conversation identifies the intended application, the question to be tested, the capabilities available, and what would make the result meaningful.",
  ],
  action: { label: "Discuss a scaffold evaluation", href: "/contact?topic=scaffold" },
  guidance:
    "Tell us your application, the performance question you want to explore, and the support or expertise you can contribute. Please do not send confidential technical material through the general inquiry form.",
};
