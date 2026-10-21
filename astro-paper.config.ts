import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://alteranlabs.co.uk/",
    title: "Alteran Labs",
    description:
      "Portfolio and blog of Alteran: full-stack web development, DevOps and the odd rant.",
    author: "Alteran",
    profile: "https://alteranlabs.co.uk/about/",
    lang: "en",
    timezone: "Europe/London",
    dir: "ltr",
  },
  posts: {
    perPage: 6,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/AlteranAncient" },
    { name: "linkedin", url: "https://www.linkedin.com/in/davidjamesmays/" },
    { name: "x",        url: "https://x.com/Alteran_Ancient" },
    { name: "steam",    url: "https://steamcommunity.com/id/AlteranAncient" },
    { name: "mail",     url: "mailto:webmaster@alteranlabs.co.uk" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "linkedin", url: "https://www.linkedin.com/sharing/share-offsite/?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
