/** Contact Us. Public copy from website-content.md section 8. */

export const hero = {
  eyebrow: "Contact us",
  headline: "Let's discuss the next useful step.",
  body: "Contact Sayfer Bio about scaffold evaluation, research collaboration, laboratory or technical support, cultivated-meat ecosystem development, investment, or a general inquiry.",
  supporting:
    "A short, specific explanation of your interest helps us understand the right next conversation.",
};

export const categories = {
  heading: "Inquiry categories",
  rows: [
    ["Scaffold evaluation or research", "What application or performance question would you like to explore?"],
    ["Laboratory or technical support", "What capability, service, or expertise could support the programme?"],
    ["Investment", "Introduce yourself and the investment context you would like to discuss."],
    ["Consortium", "Use the dedicated expression-of-interest form, or contact us with a question."],
    ["Media or general inquiry", "Tell us the topic and any relevant deadline."],
    ["Separate initiative in the Archive", "Name the initiative and the purpose of the inquiry."],
    ["Other", "Briefly explain your reason for contacting the team."],
  ] as [string, string][],
};

export const form = {
  heading: "Contact form",
  intro:
    "Please do not send confidential research, proprietary formulations, unpublished inventions, or sensitive personal information through this form. A general inquiry does not create a confidentiality agreement.",
  fields: [
    { name: "fullName", label: "Full name", required: true, type: "text", help: "Your name." },
    { name: "email", label: "Email", required: true, type: "email", help: "Your preferred contact email." },
    { name: "organisation", label: "Organisation", required: false, type: "text", help: "Your organisation or affiliation." },
    {
      name: "inquiryType",
      label: "Inquiry type",
      required: true,
      type: "select",
      options: [
        "Scaffold evaluation or research",
        "Laboratory or technical support",
        "Investment",
        "Consortium",
        "Media or general inquiry",
        "Separate initiative in the Archive",
        "Other",
      ],
    },
    { name: "subject", label: "Subject", required: true, type: "text", help: "A short summary of the inquiry." },
    {
      name: "message",
      label: "Message",
      required: true,
      type: "textarea",
      help: "Explain the context, proposed contribution or request, and any relevant timing.",
    },
    { name: "profile", label: "Website or professional profile", required: false, type: "url", help: "An optional relevant public link." },
  ],
  consent:
    "I agree that Sayfer Bio may use the information I provide to respond to my inquiry, as described in the Privacy Notice.",
  submitLabel: "Send inquiry",
  messages: {
    success: "Your inquiry has been submitted. Thank you for contacting Sayfer Bio.",
    failure: "We could not submit your inquiry. Please try again.",
    missing: "Please complete the required fields.",
    email: "Please enter a valid email address.",
    unavailable:
      "The inquiry form is temporarily unavailable. Please try again later.",
  },
};

export const directContact = {
  heading: "Direct contact details",
  body: "Approved public contact details will be listed here.",
  pending: [
    "Public contact email",
    "Approved company social profile, if any",
    "Public location, if appropriate",
  ],
};
