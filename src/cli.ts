#!/usr/bin/env node

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { timewise } from ".";

const args = yargs(hideBin(process.argv))
    .scriptName("timewise")
    .usage("Usage: $0 [-p path/to/folder] [-o [yyy][/mm][/dd]]")
    .option("path", { alias: "p", type: "string", describe: "Path to the folder containing photos" })
	.option("organize", { alias: "o", type: "string", describe: "Organize scheme by yyy (year), mm (month), dd (day)", default: "yyy/mm" })
	.option("max-age", { alias: "mt-before", type: "string", describe: "Maximum age of files to include (e.g., '2022-01-01')" })
	.option("min-age", { alias: "mt-after", type: "string", describe: "Minimum age of files to include (e.g., '2022-01-01')" })
	.option("max-size", { alias: "max-size", type: "number", describe: "Maximum file size in bytes" })
	.option("min-size", { alias: "min-size", type: "number", describe: "Minimum file size in bytes" })
	.option("include-pattern", { alias: "name-regex", type: "string", describe: "Regex to filter file names (e.g., '.*.jpg')" })
	.option("exclude-pattern", { type: "string", describe: "Regex to exclude file names (e.g., '.*.tmp')" })
    .argv;

(async function start() {
	const { path, organize, "include-pattern": includePattern, "exclude-pattern": excludePattern,
		 "max-age": maxAge, "min-age": minAge, "max-size": maxSize, "min-size": minSize
	} = await args;

    return timewise(path, organize, {
		...(maxAge && { maxAge }),
		...(minAge && { minAge }),
		...(maxSize && { maxSize }),
		...(minSize && { minSize }),
		...(includePattern && { includePattern: includePattern }),
		...(excludePattern && { excludePattern: excludePattern }),
	});
})().catch(err => {
    console.error(`Error timewising: ${err}`);
})