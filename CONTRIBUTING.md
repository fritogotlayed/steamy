### Reviewers

Thank you for contributing to the project! Your reviews are invaluable in ensuring the fixes and features you review
work as intended. We appreciate your time and effort in helping us improve the project.

- `deno task build` - This commands will create a directory `bin` at the root of the project with binaries for linux, mac, and windows.
- `ln -s /path/to/source/project/bin/steamy-linux-x86_64 $HOME/.bin/steamy` - This will create a symlink to the binary in your `.bin` directory.

When reviewing pull requests, please ensure that:

- The code follows the project's coding standards and conventions.
- The code is well-documented and includes appropriate comments.
- The code is tested and passes all existing tests.
- The code does not introduce any new bugs or regressions.

A quick checklist for reviewing pull requests:

- Stash or commit any unstaged changes for any work you are doing!
- Check out the branch for the pull request and run / execute any new functionality
    - Make sure to make any backups of configuration files that are touched as part of the pull request!
- If all looks good, comment on the pull request and tag a reviewer.
- If there are any issues, comment including relevant details:
    - If it's a code or output issue, please include what appears incorrect to you and how you would like it fixed.

### Development

1. `deno install` - Install the dependencies for the CLI.
2. `deno task setup` - This will generate a version.ts file that is required for the CLI to run.

To test the CLI locally:

- `deno run -A ./src/main.ts [command] <args>` -- This runs the CLI locally with a JIT compiled binary.
