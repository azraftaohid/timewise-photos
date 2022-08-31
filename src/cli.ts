#!/usr/bin/env node

import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { timewise } from ".";

const args = yargs(hideBin(process.argv))
    .scriptName("timewise")
    .usage("Usage: $0 [-p path/to/folder]")
    .option("path", { alias: "p", type: "string", describe: "Path to the folder containing photos." })
    .argv;

(async function start() {
    timewise((await args).path);
})().catch(err => {
    console.error(`Error timewising: ${err}`);
})