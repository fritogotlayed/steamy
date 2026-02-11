export type GitHubReleaseAsset = {
  name: string;
  content_type: string;
  browser_download_url: string;
  size: number;
};

export type GitHubRelease = {
  id: number;
  tag_name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
};

export type UpdateCacheData = {
  lastChecked: string;
  latestVersion: string;
  releaseUrl: string;
};
