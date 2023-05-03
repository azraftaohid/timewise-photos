import stdFs from "fs";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";

export async function timewise(dir = "./", organize = "yyy/mm") {
    const now = new Date();
    const root = path.resolve(dir);
    console.log(`Timewising in ${root}`);

    const drafts = new Map<string, string>();
    const errors = new Map<string, string>();

    const files = await fs.readdir(root);
    console.log(`Files found: ${files.length}`);

    const logFile = path.resolve(root, `timewise_photos-${now.getTime() / 1000 | 0}-${nanoid(12)}.txt`);
    const log = stdFs.createWriteStream(logFile, { flags: "a" });

    log.write(`time: ${now.toISOString()}\n`);
    log.write(`root: ${root}\n`);

    let success = 0;

    process.stdout.write(`Making draft...\r`);
    for (const fName of files) {
        const fPath = path.resolve(root, fName);
        try {
            const stats = await fs.lstat(fPath);
            if (!stats.isFile() || stats.isSymbolicLink()) continue;

            const { mtimeMs, ctimeMs, birthtimeMs, atimeMs } = stats;
            const createTime = new Date(Math.min(birthtimeMs, mtimeMs, ctimeMs, atimeMs));

			const folder = organize.replace(/(\/|^)yyy(\/|$)/, `/${createTime.getFullYear()}/`)
				.replace(/(\/|^)mm(\/|$)/, `/${(createTime.getMonth() + 1).toString(10).padStart(2, '0')}/`)
				.replace(/(\/|^)dd(\/|$)/, `/${createTime.getDate().toString(10).padStart(2, '0')}/`)
				.replace(/^\/+/, "");

            drafts.set(fPath, path.resolve(root, folder, fName));
        } catch (err) {
            errors.set(fPath, `${err}`);
            log.write(`err: ${fPath} => ${err}\n`);
        }
    }

    const size = drafts.size;
    process.stdout.write(`Draft prepared: ${size}\n`);

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
    console.log(`\nCheck logs: ${logFile}`);
    console.log(`\nOperation completed.`);
}

function makeProgressMessage(success: number, fail: number, total: number) {
    // next line is never shorter than previous line
    // only \r is fine to be used with stdout
    return `File moved ${success} out of ${total}${fail ? ` (${fail} failed)` : ""}\r`;
}