/**
 * Giscus comments (https://giscus.app), stored in GitHub Discussions.
 *
 * Comments stay hidden until repo, repoId, category and categoryId are all set.
 * Get the values by picking your repo and category on giscus.app; they appear
 * in the generated <script> tag as data-repo, data-repo-id and so on.
 */
export const GISCUS = {
  repo: "", // e.g. "AlteranAncient/alteranlabs.co.uk"
  repoId: "",
  category: "", // e.g. "Comments" (an Announcement-type category is best)
  categoryId: "",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  lang: "en",
  loading: "lazy",
  lightTheme: "light",
  darkTheme: "dark",
};
