import stdFs from "fs";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

const args = yargs(hideBin(process.argv))
    .option("path", { alias: "p", type: "string", describe: "Path to the folder containing photos." })
    .argv;

async function start() {
    const { path: p = "./" } = await args;
    
    const now = new Date();
    const root = path.resolve(__dirname, p);
    console.log(`timewising photos in ${root}`);

    const drafts = new Map<string, string>();
    const errors = new Map<string, string>();

    const files = await fs.readdir(root);
    console.log(`files found: ${files.length}`);

    const logFile = path.resolve(root, `timewise_photos-${now.getTime() / 1000 | 0}-${nanoid(12)}.txt`);
    const log = stdFs.createWriteStream(logFile, { flags: "a" });

    log.write(`time: ${now.toISOString()}\n`);
    log.write(`root: ${root}\n`);

    let success = 0;

    process.stdout.write(`making draft...\r`);
    for (const fName of files) {
        const fPath = path.resolve(root, fName);
        try {
            const stats = await fs.lstat(fPath);
            if (!stats.isFile() || stats.isSymbolicLink()) continue;

            const { mtime, ctime } = stats;
            const createTime = mtime < ctime ? mtime : ctime;

            const folder = `${createTime.getFullYear()}/${(createTime.getMonth() + 1).toString(10).padStart(2, '0')}`;
            drafts.set(fPath, path.resolve(root, folder, fName));
        } catch (err) {
            errors.set(fPath, `${err}`);
            log.write(`err: ${fPath} => ${err}\n`);
        }
    }

    const size = drafts.size;
    process.stdout.write(`draft prepared [total: ${size}]\n`);

    process.stdout.write(makeProgressMessage(success, errors.size, size));
    for (const [src, dest] of drafts) {
        try {
            await fs.mkdir(dest.substring(0, dest.lastIndexOf(path.sep)), { recursive: true }).catch(() => { /* no-op */ });
            await fs.rename(src, dest);

            log.write(`move: ${src} => ${dest}\n`);
            success++;
        } catch (err) {
            log.write(`err: ${src} => ${err}\n`);
            errors.set(src, `${err}`);
        }
        
        process.stdout.write(makeProgressMessage(success, errors.size, size));
    }

    log.end();
    console.log(`\ncheck logs: ${logFile}`);
    console.log(`\noperation completed.`);
}

function makeProgressMessage(success: number, fail: number, total: number) {
    // next line is never shorter than previous line
    // only \r is fine to be used with stdout
    return `file moved ${success} out of ${total}${fail ? ` (${fail} failed)` : ""}\r`;
}

start();