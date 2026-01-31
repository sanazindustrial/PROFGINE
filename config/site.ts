export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "ProfGENIE Platform",
  description:
    "A grading tool and course design studio.",
  mainNav: [
    {
      title: "Dicussion Response Generator",
      href: "/",
      type: "link",
    },
    {
      title: "Grading Generator",
      href: "/grade",
      type: "link",
    },
    {
      title: "Admin Panel",
      type: "dropdown",
      elements: [
        {
          title: "User Management",
          href: "/user-management",
          type: "link",
        },
      ],
    },
  ],
  // links: {
  //   // twitter: "https://twitter.com/shadcn",
  //   // github: "https://github.com/shadcn/ui",
  //   // docs: "https://ui.shadcn.com",
  // },
}
