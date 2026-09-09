/**
 * Team. Public copy from website-content.md section 6, applying the V2 rules in
 * CLAUDE.md / DESIGN.md:
 *  - card order: image, role, name, LinkedIn
 *  - advisers carry the approved public title "Strategic Adviser"
 *  - Dr. Justin Wong is excluded from V2 entirely
 *  - no invented biographies, credentials, or adviser specialties
 *
 * Founder-approved 2026-09-08 (see [C3] in website-content.md), superseding the
 * earlier notes in this file:
 *  - the founder's public role is "Founder / CEO"
 *  - sai@sayferbio.com is approved for public display
 *  - Svarnim Samant is named publicly under the associate title, with her
 *    LinkedIn and svarnim@sayferbio.com; only the portrait is still pending, so
 *    that card carries an explicit pending image state
 *
 * LinkedIn URLs: references/TEAM_LINKS.md
 */

export const hero = {
  eyebrow: "Team",
  headline: "A focused team, building through collaboration.",
  body: "Sayfer Bio is led by one founder, supported by a research and ecosystem development associate and advisers willing to contribute relevant knowledge.",
  supporting:
    "The immediate focus is the scaffold programme and the technical relationships needed to advance it.",
};

export type Member = {
  name: string;
  role: string;
  image?: string;
  linkedin?: string;
  email?: string;
  blurb?: string;
}

export const founder: Member = {
  name: "Sai Ashish Sarvasetty",
  role: "Founder / CEO",
  image: "/team/sai-ashish-sarvasetty.webp",
  linkedin: "https://www.linkedin.com/in/sai-ashish-sarvasetty-b55553253",
  email: "sai@sayferbio.com",
  blurb:
    "Sai leads Sayfer Bio's cultivated-meat direction, with an initial focus on the bone-like scaffold programme and the collaborations needed to move it forward.",
};

export const associatePlaceholder = {
  name: "Svarnim Samant",
  role: "Research and Ecosystem Development Associate",
  note: "Profile details will be published once approved.",
  linkedin: "https://www.linkedin.com/in/svarnim-samant-a02686250/",
  email: "svarnim@sayferbio.com",
};

export const advisersIntro =
  "We are building with input from advisers who are willing to contribute knowledge relevant to the company's development.";

export const advisers: Member[] = [
  {
    name: "Dipesh Lad",
    role: "Strategic Adviser",
    image: "/team/dipesh-lad.webp",
    linkedin: "https://www.linkedin.com/in/dipesh-lad",
  },
  {
    name: "Dr. Heidi Coia",
    role: "Strategic Adviser",
    image: "/team/heidi-coia.webp",
    linkedin: "https://www.linkedin.com/in/heidicoia",
  },
  {
    name: "Dr. Paula Elbl",
    role: "Strategic Adviser",
    image: "/team/paula-elbl.webp",
    linkedin: "https://www.linkedin.com/in/paulaelbl",
  },
  {
    name: "Cyrus Karimy",
    role: "Strategic Adviser",
    image: "/team/cyrus-karimy.webp",
    linkedin: "https://www.linkedin.com/in/cyrus-karimy",
  },
];

export const connect = {
  heading: "Connect with the team",
  body: "Have expertise relevant to scaffold evaluation, cultivated meat, or the development of the industry in India? Tell us what you work on and where you see a useful connection.",
  action: { label: "Discuss a contribution", href: "/contact" },
  note: "This is not a promise of employment, an internship, an advisory appointment, or a paid role.",
};
