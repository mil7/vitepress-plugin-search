import { Plugin, ResolvedConfig } from "vite";
import { IndexSearch } from "./md-index-builder";
import { Options } from "./types";

export interface SearchData {
  PREVIEW_LOOKUP: string;
  INDEX_DATA: string;
  Options: Options;
}

const DEFAULT_OPTIONS: Options = {
  previewLength: 62,
  buttonLabel: "Search",
  placeholder: "Search docs",
};

export function SearchPlugin(searchOptions?: Partial<Options>): Plugin {
  // eslint-disable-next-line no-unused-vars
  const options = {
    ...DEFAULT_OPTIONS,
    ...searchOptions,
  };

  let config: ResolvedConfig;
  let computedIndex = false;
  const virtualModuleId = "virtual:search-data";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-search",
    enforce: "pre",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    config: () => ({
      resolve: {
        alias: { "./VPNavBarSearch.vue": "vitepress-plugin-search/Search.vue" },
      },
    }),

    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(this, id) {
      if (id !== resolvedVirtualModuleId) return;
      if (!config.build.ssr || !computedIndex) {
        //so we don't compute index search twice
        computedIndex = true;
        return await IndexSearch(config.root, options);
      }
      return `const INDEX_DATA = { };
			const PREVIEW_LOOKUP = {};
			const Options = ${JSON.stringify(options)};
			const data = { INDEX_DATA, PREVIEW_LOOKUP, Options };
			export default data;`;
    },
  };
}
