const run = (cmd: string[]) => new Deno.Command(cmd[0], { args: cmd.slice(1) }).output();

function text(dec: Uint8Array) { return new TextDecoder().decode(dec).trim(); }

async function git(cmd: string[]) {
  const p = await run(["git", ...cmd]);
  if (p.success) return text(p.stdout);
  return undefined;
}

const tag = await git(["describe", "--tags", "--dirty", "--always"]) ?? Deno.env.get("STEAMY_VERSION") ?? "0.0.0-dev";
const commit = await git(["rev-parse", "--short", "HEAD"]) ?? "unknown";
const builtAt = new Date().toISOString();

const content = `// AUTO-GENERATED. Do not edit.
export const VERSION = ${JSON.stringify(tag)};
export const COMMIT = ${JSON.stringify(commit)};
export const BUILT_AT = ${JSON.stringify(builtAt)};
`;
await Deno.mkdir("src", { recursive: true });
await Deno.writeTextFile("src/version.ts", content);
console.log(`Wrote src/version.ts => ${tag} (${commit})`);