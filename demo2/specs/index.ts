import * as fs from "fs";
import * as Mocha from "mocha";
import * as path from "path";
import * as pulumi from "@pulumi/pulumi"

export function runTests() {
    const mocha = new Mocha({ timeout: 1000 * 60 * 0 })

    // only keep the .ts files, and skip this file
    const testDir = __dirname;
    fs.readdirSync(testDir).
        filter(file => file.endsWith(".ts") && file !== "index.ts").
        forEach(file => { mocha.addFile(path.join(testDir, file)); });

    // Now run the tests
    console.log(`Running Mocha Tests: ${mocha.files}`);
    mocha.reporter("spec").run(failures => {
        process.exitCode = failures ? 1 : 0;
    });
}

export function promise<T>(output: pulumi.Output<T>): Promise<T | undefined> {
    return (output as any).promise() as Promise<T>;
}