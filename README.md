# Steamy

## Getting Started

`steamy` - shows help

`steamy launch <name>` - launches a game if a single result was found

`steamy launch ascent -a 979690` - launches the ascent game assuming the user
has both the game and soundtrack "installed"

### Installation from locally compiled binary

#### Linux
It is suggested to use the pre-compiled binary for the best experience. This assumes you have a `.bin` directory
in your home directory and that the directory is in your `$PATH`. 

- `deno task build` - This commands will create a directory `bin` at the root of the project with binaries for linux, mac, and windows.
- `ln -s /path/to/source/project/bin/steamy-linux-x86_64 $HOME/.bin/steamy` - This will create a symlink to the binary in your `.bin` directory.

### Uninstallation

- `rm $HOME/.bin/steamy` - This will remove the symlink to the binary.

### Development

To test the CLI locally:

- `deno run -A ./src/main.ts [command] <args>` -- This runs the CLI locally with a JIT compiled binary.

## Usage Examples

TODO
