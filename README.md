# Steamy

Welcoming to Steamy! Steamy started as a CLI wrapper for Steam that makes launching games from the terminal easy. From
there, it has grown into a more general purpose CLI wrapper for Steam, Proton, and other game related utilities. The
project is maintained by volunteers and contributions are welcome!

## Getting Started

`steamy` - shows help

`steamy launch <name>` - launches a game if a single result was found

`steamy launch ascent -a 979690` - launches the ascent game assuming the user
has both the game and soundtrack "installed"

`steamy proton list` - lists all proton versions installed and their associated games

`steamy proton prune` - removes all proton versions that are not associated with any games

`steamy proton download` - checks for and downloads the latest version of GE proton

### Installation from locally compiled binary

#### Linux
It is suggested to use the pre-compiled binary for the best experience. This assumes you have a `.bin` directory
in your home directory and that the directory is in your `$PATH`. You can download the binary from the
[releases page](https://github.com/fritogotlayed/steamy/releases). Once downloaded, you can either symlink the binary
to your `$PATH` or add the file to your `.bin` directory. Remember to rename the file to `steamy` and make it executable!

Ex: `ln -s /path/to/steamy-linux-x86_64 $HOME/.bin/steamy`

Alternatively, you can compile the binary yourself if you have [deno](https://deno.land/) installed. It is recommended
to use the latest stable version of deno. If you plan on contributing to the project, please ensure you have read the
[CONTRIBUTING.md](https://github.com/fritogotlayed/steamy/blob/main/CONTRIBUTING.md) file.

### Uninstallation

- `rm $HOME/.bin/steamy` - This will remove the symlink to the binary or the binary itself depending on how you installed it.

## Usage Examples

### Getting in-line help

`steamy --help` - displays the help menu for the CLI

```terminaloutput
~ ❯❯❯ steamy --help

Usage:   steamy <sub-command> [OPTIONS]
Version: v0.1.4-1-geba06bc (eba06bc) built at 2025-12-10T22:06:19.028Z

Description:

  Steam CLI wrapper to make launching games from terminal easy

Options:

  -h, --help     - Show this help.
  -V, --version  - Show the version number for this program.

Commands:

  openPrefix, open-prefix  <name...>  - Open the prefix folder
  launch                   <name...>  - Attempts to launch a steam game by name
  gameTweaks, game-tweaks  <name...>  - Tweaks for a specific games
  proton                              - Helpers to manage Proton versions
```

`steamy <command> --help` - displays the help menu for a specific command

```terminaloutput
~ ❯❯❯ steamy gameTweaks --help

Usage:   steamy gameTweaks <name...>
Version: v0.1.4-1-geba06bc (eba06bc) built at 2025-12-10T22:06:19.028Z

Description:

  Tweaks for a specific games

Options:

  -h, --help              - Show this help.
  -v, --verbose           - Show verbose output
  -a, --appId    <appId>  - The AppId to use when filtering by name is ambiguous
```

### Using game tweaks

Currently there is not a list of tweaks available. To see the available tweaks for a game, run `steamy gameTweaks <name>`.
The name can be a partial match and will return all games that match the partial name. For example,
`steamy gameTweaks ascent` will return all games that have "Ascent" in their name. A game tweak selector is then launched
for you to select the tweak they want to apply. This list is specific to the game so your experience may vary.

For example, if we wanted to apply the a tweak for the game "Red Dead Redemption 2" we can run: `steamy gameTweaks red dead`
