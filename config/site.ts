export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Professor GENIE Platform",
  description:
    "AI-powered platform that helps professors streamline course management, generate discussion responses, and create engaging educational content.",
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
