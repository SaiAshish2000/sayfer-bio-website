/** Sources & Further Reading. From website-content.md section 9.1 and the reference register. */

export const hero = {
  eyebrow: "Sources & further reading",
  headline: "The references behind our explanations.",
  body: [
    "The explanations on this website draw on public scientific and institutional sources. These references provide context about cultivated meat; they are not evidence that Sayfer Bio's scaffold or platform has been validated.",
    "Prospective environmental modelling is distinct from measured performance, and independent research is distinct from Sayfer Bio's own work.",
  ],
};

export type Source = {
  n: number;
  title: string;
  publisher: string;
  date?: string;
  note: string;
  url: string;
};

export const groups: { heading: string; sources: Source[] }[] = [
  {
    heading: "Understanding cultivated meat",
    sources: [
      {
        n: 1,
        title: "Human Food Made with Cultured Animal Cells",
        publisher: "U.S. Food and Drug Administration",
        date: "Accessed 5 September 2026",
        note: "Supports the basic production explanation and the distinction between controlled production and product-specific assessment.",
        url: "https://www.fda.gov/food/food-ingredients-packaging/human-food-made-cultured-animal-cells",
      },
      {
        n: 5,
        title: "The science of cultivated meat",
        publisher: "The Good Food Institute",
        date: "Accessed 5 September 2026",
        note: "Field context on cells, media, bioprocesses, scaffolding, and development challenges. GFI is an alternative-protein organisation; its field explanations are distinct from independent product validation.",
        url: "https://gfi.org/science/the-science-of-cultivated-meat/",
      },
    ],
  },
  {
    heading: "Safety considerations",
    sources: [
      {
        n: 2,
        title: "Food safety aspects of cell-based food",
        publisher:
          "World Health Organization and Food and Agriculture Organization of the United Nations",
        date: "Published 28 March 2023",
        note: "Identifies the need to assess technologies and potential food-safety hazards.",
        url: "https://www.who.int/publications/i/item/9789240070943",
      },
    ],
  },
  {
    heading: "Environmental assessment",
    sources: [
      {
        n: 3,
        title:
          "Ex-ante life cycle assessment of commercial-scale cultivated meat production in 2030",
        publisher:
          "Sinke, P., and colleagues. The International Journal of Life Cycle Assessment 28, 234-254",
        date: "2023",
        note: "Prospective modelling, not Sayfer Bio measurements.",
        url: "https://doi.org/10.1007/s11367-022-02128-8",
      },
      {
        n: 6,
        title:
          "Environmental Impacts of Cultured Meat: A Cradle-to-Gate Life Cycle Assessment",
        publisher:
          "Risner, D., and colleagues. ACS Food Science & Technology, volume 5, issue 1",
        date: "Online publication 2024",
        note: "Provides contrasting near-term environmental scenarios involving highly refined growth-medium inputs.",
        url: "https://pubmed.ncbi.nlm.nih.gov/39840401/",
      },
    ],
  },
  {
    heading: "Scaffold research",
    sources: [
      {
        n: 4,
        title: "3D-printed plant protein scaffolds for cell-based meat culture",
        publisher: "National University of Singapore, Faculty of Science",
        date: "May 2023",
        note: "Describes research involving zein-containing plant-protein scaffolds; it does not validate Sayfer Bio's material.",
        url: "https://www.science.nus.edu.sg/blog/2023/05/3d-printed-plant-protein-scaffolds-for-cell-based-meat-culture/",
      },
    ],
  },
];
