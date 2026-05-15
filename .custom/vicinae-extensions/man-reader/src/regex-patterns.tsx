/** Regex patterns used throughout the man reader extension */
export const patterns = {
	/** Matches overstrike formatting sequences (character + backspace + character) */
	overstrike: /.\x08/g,

	/** Matches lines beginning with an uppercase letter, indicating a man page section header */
	sectionStart: /^[A-Z]/,

	/** Matches lines consisting entirely of uppercase letters and spaces, used to detect top-level section titles */
	sectionTitle: /^[A-Z][A-Z\s]+$/,

	/** Matches lines that are empty or contain only whitespace, used to split paragraphs */
	blankLine: /^\s*$/,

	/** Matches man page header/footer lines like "GREP(1)  User Commands  GREP(1)" or version footers */
	manHeaderFooter: /^[A-Z][A-Z0-9_-]*\(\d+\)\s+.*\s+[A-Z][A-Z0-9_-]*\(\d+\)\s*$/,

	/** Captures the description text from a NAME section line like "grep - print lines that match patterns" */
	nameSection: /^NAME\n\s+\S+\s+-\s+(.+)$/m,
	/** Matches trailing ellipsis notation used in man page synopsis entries */
	trailingEllipsis: /\s*\.\.\./g,

	/** Matches a man page flag/option line (indented ~5 spaces, starting with a dash) */
	optionFlag: /^\s{2,8}-/,

	/** Matches a man page sub-section header (indented ~3 spaces, starts with uppercase) */
	optionSubHeader: /^\s{2,4}[A-Z][a-zA-Z]/,
} as const;
