import { useState, useEffect, useRef } from "react";
import { Plus, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import Preloader from "@/components/Preloader";
import debounce from "lodash.debounce";
import Workspace from "@/models/workspace";
import { Tooltip } from "react-tooltip";

const DEFAULT_SEARCH_RESULTS = {
  workspaces: [],
  threads: [],
};

const SEARCH_RESULT_SELECTED = "search-result-selected";
export default function SearchBox({ user, showNewWsModal }) {
  const { t } = useTranslation();
  const searchRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(DEFAULT_SEARCH_RESULTS);
  const [isExpanded, setIsExpanded] = useState(false);
  const handleSearch = debounce(handleSearchDebounced, 500);

  async function handleSearchDebounced(e) {
    try {
      const searchValue = e.target.value;
      setSearchTerm(searchValue);
      setLoading(true);
      const searchResults =
        await Workspace.searchWorkspaceOrThread(searchValue);
      setSearchResults(searchResults);
    } catch (error) {
      console.error(error);
      setSearchResults(DEFAULT_SEARCH_RESULTS);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (searchRef.current) searchRef.current.value = "";
    setSearchTerm("");
    setLoading(false);
    setSearchResults(DEFAULT_SEARCH_RESULTS);
    setIsExpanded(false);
  }

  useEffect(() => {
    window.addEventListener(SEARCH_RESULT_SELECTED, handleReset);
    return () =>
      window.removeEventListener(SEARCH_RESULT_SELECTED, handleReset);
  }, []);

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-x-2 w-[250px]">
        <button
          onClick={() => setIsExpanded(true)}
          className="text-theme-text-secondary hover:text-theme-text-primary border-none bg-transparent outline-none flex items-center justify-center p-1 rounded-md"
          data-tooltip-id="search-icon-tooltip"
          data-tooltip-content={t("common.search")}
        >
          <MagnifyingGlass size={22} weight="bold" />
        </button>
        <button
          onClick={showNewWsModal}
          className="text-theme-text-secondary hover:text-theme-text-primary border-none bg-transparent outline-none flex items-center justify-center p-1 rounded-md"
          data-tooltip-id="new-ws-icon-tooltip"
          data-tooltip-content={t("new-workspace.title")}
        >
          <Plus size={24} weight="bold" />
        </button>
        <Tooltip id="search-icon-tooltip" place="bottom" delayShow={300} className="tooltip !text-xs z-99" />
        <Tooltip id="new-ws-icon-tooltip" place="bottom" delayShow={300} className="tooltip !text-xs z-99" />
      </div>
    );
  }

  return (
    <div className="flex gap-x-[5px] w-[250px] items-center h-[32px] relative z-30">
      <div className="relative h-full w-full flex">
        <input
          ref={searchRef}
          type="search"
          autoFocus
          placeholder={t("common.search")}
          onChange={handleSearch}
          onReset={handleReset}
          onFocus={(e) => e.target.select()}
          className="border-none w-full h-full rounded-lg bg-zinc-800 light:bg-slate-300 pl-9 pr-8 placeholder:text-white/50 light:placeholder:text-slate-500 placeholder:font-semibold outline-none text-theme-text-primary search-input peer text-sm"
        />
        <MagnifyingGlass
          size={14}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-settings-input-placeholder peer-focus:text-theme-text-primary"
          weight="bold"
        />
        <button
          onClick={handleReset}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-theme-text-secondary hover:text-white p-1"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
      <SearchResults
        searchResults={searchResults}
        searchTerm={searchTerm}
        loading={loading}
      />
    </div>
  );
}

function SearchResultWrapper({ children }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-full flex flex-col gap-y-[24px] h-auto bg-theme-modal-border light:bg-theme-bg-primary light:border-2 light:border-theme-modal-border rounded-lg p-[16px] z-10 max-h-[400px] overflow-y-scroll no-scroll">
      {children}
    </div>
  );
}

function SearchResults({ searchResults, searchTerm, loading }) {
  if (!searchTerm || searchTerm.length < 3) return null;
  if (loading)
    return (
      <SearchResultWrapper>
        <div className="flex flex-col gap-y-[8px] h-[200px] justify-center items-center">
          <Preloader size={5} />
          <p className="text-theme-text-secondary text-xs font-semibold text-center">
            Searching for "{searchTerm}"
          </p>
        </div>
      </SearchResultWrapper>
    );

  if (
    searchResults.workspaces.length === 0 &&
    searchResults.threads.length === 0
  ) {
    return (
      <SearchResultWrapper>
        <div className="flex flex-col gap-y-[8px] h-[200px] justify-center items-center">
          <p className="text-theme-text-secondary text-xs font-semibold text-center">
            No results found for
            <br />
            <span className="text-theme-text-primary font-semibold text-sm">
              "{searchTerm}"
            </span>
          </p>
        </div>
      </SearchResultWrapper>
    );
  }

  return (
    <SearchResultWrapper>
      <SearchResultCategory
        name="Workspaces"
        items={searchResults.workspaces?.map((workspace) => ({
          id: workspace.slug,
          to: paths.workspace.chat(workspace.slug),
          name: workspace.name,
        }))}
      />
      <SearchResultCategory
        name="Threads"
        items={searchResults.threads?.map((thread) => ({
          id: thread.slug,
          to: paths.workspace.thread(thread.workspace.slug, thread.slug),
          name: thread.name,
          hint: thread.workspace.name,
        }))}
      />
    </SearchResultWrapper>
  );
}

function SearchResultCategory({ items, name }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-y-[8px]">
      <p className="text-theme-text-secondary text-xs uppercase font-semibold px-[4px]">
        {name}
      </p>
      <div className="flex flex-col gap-y-[6px]">
        {items.map((item) => (
          <SearchResultItem
            key={item.id}
            to={item.to}
            name={item.name}
            hint={item.hint}
          />
        ))}
      </div>
    </div>
  );
}

function SearchResultItem({ to, name, hint }) {
  return (
    <Link
      to={to}
      onClick={() => window.dispatchEvent(new Event(SEARCH_RESULT_SELECTED))}
      className="hover:bg-[#FFF]/10 light:hover:bg-[#000]/10 transition-all duration-300 rounded-sm px-[8px] py-[2px]"
    >
      <p className="text-theme-text-primary text-sm truncate w-[80%]">
        {name}
        {hint && (
          <span className="text-theme-text-secondary text-xs ml-[4px]">
            | {hint}
          </span>
        )}
      </p>
    </Link>
  );
}
