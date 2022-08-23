"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("yargs/helpers");
const yargs_1 = __importDefault(require("yargs/yargs"));
const args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .option("path", { alias: "p", type: "string", describe: "Path to the folder containing photos." })
    .argv;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const { path: p = "./" } = yield args;
        const root = path_1.default.resolve(__dirname, p);
        console.log(`timewising photos in ${root}`);
        const drafts = new Map();
        const errors = new Map();
        const files = yield promises_1.default.readdir(root);
        console.log(`files found: ${files.length}`);
        let success = 0;
        process.stdout.write(`making draft...\r`);
        for (const fName of files) {
            const fPath = path_1.default.resolve(root, fName);
            try {
                const stats = yield promises_1.default.lstat(fPath);
                if (!stats.isFile() || stats.isSymbolicLink())
                    return;
                const { mtime, ctime } = stats;
                const createTime = mtime < ctime ? mtime : ctime;
                const folder = `${createTime.getFullYear()}/${(createTime.getMonth() + 1).toString(10).padStart(2, '0')}`;
                drafts.set(fPath, path_1.default.resolve(root, folder, fName));
            }
            catch (err) {
                errors.set(fPath, `${err}`);
            }
        }
        const size = drafts.size;
        process.stdout.write(`draft prepared [total: ${size}]\n`);
        process.stdout.write(makeProgressMessage(success, errors.size, size));
        for (const [src, dest] of drafts) {
            try {
                yield promises_1.default.mkdir(dest.substring(0, dest.lastIndexOf(path_1.default.sep)), { recursive: true }).catch(() => { });
                yield promises_1.default.rename(src, dest);
                success++;
            }
            catch (err) {
                errors.set(src, `${err}`);
            }
            process.stdout.write(`\r${makeProgressMessage(success, errors.size, size)}`);
        }
        if (errors.size) {
            console.log(`\nerrors: `);
            for (const [src, err] of errors) {
                console.error(`${src}: ${err}`);
            }
        }
        console.log(`\noperation completed.`);
    });
}
function makeProgressMessage(success, fail, total) {
    return `file moved ${success} out of ${total}${fail ? ` (${fail} failed)` : ""}\r`;
}
start();
//# sourceMappingURL=index.js.map