import { Action, ActionPanel, List } from "@vicinae/api";
import { ChildProcess, exec } from "node:child_process";
import { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

async function getOrfBaseDir(): Promise<string> {
	const home = process.env.HOME ?? process.env.USERPROFILE;
	if (!home) return "";

	const configPath = path.join(home, ".custom", "configs", "orf");

	const rel = await fs
		.readFile(configPath, "utf-8")
		.then((raw) => raw.trim())
		.catch(() => "/");

	return path.join(home, rel);
}

const norm = (s: string): string => s.trim().toLowerCase();

async function findRepos(
	baseDir: string,
	term: string,
): Promise<readonly string[]> {
	const safeTerm = norm(term);
	if (!baseDir || !safeTerm)
		return Object.freeze([] as readonly string[]);

	const firstLevel = await fs.readdir(baseDir, { withFileTypes: true });

	const allFirstLevelDirs = firstLevel
		.filter((d: Dirent<string>) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
		.map((d: Dirent<string>) => path.join(baseDir, d.name));

	const matchesAtFirstLevel = allFirstLevelDirs
		.filter((p: string) => {
			const name = path.basename(p);
			return name.toLowerCase().includes(safeTerm);
		});

	const matchesAtSecondLevel = await Promise.all(
		allFirstLevelDirs.map(async (dir1Path: string) => {
			const secondLevel = await fs.readdir(dir1Path, {
				withFileTypes: true,
			});
			return secondLevel
				.filter((d: Dirent<string>) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
				.map((d: Dirent<string>) => path.join(dir1Path, d.name))
				.filter((p: string) => {
					const name = path.basename(p);
					return name.toLowerCase().includes(safeTerm);
				});
		}),
	);

	const allCandidates = [
		...matchesAtFirstLevel,
		...matchesAtSecondLevel.flat(),
	];

	const withGit = await Promise.all(
		allCandidates.map(async (p: string) => {
			const hasGit = await fs
				.access(path.join(p, ".git"))
				.then(() => true)
				.catch(() => false);
			return hasGit ? p : null;
		}),
	);

	return Object.freeze(withGit.filter((p: string | null): p is string => p !== null));
}

async function openRepoInCode(_repoPath: string): Promise<void> {
	exec(`code ${_repoPath}`);
}

function ReposResults({
	baseDir,
	searchTerm,
}: {
	baseDir: string;
	searchTerm: string;
}) {
	// @vicinae/api runs in a React runtime; require hooks.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const React = require("react") as typeof import("react");

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const [repos, setRepos] = React.useState<readonly string[]>(
		Object.freeze([]),
	);

	// eslint-disable-next-line react-hooks/rules-of-hooks
	React.useEffect(() => {
		let cancelled = false;
		void (async () => {
			const next = await findRepos(baseDir, searchTerm);
			if (!cancelled) setRepos(next);
		})();

		return () => {
			cancelled = true;
		};
	}, [baseDir, searchTerm]);

	return (
		<List.Section title="Results" key={searchTerm}>
			{repos.map((repoPath: string) => {
				const title = path.basename(repoPath);
				return (
					<List.Item
						key={repoPath}
						id={repoPath}
						title={title}
						keywords={[repoPath]}
						actions={
							<ActionPanel>
								<Action
									title={`Open: ${title}`}
									onAction={async () => {
										await openRepoInCode(repoPath);
									}}
								/>
							</ActionPanel>
						}
					/>
				);
			})}
		</List.Section>
	);
}

export default function OrfCommand() {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const React = require("react") as typeof import("react");

	const [baseDir, setBaseDir] = React.useState<string>("");
	const [searchText, setSearchText] = React.useState<string>("");

	React.useEffect(() => {
		void getOrfBaseDir().then(setBaseDir);
	}, []);

	return (
		<List
			searchBarPlaceholder="Search local repos (orf)…"
			throttle={false}
			searchText={searchText}
			onSearchTextChange={(text: string) => setSearchText(text)}
			// Only match on folder names; we do the matching ourselves.
			filtering={false}

		>
			{baseDir ? (
				<ReposResults baseDir={baseDir} searchTerm={searchText} />
			) : null}
			<List.EmptyView/>
		</List>

	);
}

