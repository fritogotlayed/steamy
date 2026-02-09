This is a release checklist until the release process is automated

1. Checkout main and ensure you are sync'd with origin main
2. run `git tag -a v0.0.0` and `git push --tags`
3. run `deno task release-build`
4. In GH, create a new release with the tag and release notes
   a. Remember to attach the binaries