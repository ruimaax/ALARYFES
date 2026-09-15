// API del panel de gestión en Cloudflare: /api/admin/*.
import { manejarAdmin } from "../../../src/server/admin";
import { entornoCloudflare, type EnvCloudflare } from "../../../src/server/cloudflare";

export const onRequest = ({ request, env }: { request: Request; env: EnvCloudflare }) =>
  manejarAdmin(request, entornoCloudflare(env));
