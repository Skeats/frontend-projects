import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

export class UCI {
    private enginePath: string;
    private engine: ChildProcessWithoutNullStreams;

    public constructor(enginePath: string) {
        this.enginePath = enginePath;
        this.engine = spawn(this.enginePath);
        this.engine.stdin.write("uci");
        this.engine.stdout.on('data', (data) => console.log(data));
    }
}
