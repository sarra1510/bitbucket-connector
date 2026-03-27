export interface BitbucketConfig {
  baseUrl: string;
  user: string;
  token?: string;
  password?: string;
  project: string;
  repo: string;
}

export interface RepoInfo {
  name: string;
  description: string;
  project: { name: string; key: string };
  state: string;
  cloneUrls: { ssh?: string; http?: string };
}

export interface Branch {
  id: string;
  displayId: string;
  isDefault: boolean;
  latestCommit: string;
}

export interface FileItem {
  name: string;
  type: "FILE" | "DIRECTORY";
  path: string;
  size?: number;
}

export interface FileContent {
  lines: string[];
  path: string;
  size: number;
  branch?: string;
}

export interface Commit {
  id: string;
  displayId: string;
  message: string;
  author: { name: string; emailAddress: string };
  authorTimestamp: number;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: string;
  author: { user: { displayName: string; name: string } };
  fromRef: { displayId: string };
  toRef: { displayId: string };
  createdDate: number;
  updatedDate: number;
}
