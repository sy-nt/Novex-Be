type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type RouteNode = {
  root: string;
} & Partial<Record<Method, string>>;

export type Route = {
  version: string;
  [key: string]: string | RouteNode;
};
