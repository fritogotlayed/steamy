## Release Process

1. Checkout main and ensure you are sync'd with origin main
2. Run `git tag -a v0.0.0` and `git push --tags`
3. GitHub Actions handles QA, build, and release automatically

To add custom notes, edit the release in the GitHub UI after the workflow completes.
