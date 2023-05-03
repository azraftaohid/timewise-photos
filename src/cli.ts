#!/usr/bin/env node

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { timewise } from ".";

const args = yargs(hideBin(process.argv))
    .scriptName("timewise")
    .usage("Usage: $0 [-p path/to/folder] [-o [yyy][/mm][/dd]]")
    .option("path", { alias: "p", type: "string", describe: "Path to the folder containing photos" })
	.option("organize", { alias: "o", type: "string", describe: "Organize scheme by yyy (year), mm (month), dd (day)", default: "yyy/mm" })
    .argv;

(async function start() {
	const { path, organize } = await args;
    timewise(path, organize);
})().catch(err => {
    console.error(`Error timewising: ${err}`);
})