import {
	List,
	ActionPanel,
	Action,
	Color,
	Icon,
	showToast,
	Toast,
} from "@vicinae/api";
import { spawnSync } from "node:child_process";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { patterns } from "./regex-patterns";

enum ManSection {
	Name = "NAME",
	Synopsis = "SYNOPSIS",
	Options = "OPTIONS",
	Description = "DESCRIPTION",
	Example = "EXAMPLE",
	Examples = "EXAMPLES",
}

/** Dropdown filter value for showing all sections */
const ALL_SECTIONS = "all";

type Mode = "search" | "browse";

type ManPageSuccess = {
	readonly ok: true;
	readonly content: string;
};

type ManPageError = {
	readonly ok: false;
	readonly error: string;
};

type ManPageResult = ManPageSuccess | ManPageError;

type ManEntry = {
	readonly id: string;
	readonly title: string;
	readonly subtitle: string;
	readonly section: string;
	readonly markdown: string;
	readonly keywords: readonly string[];
};

function fetchManPage(command: string): ManPageResult {
	const result = spawnSync("man", [command], {
		encoding: "utf-8",
		timeout: 10_000,
		env: { ...process.env, MANWIDTH: "120" },
	});

	if (result.status !== 0) {
		const stderr = result.stderr ?? "";
		const error = stderr.includes("No manual entry")
			? `No manual entry for \`${command}\``
			: stderr.trim() || "Failed to fetch man page";
		return { ok: false, error };
	}

	const cleaned = (result.stdout ?? "").replace(patterns.overstrike, "");
	return { ok: true, content: cleaned };
}

/** Strips the COMMAND(N) header/footer lines and trailing version lines */
function cleanManContent(content: string): string {
	return content
		.split("\n")
		.filter((line) => !patterns.manHeaderFooter.test(line))
		.join("\n")
		.trim();
}

/** Extracts the description from the NAME section */
function extractDescription(content: string): string | undefined {
	const nameMatch = content.match(patterns.nameSection);
	return nameMatch?.[1]?.trim();
}

function parseSections(content: string): readonly string[] {
	return content
		.split("\n")
		.reduce<readonly string[][]>(
			(acc, line) => {
				const lastGroup = acc[acc.length - 1] ?? [];
				return patterns.sectionStart.test(line) && lastGroup.length > 0
					? [...acc, [line]]
					: [...acc.slice(0, -1), [...lastGroup, line]];
			},
			[[]],
		)
		.map((group) => group.join("\n"));
}

/** Dedents man page text by stripping common leading whitespace */
function dedent(text: string): string {
	const lines = text.split("\n");
	const indents = lines
		.filter((line) => !patterns.blankLine.test(line))
		.map((line) => (line.match(/^(\s*)/)?.[1] ?? "").length);
	const minIndent = Math.min(...indents);

	return minIndent > 0
		? lines.map((line) => line.slice(minIndent)).join("\n")
		: text;
}

/** Formats the SYNOPSIS section as a table of usage patterns */
function formatSynopsis(body: string): string {
	const rows = body
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => `| \`${line.replace(patterns.trailingEllipsis, "")}\` |`);

	return ["| Usage |", "| :--- |", ...rows].join("\n");
}

/** Formats a section title from ALL-CAPS to title case */
function formatSectionTitle(title: string): string {
	return title
		.trim()
		.split(/\s+/)
		.map(
			(word) =>
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join(" ");
}

type OptionEntry = {
	readonly flag: string;
	readonly description: string;
};

/** Parses an OPTIONS-style section body into individual flag entries */
function parseOptionEntries(body: string): readonly OptionEntry[] {
	const lines = body.split("\n");

	const entries = lines.reduce<{
		readonly items: readonly OptionEntry[];
		readonly currentFlag: string | undefined;
		readonly currentDesc: readonly string[];
	}>(
		(acc, line) => {
			if (patterns.optionSubHeader.test(line) && !patterns.optionFlag.test(line)) {
				const flushed = acc.currentFlag
					? {
							items: [
								...acc.items,
								{
									flag: acc.currentFlag,
									description: acc.currentDesc.join(" ").trim(),
								},
							],
							currentFlag: undefined,
							currentDesc: [] as readonly string[],
						}
					: acc;
				return { ...flushed };
			}

			if (patterns.optionFlag.test(line)) {
				const flushed = acc.currentFlag
					? [
							...acc.items,
							{
								flag: acc.currentFlag,
								description: acc.currentDesc.join(" ").trim(),
							},
						]
					: acc.items;

				return {
					items: flushed,
					currentFlag: line.trim(),
					currentDesc: [],
				};
			}

			if (acc.currentFlag && line.trim()) {
				return {
					...acc,
					currentDesc: [...acc.currentDesc, line.trim()],
				};
			}

			return acc;
		},
		{ items: [], currentFlag: undefined, currentDesc: [] },
	);

	return entries.currentFlag
		? [
				...entries.items,
				{
					flag: entries.currentFlag,
					description: entries.currentDesc.join(" ").trim(),
				},
			]
		: entries.items;
}

/** Converts parsed man page content into a flat list of ManEntry items */
function buildEntries(content: string, command: string): readonly ManEntry[] {
	const cleaned = cleanManContent(content);
	const sections = parseSections(cleaned);
	const description = extractDescription(cleaned);

	const skippedSections = new Set([ManSection.Name]);

	return sections
		.filter((section) => {
			const firstLine = (section.split("\n")[0] ?? "").trim();
			return !skippedSections.has(firstLine as ManSection);
		})
		.flatMap((section, sectionIdx) => {
			const lines = section.split("\n");
			const header = (lines[0] ?? "").trim();
			const body = lines.slice(1).join("\n");
			const sectionTitle = formatSectionTitle(header);

			if (header === ManSection.Synopsis) {
				const synopsisBody = formatSynopsis(dedent(body).trim());
				return [{
					id: `synopsis-${sectionIdx}`,
					title: "Synopsis",
					subtitle: description ?? "",
					section: ManSection.Synopsis,
					markdown: `#### Synopsis\n\n${synopsisBody}`,
					keywords: [command, "usage", "synopsis"],
				}];
			}

			if (header === ManSection.Example || header === ManSection.Examples) {
				const exampleBody = dedent(body).trim();
				return [{
					id: `examples-${sectionIdx}`,
					title: "Examples",
					subtitle: exampleBody.split("\n")[0]?.trim() ?? "",
					section: ManSection.Examples,
					markdown: `#### Examples\n\n${exampleBody}`,
					keywords: ["example", "examples", "usage"],
				}];
			}

			if (header === ManSection.Options || body.split("\n").some((l) => patterns.optionFlag.test(l))) {
				const optionEntries = parseOptionEntries(body);
				return optionEntries.map((entry, entryIdx) => ({
					id: `${header.toLowerCase()}-${sectionIdx}-${entryIdx}`,
					title: entry.flag,
					subtitle: entry.description,
					section: ManSection.Options,
					markdown: `**\`${entry.flag}\`**\n\n${entry.description}`,
					keywords: entry.flag.split(/[\s,]+/).filter(Boolean),
				}));
			}

			if (header === ManSection.Description) {
				const descBody = dedent(body).trim();
				return [{
					id: `description-${sectionIdx}`,
					title: "Description",
					subtitle: descBody.split("\n")[0]?.trim() ?? "",
					section: ManSection.Description,
					markdown: `#### Description\n\n${descBody}`,
					keywords: ["description", "about"],
				}];
			}

			const otherBody = dedent(body).trim();
			return [{
				id: `${header.toLowerCase()}-${sectionIdx}`,
				title: sectionTitle,
				subtitle: otherBody.split("\n")[0]?.trim() ?? "",
				section: header,
				markdown: `#### ${sectionTitle}\n\n${otherBody}`,
				keywords: [sectionTitle.toLowerCase()],
			}];
		});
}

/** Extracts unique section names from entries for the dropdown */
function extractSections(entries: readonly ManEntry[]): readonly string[] {
	return entries.reduce<readonly string[]>(
		(acc, entry) =>
			acc.includes(entry.section) ? acc : [...acc, entry.section],
		[],
	);
}

/** Returns the color tag for a given section */
function sectionColor(section: string): Color {
	return section === ManSection.Options
		? Color.Blue
		: section === ManSection.Synopsis
			? Color.Purple
			: section === ManSection.Examples
				? Color.Green
				: Color.SecondaryText;
}

/** Returns the icon for a given section */
function sectionIcon(section: string): Icon {
	return section === ManSection.Options
		? Icon.BulletPoints
		: section === ManSection.Examples
			? Icon.Book
			: Icon.BlankDocument;
}

export default function ManCommand() {
	const [mode, setMode] = useState<Mode>("search");
	const [searchText, setSearchText] = useState("");
	const [manContent, setManContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [currentCommand, setCurrentCommand] = useState("");
	const [sectionFilter, setSectionFilter] = useState(ALL_SECTIONS);
	const justSwitchedRef = useRef(false);

	// Fetch man page when search text changes in search mode
	useEffect(() => {
		if (mode !== "search") return;
		const trimmed = searchText.trim();
		if (!trimmed) {
			setManContent("");
			setCurrentCommand("");
			return;
		}

		setIsLoading(true);
		const result = fetchManPage(trimmed);

		if (result.ok) {
			setManContent(result.content);
			setCurrentCommand(trimmed);
			justSwitchedRef.current = true;
			setMode("browse");
			setSearchText("");
		} else {
			setManContent("");
			setCurrentCommand("");
		}

		setIsLoading(false);
	}, [searchText, mode]);

	const handleSearchTextChange = useCallback(
		(text: string) => {
			// When switching to browse, the search bar clears and fires with ""
			// Ignore that initial empty to avoid flipping back immediately
			if (justSwitchedRef.current) {
				justSwitchedRef.current = false;
				return;
			}

			if (mode === "browse" && text === "") {
				setMode("search");
				setSearchText("");
				return;
			}

			setSearchText(text);
		},
		[mode],
	);

	const backToSearch = useCallback(() => {
		setMode("search");
		setSearchText("");
		setManContent("");
		setCurrentCommand("");
		setSectionFilter(ALL_SECTIONS);
	}, []);

	const entries = useMemo(
		() => (manContent ? buildEntries(manContent, currentCommand) : []),
		[manContent, currentCommand],
	);

	const sections = useMemo(() => extractSections(entries), [entries]);

	const filteredEntries = useMemo(
		() =>
			sectionFilter === ALL_SECTIONS
				? entries
				: entries.filter((entry) => entry.section === sectionFilter),
		[entries, sectionFilter],
	);

	const commandTitle = currentCommand
		? currentCommand.charAt(0).toUpperCase() + currentCommand.slice(1)
		: "";

	const description = manContent
		? extractDescription(cleanManContent(manContent))
		: undefined;

	return (
		<List
			searchBarPlaceholder={
				mode === "browse"
					? `Filter ${currentCommand}...`
					: "Search man pages (e.g. grep, curl, git)"
			}
			isLoading={isLoading}
			throttle={mode === "search"}
			filtering={mode === "browse"}
			searchText={searchText}
			onSearchTextChange={handleSearchTextChange}
			isShowingDetail={entries.length > 0}
			navigationTitle={currentCommand ? `man ${currentCommand}` : "Man Reader"}
			searchBarAccessory={
				entries.length > 0 ? (
					<List.Dropdown
						tooltip="Filter by section"
						value={sectionFilter}
						onChange={setSectionFilter}
					>
						<List.Dropdown.Item title="All Sections" value={ALL_SECTIONS} />
						<List.Dropdown.Section title="Sections">
							{sections.map((section) => (
								<List.Dropdown.Item
									key={section}
									title={formatSectionTitle(section)}
									value={section}
								/>
							))}
						</List.Dropdown.Section>
					</List.Dropdown>
				) : undefined
			}
		>
			{!currentCommand && !isLoading && (
				<List.EmptyView
					title="Search for a command"
					description="Type a command name to view its man page"
					icon={Icon.Book}
				/>
			)}
			{currentCommand && (
				<List.Section
					title={`📖 ${commandTitle}`}
					subtitle={description}
				>
					{filteredEntries.map((entry) => (
						<List.Item
							key={entry.id}
							id={entry.id}
							title={entry.title}
							subtitle={entry.subtitle}
							icon={sectionIcon(entry.section)}
							keywords={[...entry.keywords]}
							accessories={[
								{
									tag: {
										value: formatSectionTitle(entry.section),
										color: sectionColor(entry.section),
									},
								},
							]}
							detail={
								<List.Item.Detail markdown={entry.markdown} />
							}
							actions={
								<ActionPanel>
									<Action.CopyToClipboard
										content={entry.title}
										title="Copy Entry"
										icon={Icon.CopyClipboard}
									/>
									<Action
										title="New Search"
										icon={Icon.MagnifyingGlass}
										shortcut={{ key: "escape", modifiers: ["shift"] }}
										onAction={backToSearch}
									/>
									<Action.CopyToClipboard
										content={manContent}
										title="Copy Full Man Page"
										icon={Icon.BlankDocument}
									/>
									<Action.CopyToClipboard
										content={`man ${currentCommand}`}
										title="Copy Command"
										icon={Icon.Terminal}
									/>
								</ActionPanel>
							}
						/>
					))}
				</List.Section>
			)}
		</List>
	);
}
